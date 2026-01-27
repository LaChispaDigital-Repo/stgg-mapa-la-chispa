import { create } from "zustand";
import type {
  CommuneData,
  RegionIndexEntry,
  UnidadVecinalGeoJSON,
  UnidadVecinalFeature,
} from "../components/region-selector.inteface"; // Corrected filename typo
import type { MapStore } from "./map-store.interface";
import { supabase } from "../supabaseClient"; 
import { calculateCentroid } from "./calculate.centroid.helper";
import type { JuntaVecinal, JuntaVecinalRPCResponse, GeoJSONPoint } from "../types"; 

export const useMapStore = create<MapStore>((set, get) => ({
  regionList: [],
  regionGeoJSON: null,
  selectedRegion: null,
  loading: false,
  position: [-33.048, -71.456],
  communeList: [] as Array<{ code: string; name: string }>, 
  selectedCommune: null,
  unidadVecinalList: [], 
  selectedUnidadVecinal: null,
  hoveredFeature: null,
  geoJsonVersion: 0,
  selectedCommuneData: null,
  selectedUnidadVecinalData: null,
  filtroNombreJJVV: "",
  juntasVecinosList: [], 
  loadingJJVV: false, 
  selectedJJVV: null,

  setSelectedCommune: (commune: string | null) => {
    console.log('ENTERING setSelectedCommune - commune value:', commune);
    set({ 
      selectedCommune: commune, 
      selectedUnidadVecinal: null, 
      selectedUnidadVecinalData: null,
      juntasVecinosList: [], 
    });
    if (commune) {
      
      get().loadJuntasVecinosPorComuna(commune); 
      const { regionGeoJSON } = get();
      if (regionGeoJSON && regionGeoJSON.features) {
        const uvsDeComuna = regionGeoJSON.features
          .filter((f: UnidadVecinalFeature) => f.properties.t_com === commune)
          .map((f: UnidadVecinalFeature) => f); 
        set({ unidadVecinalList: uvsDeComuna });
      } else {
        set({ unidadVecinalList: [] });
      }
    } else {
      set({ unidadVecinalList: [], juntasVecinosList: [] }); 
    }
  },
  setSelectedUnidadVecinal: (uv) => set({ selectedUnidadVecinal: uv }),
  setHoveredFeature: (feature) => set({ hoveredFeature: feature }),
  setCommuneList: (communes) => set({ communeList: communes }),
  setSelectedCommuneData: (data) => set({ selectedCommuneData: data }),
  setSelectedUnidadVecinalData: (data) => set({ selectedUnidadVecinalData: data }),

  setRegionGeoJSON: (geoJSON) =>
    set((state) => ({
      regionGeoJSON: geoJSON,
      geoJsonVersion: state.geoJsonVersion + 1,
    })),

  setSelectedRegion: (region: RegionIndexEntry | null) => {
    set({
      selectedRegion: region,
      selectedCommune: null,
      selectedUnidadVecinal: null,
      position: region?.centroide || [-33.048, -71.456],
      regionGeoJSON: null, 
      communeList: [],     
      unidadVecinalList: [], 
      juntasVecinosList: [], 
    });
    if (region) {
      get().loadRegionGeoJSON(); 
    }
  },

  setLoading: (loading) => set({ loading }),
  setRegionList: (regions) => set({ regionList: regions }),
  setPosition: (position) => set({ position }),
  setFiltroNombreJJVV: (filtro) => set({ filtroNombreJJVV: filtro }),
  setSelectedJJVV: (jjvv) => set({ selectedJJVV: jjvv }),

  getFilteredUVFeatures: () => {
    const { regionGeoJSON, selectedCommune, selectedUnidadVecinal } = get();
    if (!regionGeoJSON) return [];
    let features = regionGeoJSON.features;
    if (selectedCommune) {
      features = features.filter((f) => f.properties.t_com === selectedCommune);
    }
    if (selectedUnidadVecinal) {
      features = features.filter((f) => f.properties.t_uv_nom === selectedUnidadVecinal);
    }
    return features;
  },

  loadRegions: async () => {
    const { setRegionList, setLoading } = get();
    setLoading(true);
    try {
      const { data, error } = await supabase.from('regiones').select('*').order('id_region');
      if (error) throw error;

      const regionIndex: RegionIndexEntry[] = data.map(region => ({
        id: region.id_region,
        name: region.nombre_region,
        slug: region.slug_region,
        centroide: [region.centroide_lat, region.centroide_lon]
      }));

      setRegionList(regionIndex);
    } catch (error) {
      console.error("Error cargando regiones desde Supabase:", error);
    } finally {
      setLoading(false);
    }
  },

  loadRegionGeoJSON: async () => { 
    const { selectedRegion, setLoading, setRegionGeoJSON, setCommuneList } = get();

    if (!selectedRegion || !selectedRegion.slug) {
      console.warn("[useMapStore] No region selected or region has no slug. Cannot load GeoJSON.");
      setRegionGeoJSON(null);
      setCommuneList([]);
      setLoading(false); 
      return;
    }

    const currentRegionSlug = selectedRegion.slug;
    setLoading(true);

    try {
      const { data, error } = await supabase.rpc("get_region_geojson", {
        region_slug_param: currentRegionSlug,
      });

      if (error) {
        console.error(`[useMapStore] Error cargando GeoJSON para slug '${currentRegionSlug}'.`, error);
        setRegionGeoJSON(null);
        setCommuneList([]);
      } else {
        setRegionGeoJSON(data as UnidadVecinalGeoJSON);
        if (data && data.features) {
          const communeMap = new Map<string, string>();
          data.features.forEach((feature: UnidadVecinalFeature) => {
            const code = String(feature.properties.t_com);
            const name = String(feature.properties.t_com_nom);
            if (code && name && !communeMap.has(code)) { 
              communeMap.set(code, name);
            }
          });
          const uniqueCommunesList = Array.from(communeMap.entries())
            .map(([code, name]) => ({ code, name }))
            .sort((a, b) => a.name.localeCompare(b.name));
          setCommuneList(uniqueCommunesList);
        } else {
          setCommuneList([]);
        }
      }
    } catch (e: any) { 
      console.error(`[useMapStore] GENERAL EXCEPTION cargando GeoJSON para slug '${currentRegionSlug}'.`, e);
      setRegionGeoJSON(null);
      setCommuneList([]);
    } finally {
      setLoading(false);
    }
  },

  loadCommuneData: async (communeCode: string): Promise<void> => {
    const { setSelectedCommuneData, setLoading } = get();
    setLoading(true);
    try {
      const { data: communeData, error: communeError } = await supabase
        .from('comunas')
        .select('*, provincias(*)') // Unimos la tabla de provincias
        .eq('id_comuna', communeCode)
        .single();

      if (communeError) throw communeError;

      const { data: uvsData, error: uvsError } = await supabase
        .from('unidades_vecinales')
        .select('*')
        .eq('id_comuna', communeCode);

      if (uvsError) throw uvsError;

      const reconstructedData: CommuneData = {
        metadata: {
          t_reg_ca: communeData.provincias.id_region.toString(),
          t_prov_ca: communeData.id_provincia.toString(),
          t_com: communeData.id_comuna,
          t_com_nom: communeData.nombre_comuna,
          totalesGenerales: {
            'NOMBRE UNIDAD VECINAL': communeData.nombre_comuna, 
            'N° UNIDAD VECINAL': 0, 
            'Número total de personas': communeData.tot_personas,
            'Total de Hombres': communeData.tot_hombres,
            'Total de Mujeres': communeData.tot_mujeres,
            'Total de personas de 0 a 5 años': communeData.tot_personas_0_5,
            'Total de personas de 6 a 14 años': communeData.tot_personas_6_14,
            'Total de personas de 15 a 64 años': communeData.tot_personas_15_64,
            'Total de personas de 65 y más años': communeData.tot_personas_65_mas,
            'Cantidad de hogares': communeData.tot_hogares,
            'Total viviendas': communeData.tot_viviendas,
          }
        },
        datos: uvsData.map(uv => ({
          'NOMBRE UNIDAD VECINAL': uv.nombre_uv,
          'N° UNIDAD VECINAL': uv.numero_uv,
          'Número total de personas': uv.uv_tot_personas,
          'Total de Hombres': uv.uv_tot_hombres,
          'Total de Mujeres': uv.uv_tot_mujeres,
          'Total de personas de 0 a 5 años': uv.uv_tot_personas_0_5,
          'Total de personas de 6 a 14 años': uv.uv_tot_personas_6_14,
          'Total de personas de 15 a 64 años': uv.uv_tot_personas_15_64,
          'Total de personas de 65 y más años': uv.uv_tot_personas_65_mas,
          'Cantidad de hogares': uv.uv_cant_hogares,
          'Total viviendas': uv.uv_tot_viviendas,
        }))
      };

      setSelectedCommuneData(reconstructedData);

    } catch (error) {
      console.error("Error cargando datos de la comuna desde Supabase:", error);
      setSelectedCommuneData(null);
      throw error;
    } finally {
      setLoading(false);
    }
  },

  loadUnidadVecinalData: async (uvName: string): Promise<void> => {
    console.warn("loadUnidadVecinalData not fully implemented for", uvName);
    // Implement fetching and setting selectedUnidadVecinalData if needed
    // Example structure:
    // const { setLoading, setSelectedUnidadVecinalData, selectedCommuneData } = get();
    // if (!selectedCommuneData || !selectedCommuneData.datos) {
    //   console.error("Cannot load UV data: commune data or UV list not available.");
    //   return;
    // }
    // setLoading(true);
    // try {
    //   const uvData = selectedCommuneData.datos.find(
    //     (uv: any) => uv['NOMBRE UNIDAD VECINAL']?.toString().trim().toLowerCase() === uvName.trim().toLowerCase()
    //   );
    //   setSelectedUnidadVecinalData(uvData || null); 
    // } catch (error) {
    //   console.error(`Error loading data for UV ${uvName}:`, error);
    //   setSelectedUnidadVecinalData(null);
    // } finally {
    //   setLoading(false);
    // }
    return Promise.resolve();
  },

  loadJuntasVecinosPorComuna: async (idComuna: string): Promise<void> => { // Fetches JJVV data for the given commune ID
    console.log('ENTERING loadJuntasVecinosPorComuna - idComuna value:', idComuna);
    if (!idComuna) {
      set({ juntasVecinosList: [], loadingJJVV: false });
      return;
    }
    set({ loadingJJVV: true });
    
    try {
      const { data, error } = await supabase.rpc('get_juntas_vecinos_por_comuna', { p_id_comuna: idComuna });
      console.log('[useMapStore] loadJuntasVecinosPorComuna - RPC Data:', data);
      console.log('[useMapStore] loadJuntasVecinosPorComuna - RPC Error status (null means success):', error);

      if (error) {
        console.error(`[useMapStore] Error cargando JJVV para comuna ${idComuna}:`, error);
        set({ juntasVecinosList: [], loadingJJVV: false });
        return;
      }

      const parsedJuntasVecinos: JuntaVecinal[] = (data as JuntaVecinalRPCResponse[] || []).map(jjvv => {
        let geometria: GeoJSONPoint | undefined = undefined;
        let latitud = jjvv.latitud;
        let longitud = jjvv.longitud;
        
        // Parse the GeoJSON geometry
        if (jjvv.geometria_geojson) {
          try {
            geometria = JSON.parse(jjvv.geometria_geojson) as GeoJSONPoint;
            
            // If latitud or longitud are null, extract them from geometria
            // GeoJSON coordinates are [longitude, latitude]
            if (geometria?.type === "Point" && Array.isArray(geometria.coordinates) && geometria.coordinates.length === 2) {
              if (latitud === null) {
                latitud = geometria.coordinates[1]; // Latitude is the second coordinate
              }
              if (longitud === null) {
                longitud = geometria.coordinates[0]; // Longitude is the first coordinate
              }
            }
          } catch (e) {
            console.error(`Error parseando geometria_geojson para JJVV ${jjvv.id_jjvv}:`, e);
          }
        }
        
        return { 
          ...jjvv, 
          geometria,
          latitud,
          longitud
        }; 
      });
      
      console.log(`[useMapStore] ${parsedJuntasVecinos.length} JJVVs loaded for comuna ${idComuna}`);
      set({ juntasVecinosList: parsedJuntasVecinos, loadingJJVV: false });
    } catch (e) {
      console.error(`[useMapStore] Excepción general cargando JJVV para comuna ${idComuna}:`, e);
      set({ juntasVecinosList: [], loadingJJVV: false });
    }
    // 'finally' block intentionally removed as setLoading(false) is handled within try/catch blocks
  },

  clearFilters: (): void => { 
    set({
      selectedCommune: null,
      selectedUnidadVecinal: null,
      filtroNombreJJVV: "",
      juntasVecinosList: [], 
      unidadVecinalList: [], 
      // Reset other filter-related states if any
    });
    console.warn("clearFilters executed, further UI reset might be needed.");
  }
}));

export { calculateCentroid };
