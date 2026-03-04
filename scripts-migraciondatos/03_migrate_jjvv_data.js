import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Reemplazo de __dirname para ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar .env desde la raíz del proyecto (un nivel arriba de /scripts-migraciondatos)
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Configuración de Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const pathCarpeta = process.argv[2];
if (!pathCarpeta) {
  console.error("Por favor ingresa una carpeta. (Ej: 'node 03_migrate_jjvv_data.js Valparaiso')");
  process.exit(1);
}

const datosDir = path.join(__dirname, '../public/datos/' + pathCarpeta + '/jjvv');

async function migrateJuntasVecinos() {
  console.log('Iniciando migración de datos de Juntas de Vecinos...');

  try {
    const files = fs.readdirSync(datosDir);
    const jjvvFiles = files.filter(file => file.endsWith('-JJVV.json'));

    if (jjvvFiles.length === 0) {
      console.log('No se encontraron archivos *-JJVV.json en /public/datos/' + pathCarpeta + '/jjvv');
      return;
    }

    for (const fileName of jjvvFiles) {
      const idComuna = fileName.split('-JJVV.json')[0];
      const filePath = path.join(datosDir, fileName);
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const jjvvDataArray = JSON.parse(fileContent);

      console.log(`Procesando ${fileName} para la comuna ${idComuna}. Encontradas ${jjvvDataArray.length} JJVV.`);

      // Verificar si la comuna existe
      const { data: comunaExists, error: comunaError } = await supabase
        .from('comunas')
        .select('id_comuna')
        .eq('id_comuna', idComuna)
        .maybeSingle();

      if (comunaError) {
        console.error(`Error verificando la comuna ${idComuna}:`, comunaError.message);
        continue;
      }
      if (!comunaExists) {
        console.warn(`Advertencia: La comuna con id_comuna = ${idComuna} no existe en la tabla 'comunas'. Saltando JJVV de este archivo.`);
        continue;
      }

      for (const jjvv of jjvvDataArray) {
        const { nombre, direccion, latitud, longitud } = jjvv;

        const insertData = {
          nombre: nombre,
          direccion: direccion,
          latitud: typeof latitud === 'number' ? latitud : null,
          longitud: typeof longitud === 'number' ? longitud : null,
          id_comuna: idComuna,
        };

        if (typeof latitud === 'number' && typeof longitud === 'number') {
          const { data: geomData, error: geomError } = await supabase.rpc('st_setsrid', {
            geom: supabase.rpc('st_makepoint', { x: longitud, y: latitud }),
            srid: 4326
          });

          if (geomError) {
            console.error(`Error generando geometría para JJVV '${nombre}':`, geomError.message);
            insertData.geometria = null;
          } else {
            insertData.geometria = geomData;
          }
        } else {
          insertData.geometria = null;
        }

        const { error: insertError } = await supabase
          .from('juntas_vecinos')
          .insert(insertData);

        if (insertError) {
          console.error(`Error insertando JJVV '${nombre}' para la comuna ${idComuna}:`, insertError.message);
        }
      }
      console.log(`Finalizado el procesamiento de ${fileName}.`);
    }

    console.log('Migración de Juntas de Vecinos completada.');

  } catch (error) {
    console.error('Error general durante la migración de Juntas de Vecinos:', error.message);
  }
}

migrateJuntasVecinos();
