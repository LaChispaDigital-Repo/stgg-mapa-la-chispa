// scripts/02_migrate_geo_dem_data.js
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY deben estar definidos en el archivo .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const datosDirPath = path.join(__dirname, '../public/datos');

// --- Función para actualizar source metadata ---
async function updateComunaSourceMetadata(id_comuna, sourceData) {
  const { data, error } = await supabase
    .from('comunas')
    .update({
      source_name: sourceData.source_name,
      source_date: sourceData.source_date,
      extract_date: sourceData.extract_date
    })
    .eq('id_comuna', id_comuna);
    
  if (error) {
    console.error(`Error actualizando metadata de source para comuna ${id_comuna}:`, error.message);
  } else {
    console.log(`✓ Metadata de source actualizada para comuna ${id_comuna}`);
  }
  return data;
}

// --- Procesar archivos de datos ---
async function processSourceMetadata() {
  console.log('\n--- Actualizando metadata de source en comunas ---');
  const files = fs.readdirSync(datosDirPath).filter(file => file.endsWith('.json'));

  for (const file of files) {
    console.log(`\nProcesando archivo: ${file}`);
    const filePath = path.join(datosDirPath, file);
    const demogData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    const metadata = demogData.metadata;

    if (!metadata) {
      console.warn(`Archivo ${file} no tiene metadata. Saltando.`);
      continue;
    }

    const sourceData = {
      source_name: metadata.source_name || metadata.source || null,
      source_date: metadata.source_date || null,
      extract_date: metadata.extract_date || null
    };

    await updateComunaSourceMetadata(metadata.t_com, sourceData);
  }
  
  console.log('\n--- Actualización de metadata completada ---');
}

// --- Ejecución principal ---
async function main() {
  await processSourceMetadata();
  console.log('\nProceso completado exitosamente.');
}

main().catch(console.error);