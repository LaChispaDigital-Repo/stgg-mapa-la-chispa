// scripts/01_migrate_regiones.js
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

// Derivar __dirname para módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const regionesFilePath = path.join(__dirname, '../public/geojson/regiones.json');

async function migrateRegiones() {
  try {
    console.log(`Leyendo regiones desde: ${regionesFilePath}`);
    const regionesData = JSON.parse(fs.readFileSync(regionesFilePath, 'utf-8'));

    if (!Array.isArray(regionesData)) {
      console.error('Error: El archivo regiones.json no contiene un array.');
      return;
    }

    console.log(`Se encontraron ${regionesData.length} regiones para migrar.`);

    const regionesToInsert = regionesData.map(region => ({
      id_region: region.id,
      nombre_region: region.name,
      slug_region: region.slug,
      centroide_lat: region.centroide && region.centroide.length > 0 ? region.centroide[0] : null,
      centroide_lon: region.centroide && region.centroide.length > 1 ? region.centroide[1] : null,
    }));

    console.log('Intentando insertar/actualizar regiones en Supabase...');
    const { data, error } = await supabase
      .from('regiones')
      .upsert(regionesToInsert, { onConflict: 'id_region' });

    if (error) {
      console.error('Error al insertar/actualizar regiones en Supabase:', error);
      return;
    }

    console.log('Regiones migradas exitosamente a Supabase.');
    if (data) {
      // En Supabase v2, upsert puede devolver null para data si no hay errores y las filas ya existían y no cambiaron.
      // O puede devolver los datos insertados/actualizados.
      console.log(`Respuesta de Supabase (puede ser null si no hubo cambios):`, data);
    }

  } catch (err) {
    console.error('Ocurrió un error durante la migración de regiones:', err);
  }
}

migrateRegiones();
