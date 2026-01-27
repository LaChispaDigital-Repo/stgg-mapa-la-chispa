# ¿Qué es una Función RPC en Supabase?

Una Función RPC (Remote Procedure Call) es una función de base de datos personalizada que creas y guardas en Supabase (usando el lenguaje SQL/PLpgSQL) y que puedes llamar por su nombre desde tu frontend a través de la API de Supabase.

Piensa en ella como crear tu propia "habilidad" especial para tu backend. En lugar de limitarte a las operaciones básicas (select, insert, update), creas un comando a medida, como por ejemplo: get_juntas_vecinos_por_comuna, que ejecuta una lógica más compleja directamente en el servidor de la base de datos.



-----------------------------------------




# El Proceso: De JSON a Supabase en 3 Pasos

## Paso 1: Backend - Preparar Supabase (Lo haces una vez)

### Modelar
Mira tu archivo `datos.json`. Si tienes un array de objetos, cada clave de un objeto (como `nombre`, `direccion`, `latitud`) será una columna en tu nueva tabla.

### Crear Tabla
Ve a la interfaz de Supabase → **Table Editor** → **Create a new table**. Nómbrala (ej. `ubicaciones`) y añade las columnas con sus tipos de dato (`text`, `float8`, `boolean`, etc.).

### Crear Script de Migración
En tu máquina local (no en tu proyecto React), crea un archivo `migracion.js`. Este script leerá tu JSON y subirá cada elemento a la tabla que creaste.

#### Ejemplo de migracion.js (usando Node.js):

```javascript
// Necesitas instalar node, luego: npm install @supabase/supabase-js
import { createClient } from '@supabase/supabase-js';
import fs from 'fs'; // Para leer archivos

// Configura tu Supabase (usa variables de entorno en un proyecto real)
const supabase = createClient('https://TU_PROYECTO.supabase.co', 'TU_SUPER_SECRET_SERVICE_KEY');

// Lee tus datos locales
const datosJSON = JSON.parse(fs.readFileSync('./ruta/a/tus/datos.json', 'utf-8'));

async function migrar() {
  console.log('Iniciando migración...');
  // 'ubicaciones' es el nombre de tu tabla en Supabase
  const { data, error } = await supabase.from('ubicaciones').insert(datosJSON);

  if (error) {
    console.error('Error en la migración:', error);
  } else {
    console.log('¡Migración completada! Datos insertados:', data.length);
  }
}

migrar();
```

> Ejecutas este script una sola vez desde tu terminal (`node migracion.js`) y tus datos ya estarán en la nube.

## Paso 2: Frontend - Conectar React con Supabase

### Instalar y Configurar
En tu proyecto React, ejecuta `npm install @supabase/supabase-js`. Crea un archivo `src/supabaseClient.js` para configurar la conexión (esta vez con la anon key, que es pública).

### Variables de Entorno
Guarda tus claves en un archivo `.env` en la raíz de tu proyecto. En nuestro caso, estas variables las dejaré en nuestro moonday. 

```env
# .env
VITE_SUPABASE_URL="https://TU_PROYECTO.supabase.co"
VITE_SUPABASE_ANON_KEY="TU_ANON_KEY_PUBLICA"
```

## Paso 3: Frontend - Actualizar Componentes

Ahora, modificas los componentes que usaban el JSON para que en su lugar llamen a Supabase.

### Ejemplo Rápido: Antes y Después en un Componente React
Imagina un componente que muestra una lista de nombres desde un JSON.

#### ANTES (con JSON local):

```javascript
// src/components/ListaUbicaciones.jsx

import React from 'react';
import datos from '../../data/ubicaciones.json'; // 1. Importación directa

function ListaUbicaciones() {
  // 2. Los datos están disponibles de inmediato
  return (
    <ul>
      {datos.map(ubicacion => (
        <li key={ubicacion.id}>{ubicacion.nombre}</li>
      ))}
    </ul>
  );
}

export default ListaUbicaciones;
```

#### DESPUÉS (con Supabase):

```javascript
// src/components/ListaUbicaciones.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient'; // 1. Importas tu cliente configurado

function ListaUbicaciones() {
  const [ubicaciones, setUbicaciones] = useState([]); // 2. Estado inicial vacío
  const [loading, setLoading] = useState(true);       // Estado para la carga

  useEffect(() => {
    // 3. Función asíncrona para pedir los datos
    async function getUbicaciones() {
      const { data } = await supabase.from('ubicaciones').select('id, nombre'); // Pides solo lo que necesitas
      setUbicaciones(data);
      setLoading(false);
    }

    getUbicaciones(); // La llamas cuando el componente se monta
  }, []); // El array vacío [] asegura que se ejecute solo una vez

  if (loading) {
    return <div>Cargando...</div>; // 4. Muestras un mensaje de carga
  }

  return (
    <ul>
      {ubicaciones.map(ubicacion => (
        <li key={ubicacion.id}>{ubicacion.nombre}</li>
      ))}
    </ul>
  );
}

export default ListaUbicaciones;