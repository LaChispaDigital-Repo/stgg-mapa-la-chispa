require('dotenv').config({ path: '../.env' });
const supabaseClient = require('@supabase/supabase-js'); // Changed import
const fs = require('fs');
const path = require('path');

// Configuración de Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY; // Usar la anon key para scripts de cliente si RLS lo permite, o la service_role key si es necesario
const supabase = supabaseClient.createClient(supabaseUrl, supabaseKey); // Changed usage

const datosDir = path.join(__dirname, '../public/datos');

async function migrateJuntasVecinos() {
  console.log('Iniciando migración de datos de Juntas de Vecinos...');

  try {
    const files = fs.readdirSync(datosDir);
    const jjvvFiles = files.filter(file => file.endsWith('-JJVV.json'));

    if (jjvvFiles.length === 0) {
      console.log('No se encontraron archivos *-JJVV.json en public/datos/');
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
        continue; // Saltar este archivo si hay error verificando la comuna
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
          // Solo crear geometría si latitud y longitud son números válidos
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
          // Podrías decidir si continuar con las siguientes o detenerte
        } else {
          // console.log(`JJVV '${nombre}' insertada para la comuna ${idComuna}.`);
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
