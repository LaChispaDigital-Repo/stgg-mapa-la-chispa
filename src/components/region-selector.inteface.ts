export interface RegionIndexEntry {
  id: number;
  name: string;
  slug: string;
  centroide: [number, number];
}

export interface UnidadVecinalFeature {
  type: "Feature";
  geometry: {
    type: "Polygon" | "MultiPolygon";
    coordinates: number[][][] | number[][][][];
  };
  properties: {
    t_com: string;
    t_com_nom: string;
    t_prov_nom: string;
    t_reg_nom: string;
    t_uv_nom: string;
    [key: string]: any;
  };
}

export interface UnidadVecinalGeoJSON {
  type: "FeatureCollection";
  features: UnidadVecinalFeature[];
}

export interface CommuneData {
  metadata: {
    t_reg_ca: string;
    t_prov_ca: string;
    t_com: string;
    t_com_nom: string;
    totalesGenerales: UnidadVecinalData;
  };
  datos: UnidadVecinalData[];
}

export interface UnidadVecinalData {
  "NOMBRE UNIDAD VECINAL": string;
  "N° UNIDAD VECINAL": number;
  "Número total de personas": number;
  "Total de Hombres": number;
  "Total de Mujeres": number;
  "Total de personas de 0 a 5 años": number;
  "Total de personas de 6 a 14 años": number;
  "Total de personas de 15 a 64 años": number;
  "Total de personas de 65 y más años": number;
  "Cantidad de hogares": number;
  "Total viviendas": number;
}
