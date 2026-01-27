import { Marker, Popup } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-markercluster";
import L from "leaflet";
import { useMapStore } from "../store/useMapStore";
import { memo, useMemo } from "react";

// Corrige el problema del ícono por defecto en Leaflet con Webpack/Vite
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

const defaultIcon = L.icon({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = defaultIcon;

export const JuntasVecinosLayer = memo(() => {
  const juntasVecinosList = useMapStore((state) => state.juntasVecinosList);
  const selectedCommune = useMapStore((state) => state.selectedCommune); // Key for MarkerClusterGroup
  const loadingJJVV = useMapStore((state) => state.loadingJJVV);
  const filtroNombreJJVV = useMapStore((state) => state.filtroNombreJJVV); // Add filter state
  // const selectedJJVV = useMapStore((state) => state.selectedJJVV); // For future highlighting
  
  console.log('[JuntasVecinosLayer] Rendering with:', { 
    communeId: selectedCommune, 
    totalJJVVs: juntasVecinosList.length,
    loading: loadingJJVV 
  });

  // Use memoization to avoid recalculating on every render
  const juntasConCoordenadas = useMemo(() => {
    // First filter for JJVVs that have valid coordinates (either direct or via geometria)
    const validCoordinates = juntasVecinosList.filter(
      (junta) => 
        (junta.latitud !== null && junta.longitud !== null) || 
        (junta.geometria?.type === "Point" && Array.isArray(junta.geometria.coordinates) && junta.geometria.coordinates.length === 2)
    );
    
    // Then filter by name if a filter is active
    if (filtroNombreJJVV) {
      return validCoordinates.filter(junta => 
        junta.nombre.toLowerCase().includes(filtroNombreJJVV.toLowerCase())
      );
    }
    
    return validCoordinates;
  }, [juntasVecinosList, filtroNombreJJVV]);
  
  // Log diagnostic info 
  console.log('[JuntasVecinosLayer] After filtering:', { 
    totalJJVVs: juntasVecinosList.length,
    juntasConCoordenadas: juntasConCoordenadas.length,
    activeFilter: filtroNombreJJVV || 'none',
    firstJunta: juntasVecinosList.length > 0 ? {
      id: juntasVecinosList[0].id_jjvv,
      nombre: juntasVecinosList[0].nombre,
      latitud: juntasVecinosList[0].latitud,
      longitud: juntasVecinosList[0].longitud,
      hasGeometria: !!juntasVecinosList[0].geometria
    } : 'No JJVVs'
  });

  // If no commune is selected, or the list is empty, render nothing or an empty group
  if (!selectedCommune) {
    console.log('[JuntasVecinosLayer] No commune selected, not rendering');
    return null;
  }
  
  if (juntasConCoordenadas.length === 0) {
    console.log('[JuntasVecinosLayer] No JJVVs with coords, not rendering');
    return null;
  }

  // Memoize MarkerClusterGroup options for better performance
  const clusterOptions = useMemo(() => ({
    chunkedLoading: true,
    maxClusterRadius: 50,
    spiderfyOnMaxZoom: true, 
    showCoverageOnHover: false,
    zoomToBoundsOnClick: true,
    removeOutsideVisibleBounds: true
  }), []);

  return (
    <MarkerClusterGroup 
      key={`${selectedCommune || 'no-commune'}-${filtroNombreJJVV || 'no-filter'}`}
      {...clusterOptions}
    >
      {juntasConCoordenadas.map((junta) => {
        // Get coordinates - either from direct lat/long or from geometria
        let position: [number, number];
        if (junta.latitud !== null && junta.longitud !== null) {
          position = [junta.latitud, junta.longitud];
        } else if (junta.geometria?.type === "Point" && Array.isArray(junta.geometria.coordinates)) {
          // GeoJSON coordinates are [longitude, latitude], but Leaflet needs [latitude, longitude]
          const [lon, lat] = junta.geometria.coordinates;
          position = [lat, lon];
        } else {
          // This shouldn't happen due to our filter above, but TypeScript needs it
          return null;
        }
        
        return (
          <Marker key={junta.id_jjvv} position={position}>
            <Popup>
              <strong>{junta.nombre}</strong>
              <br />
              {junta.direccion}
            </Popup>
          </Marker>
        );
      })}
    </MarkerClusterGroup>
  );
});
