import type {
  CommuneData,
  RegionIndexEntry,
  UnidadVecinalData,
  UnidadVecinalFeature,
  UnidadVecinalGeoJSON,
} from "../components/region-selector.inteface";
import type { JuntaVecinal } from "../types"; // Corrected import path

export interface MapStore {
  regionList: RegionIndexEntry[];
  regionGeoJSON: UnidadVecinalGeoJSON | null;
  selectedRegion: RegionIndexEntry | null;
  loading: boolean;
  position: [number, number];
  communeList: Array<{ code: string; name: string }>;
  selectedCommune: string | null;
  selectedCommuneData: CommuneData | null;
  unidadVecinalList: UnidadVecinalFeature[]; // Added based on usage in useMapStore
  selectedUnidadVecinal: string | null;
  selectedUnidadVecinalData: UnidadVecinalData | null;
  hoveredFeature: UnidadVecinalFeature | null;
  geoJsonVersion: number;
  // juntasVecinos: JuntaVecinal[]; // Replaced by juntasVecinosList
  juntasVecinosList: JuntaVecinal[]; // New state for JJVV list
  loadingJJVV: boolean; // New state for JJVV loading status
  filtroNombreJJVV: string;
  selectedJJVV: JuntaVecinal | null; // For the currently selected JJVV from search

  setSelectedCommune: (commune: string | null) => void;
  setSelectedCommuneData: (data: CommuneData | null) => void;
  setSelectedUnidadVecinal: (uv: string | null) => void;
  setSelectedUnidadVecinalData: (data: UnidadVecinalData | null) => void;
  setHoveredFeature: (feature: UnidadVecinalFeature | null) => void;
  getFilteredUVFeatures: () => UnidadVecinalFeature[];
  // setSelectedJuntasVecinos: (data: JuntaVecinal[]) => void; // To be removed
  setSelectedJJVV: (jjvv: JuntaVecinal | null) => void;

  // Actions
  setRegionGeoJSON: (geoJSON: UnidadVecinalGeoJSON | null) => void;
  setSelectedRegion: (region: RegionIndexEntry | null) => void;
  setLoading: (loading: boolean) => void;
  setRegionList: (regions: RegionIndexEntry[]) => void;
  setPosition: (position: [number, number]) => void;
  setCommuneList: (communes: Array<{ code: string; name: string }>) => void;
  setFiltroNombreJJVV: (filtro: string) => void;
  clearFilters: () => void;

  // Async Actions
  loadRegions: () => Promise<void>;
  loadRegionGeoJSON: () => Promise<void>;
  loadCommuneData: (communeCode: string) => Promise<void>;
  loadUnidadVecinalData: (uvName: string) => Promise<void>;
  // loadJuntasVecinos: (communCode: string) => Promise<void>; // Replaced
  loadJuntasVecinosPorComuna: (idComuna: string) => Promise<void>; // New action
}
