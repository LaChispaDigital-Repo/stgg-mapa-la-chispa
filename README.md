# Mapa Interactivo La Chispa

Una aplicación de mapa interactivo diseñada para visualizar datos geográficos y demográficos de Chile. El proyecto está construido con React, TypeScript y Vite, y utiliza Supabase como backend para la gestión y consulta de datos geoespaciales.

## Arquitectura Tecnológica

- **Frontend:** React, TypeScript, Vite
- **Mapa:** React-Leaflet, Leaflet.markercluster
- **Gestión de Estado:** Zustand
- **Backend y Base de Datos:** Supabase (PostgreSQL con extensión PostGIS)
- **Estilos:** Tailwind CSS

## Funcionalidades Clave

- **Visualización de Mapas:** Navegación fluida con controles de zoom y desplazamiento.
- **Filtros Dinámicos:** Selección de región, comuna y unidad vecinal para cargar y visualizar datos geoespaciales de forma dinámica desde la base de datos.
- **Capas de Datos Geoespaciales:** Renderización de polígonos para unidades vecinales y marcadores para juntas de vecinos.
- **Búsqueda y Selección:** Filtro por nombre para encontrar juntas de vecinos específicas dentro de una comuna.
- **Información Demográfica:** Visualización de gráficos y datos demográficos asociados a la comuna o unidad vecinal seleccionada. **PENDIENTE**

## Instalación y Configuración

Sigue estos pasos para levantar el proyecto en tu entorno local.

1.  **Clonar el repositorio:**
    ```bash
    git clone <URL_DEL_REPOSITORIO>
    cd mapa-lachispa-main
    ```

2.  **Instalar dependencias:**
    ```bash
    npm install
    ```

3.  **Configurar variables de entorno:**
    Crea un archivo `.env` en la raíz del proyecto, basándote en el archivo `.env.example`. Este archivo es necesario para conectar con la instancia de Supabase.

    ```env
    VITE_SUPABASE_URL="URL_DE_TU_PROYECTO_SUPABASE"
    VITE_SUPABASE_ANON_KEY="TU_ANON_KEY_DE_SUPABASE"
    ```

4.  **Ejecutar el proyecto:**
    ```bash
    npm run dev
    ```

    La aplicación estará disponible en `http://localhost:5173` (o el puerto que indique Vite).

1.  **Unidades Vecinales:** Muestra los polígonos que definen las áreas de las unidades vecinales de la comuna.
2.  **Juntas de Vecinos:** Muestra la ubicación de aproximadamente 1500 juntas de vecinos a través de marcadores individuales, agrupados en clusters para una mejor visualización.

---

## Instrucciones de Instalación y Uso

### Prerrequisitos
- Node.js y npm instalados.

### Pasos

1.  **Clonar el repositorio**
    (Reemplazar `<URL_DEL_REPOSITORIO>` con la URL real)
    ```bash
    git clone <URL_DEL_REPOSITORIO>
    ```

2.  **Ingresar al directorio del proyecto e instalar dependencias**
    ```bash
    cd mapa-lachispa
    npm install
    ```

3.  **Iniciar el servidor en modo desarrollo**
    ```bash
    npm run dev
    ```

4.  **Abrir el navegador y acceder a la aplicación**
    La aplicación estará disponible en la URL que indique la consola, generalmente:
    ```plaintext
    http://localhost:5173
    ```

5.  **Detener el servidor**
    En la terminal donde se ejecuta `npm run dev`, presionar:
    ```bash
    Ctrl + C
    ```
