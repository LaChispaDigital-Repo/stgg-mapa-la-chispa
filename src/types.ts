// src/types.ts

export interface RegionIndexEntry {
  id_region: string;
  nombre_region: string;
  slug_region: string;
  latitud_region: number;
  longitud_region: number;
  zoom_region: number;
}

export interface Region {
  type: string;
  name: string;
  crs: any;
  features: any[];
}

export interface UVComunaIndex {
  [comunaId: string]: string[]; // Array of UV IDs
}

export interface UVData {
  id_uv: string;
  nombre_uv: string;
  cod_comuna: string;
  nombre_comuna: string;
  cod_provincia: string;
  nombre_provincia: string;
  cod_region: string;
  nombre_region: string;
  area_km2: number;
  perimetro_km: number;
  nota_desarrollo_social: number;
  indice_prioridad_social: number;
  total_viviendas: number;
  total_poblacion: number;
  geometria?: any; // GeoJSON geometry object
}

export interface UnidadVecinal {
  id_uv: string;
  nombre_uv: string;
  // Otros campos relevantes de la UV si los hay
}

export interface UnidadVecinalData extends UVData {
  // Podría ser igual a UVData o extenderla si hay más campos específicos
  // que se cargan al seleccionar una UV
  totales_generales?: {
    // Estructura de los totales generales si es necesario
    [key: string]: any; // Ejemplo, ajustar según datos reales
  };
}

// Tipos para Juntas de Vecinos (JJVV)
export interface GeoJSONPoint {
  type: "Point";
  coordinates: [number, number]; // [longitud, latitud]
}

export interface JuntaVecinal {
  id_jjvv: number;
  nombre: string;
  direccion: string | null;
  latitud: number | null;
  longitud: number | null;
  id_comuna: string;
  geometria_geojson: string | null; // String GeoJSON desde la RPC
  geometria?: GeoJSONPoint | null; // Objeto GeoJSON parseado, opcional
}

// Tipo para los datos que vienen directamente de la RPC para JJVV
export interface JuntaVecinalRPCResponse {
  id_jjvv: number;
  nombre: string;
  direccion: string | null;
  latitud: number | null;
  longitud: number | null;
  id_comuna: string;
  geometria_geojson: string | null; 
}

// Asegúrate de que FeatureCollection y otros tipos de GeoJSON estén disponibles
// Si no los importas globalmente, puedes definirlos o importarlos aquí.
// Por ejemplo, si usas la librería 'geojson'
// import { FeatureCollection as GeoJSONFeatureCollection, Point as GeoJSONPointType } from 'geojson';
// export type FeatureCollection = GeoJSONFeatureCollection;
// export type Point = GeoJSONPointType;
