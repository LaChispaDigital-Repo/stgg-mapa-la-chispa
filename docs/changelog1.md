### Changelog: Migración de Datos JSON a Supabase

Hola equipo,

Este documento resume la migración completa del sistema de datos del proyecto. Pasamos de usar archivos JSON locales a una base de datos PostgreSQL gestionada con Supabase para mejorar el rendimiento, la escalabilidad y la mantenibilidad de la aplicación.

**El Proceso de Migración:**

1.  **Diseño de la Base de Datos:**
    *   Analizamos la estructura de los archivos JSON en la carpeta `public/`.
    *   Diseñamos un esquema relacional en Supabase con tablas para `regiones`, `comunas`, `unidades_vecinales` y `juntas_vecinos`.
    *   Utilizamos el tipo de dato `geometry` de PostGIS para almacenar la información geoespacial (polígonos y puntos).

2.  **Migración de Datos:**
    *   Creamos scripts en Node.js para leer los archivos JSON e insertarlos en las nuevas tablas de Supabase.
    *   Durante el proceso, se limpiaron y estandarizaron los datos para asegurar la consistencia en la base de datos.

3.  **Refactorización del Frontend (React + Zustand):**
    *   **Conexión:** Integramos el cliente de Supabase (`@supabase/supabase-js`) en el proyecto, centralizando la configuración en `src/supabaseClient.ts`.
    *   **Gestión de Estado (`useMapStore.ts`):** Refactorizamos por completo el store de Zustand. Las acciones que antes leian archivos locales ahora realizan llamadas asíncronas a Supabase para obtener los datos.
    *   **Optimización con Funciones RPC:** Para hacer las consultas más eficientes, creamos dos funciones SQL clave en Supabase:
        *   `get_region_geojson`: Devuelve un único GeoJSON con toda la información de una región (límites de comunas y polígonos de unidades vecinales). Esto redujo drásticamente el número de peticiones al servidor.
        *   `get_juntas_vecinos_por_comuna`: Obtiene las JJVV filtradas por la comuna seleccionada.

        Pueden crear funciones RPC en Supabase para optimizar las consultas y reducir el número de peticiones al servidor. TIENEN ACCESO A TRAVES DE LA INVITACION QUE LES ENVIÉ.
        
    *   **Componentes React:** Modificamos todos los componentes relacionados con los filtros y el mapa (`RegionSelector`, `CommuneSelector`, `JuntasVecinosLayer`, `FiltroJJVV`, etc.) para que consumieran los nuevos datos y acciones del store. La UI ahora es completamente reactiva a los datos de la base de datos.

**Resumen de Cambios Clave:**

La fuente de datos ya no son archivos estáticos, sino una base de datos robusta y escalable. La carga de datos ahora es asíncrona y se gestiona de forma centralizada, lo que mejora el rendimiento y facilita el mantenimiento. Este cambio sienta las bases para futuras funcionalidades y una gestión de datos mucho más eficiente.
