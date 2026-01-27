// scripts/02_migrate_geo_dem_data.js
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Cargar variables de entorno desde .env
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY deben estar definidos en el archivo .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const geojsonDirPath = path.join(__dirname, '../public/geojson');
const datosDirPath = path.join(__dirname, '../public/datos');

// --- Helper Functions ---

/**
 * Sanitizes a value to be inserted into a numeric database column.
 * Converts '*' and non-numeric values to null.
 * @param {*} value The value to sanitize.
 * @returns {number|null} The sanitized number or null.
 */
function sanitizeNumber(value) {
  if (typeof value === 'number' && !isNaN(value)) {
    return value;
  }
  if (typeof value === 'string') {
    if (value.trim() === '*' || value.trim().toLowerCase() === 'no def') {
      return null;
    }
    const num = parseInt(value, 10);
    return isNaN(num) ? null : num;
  }
  return null;
}

async function upsertProvincia(provincia) {
  const { data, error } = await supabase.from('provincias').upsert(provincia, { onConflict: 'id_provincia' });
  if (error) console.error(`Error upserting provincia ${provincia.id_provincia}:`, error.message);
  return data;
}

async function upsertComuna(comuna) {
  const { data, error } = await supabase.from('comunas').upsert(comuna, { onConflict: 'id_comuna' });
  if (error) console.error(`Error upserting comuna ${comuna.id_comuna}:`, error.message);
  return data;
}

async function upsertUnidadVecinal(uv) {
  const { data, error } = await supabase.from('unidades_vecinales').upsert(uv, { onConflict: 'id_uv' });
  if (error) console.error(`Error upserting UV ${uv.id_uv}:`, error.message, uv.nombre_uv);
  return data;
}

async function updateComunaTotals(id_comuna, totals) {
  const { data, error } = await supabase.from('comunas').update(totals).eq('id_comuna', id_comuna);
  if (error) console.error(`Error updating totals for comuna ${id_comuna}:`, error.message);
  return data;
}

async function updateUnidadVecinalStats(id_uv, stats) {
  const { data, error } = await supabase.from('unidades_vecinales').update(stats).eq('id_uv', id_uv);
  if (error) console.error(`Error updating stats for UV ${id_uv}:`, error.message);
  return data;
}

// --- Phase 1: Process GeoJSON files ---
async function processGeoJSONFiles() {
  console.log('\n--- Iniciando Fase 1: Procesando archivos GeoJSON ---');
  const files = fs.readdirSync(geojsonDirPath).filter(file => file.endsWith('.json') && file !== 'regiones.json');

  for (const file of files) {
    console.log(`Procesando archivo GeoJSON: ${file}`);
    const filePath = path.join(geojsonDirPath, file);
    const geojsonData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    if (geojsonData.type !== 'FeatureCollection' || !Array.isArray(geojsonData.features)) {
      console.warn(`Archivo ${file} no es un FeatureCollection válido. Saltando.`);
      continue;
    }

    for (const feature of geojsonData.features) {
      const props = feature.properties;
      const geometry = feature.geometry;

      if (!props || !geometry) continue;

      await upsertProvincia({
        id_provincia: props.t_prov_ca,
        nombre_provincia: props.t_prov_nom,
        id_region: props.t_reg_ca ? parseInt(props.t_reg_ca) : null
      });

      await upsertComuna({
        id_comuna: props.t_com,
        nombre_comuna: props.t_com_nom,
        id_provincia: props.t_prov_ca
      });

      await upsertUnidadVecinal({
        id_uv: props.t_id_uv_ca,
        nombre_uv: props.t_uv_nom,
        numero_uv: props.uv_carto,
        id_comuna: props.t_com,
        geometria: geometry
      });
    }
  }
  console.log('--- Fase 1: Procesamiento de GeoJSON completado ---');
}

// --- Phase 2: Process Demographic data files ---
async function processDemographicFiles() {
  console.log('\n--- Iniciando Fase 2: Procesando archivos de datos demográficos ---');
  const files = fs.readdirSync(datosDirPath).filter(file => file.endsWith('.json'));

  for (const file of files) {
    console.log(`Procesando archivo de datos: ${file}`);
    const filePath = path.join(datosDirPath, file);
    const demogData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    const metadata = demogData.metadata;
    const datosUV = demogData.datos;

    if (!metadata || !Array.isArray(datosUV)) {
      console.warn(`Archivo ${file} no tiene la estructura esperada (metadata/datos). Saltando.`);
      continue;
    }

    const comunaTotals = {
      tot_personas: sanitizeNumber(metadata.totalesGenerales?.['Número total de personas']),
      tot_hombres: sanitizeNumber(metadata.totalesGenerales?.['Total de Hombres']),
      tot_mujeres: sanitizeNumber(metadata.totalesGenerales?.['Total de Mujeres']),
      tot_personas_0_5: sanitizeNumber(metadata.totalesGenerales?.['Total de personas de 0 a 5 años']),
      tot_personas_6_14: sanitizeNumber(metadata.totalesGenerales?.['Total de personas de 6 a 14 años']),
      tot_personas_15_64: sanitizeNumber(metadata.totalesGenerales?.['Total de personas de 15 a 64 años']),
      tot_personas_65_mas: sanitizeNumber(metadata.totalesGenerales?.['Total de personas de 65 y más años']),
      tot_hogares: sanitizeNumber(metadata.totalesGenerales?.['Cantidad de hogares']),
      tot_viviendas: sanitizeNumber(metadata.totalesGenerales?.['Total viviendas'])
    };
    await updateComunaTotals(metadata.t_com, comunaTotals);

    for (const uvStat of datosUV) {
      const nombreUvStat = uvStat['NOMBRE UNIDAD VECINAL'];
      const numeroUvStat = String(uvStat['N° UNIDAD VECINAL']);
      const idComunaActual = metadata.t_com;

      let matchedUv = null;
      
      if (numeroUvStat && numeroUvStat.toLowerCase() !== 'no def') {
        const { data: uvFoundByNumero, error: errNum } = await supabase
          .from('unidades_vecinales')
          .select('id_uv')
          .eq('id_comuna', idComunaActual)
          .eq('numero_uv', numeroUvStat)
          .single();
        if (uvFoundByNumero) matchedUv = uvFoundByNumero;
        if (errNum && errNum.code !== 'PGRST116') {
            console.warn(`Error buscando UV por número ${numeroUvStat} en comuna ${idComunaActual}: ${errNum.message}`);
        }
      }

      if (!matchedUv && nombreUvStat) {
        const { data: uvFoundByNombre, error: errNom } = await supabase
          .from('unidades_vecinales')
          .select('id_uv')
          .eq('id_comuna', idComunaActual)
          .eq('nombre_uv', nombreUvStat)
          .single();
        if (uvFoundByNombre) matchedUv = uvFoundByNombre;
        if (errNom && errNom.code !== 'PGRST116') {
            console.warn(`Error buscando UV por nombre '${nombreUvStat}' en comuna ${idComunaActual}: ${errNom.message}`);
        }
      }

      if (matchedUv && matchedUv.id_uv) {
        const uvDemographics = {
          uv_tot_personas: sanitizeNumber(uvStat['Número total de personas']),
          uv_tot_hombres: sanitizeNumber(uvStat['Total de Hombres']),
          uv_tot_mujeres: sanitizeNumber(uvStat['Total de Mujeres']),
          uv_tot_personas_0_5: sanitizeNumber(uvStat['Total de personas de 0 a 5 años']),
          uv_tot_personas_6_14: sanitizeNumber(uvStat['Total de personas de 6 a 14 años']),
          uv_tot_personas_15_64: sanitizeNumber(uvStat['Total de personas de 15 a 64 años']),
          uv_tot_personas_65_mas: sanitizeNumber(uvStat['Total de personas de 65 y más años']),
          uv_cant_hogares: sanitizeNumber(uvStat['Cantidad de hogares']),
          uv_tot_viviendas: sanitizeNumber(uvStat['Total viviendas'])
        };
        await updateUnidadVecinalStats(matchedUv.id_uv, uvDemographics);
      } else {
        console.warn(`No se encontró UV coincidente para '${nombreUvStat}' (N°: ${numeroUvStat}) en comuna ${idComunaActual}. Datos demográficos no migrados para esta UV.`);
      }
    }
  }
  console.log('--- Fase 2: Procesamiento de datos demográficos completado ---');
}

// --- Main Execution ---
async function main() {
  await processGeoJSONFiles();
  await processDemographicFiles();
  console.log('\nMigración de datos geo y demográficos completada.');
}

main().catch(console.error);
