import { useMapStore } from "../store/useMapStore";

export const UnidadVecinalSelector = () => {
  // Obtener el estado de la región, comuna seleccionada, GeoJSON de la región y funciones para actualizar el estado
  // desde la store de Zustand
  const {
    regionGeoJSON,
    selectedCommune,
    selectedUnidadVecinal,
    setSelectedUnidadVecinal,
    loading,
    loadUnidadVecinalData,
  } = useMapStore();

  // Obtener unidades vecinales disponibles (filtradas por comuna si está seleccionada)
  const unidadesVecinales = regionGeoJSON && selectedCommune
    ? regionGeoJSON.features
        .filter((f) => f.properties.t_com === selectedCommune) // Filtrar por la comuna seleccionada
        .map((f) => ({
          code: f.properties.t_id_uv_ca, // Usar el código de la UV
          name: f.properties.t_uv_nom,
          communeName: f.properties.t_com_nom, // Guardar el nombre de la comuna por si acaso, aunque no se usa en el option si selectedCommune tiene valor
        }))
        .sort((a, b) => String(a.name).localeCompare(String(b.name))) // Asegurar que name sea string para sort
    : [];

  // Función para manejar el cambio de unidad vecinal
  const handleUVChange = (uvCode: string | null) => { // Aceptar null si se deselecciona
    setSelectedUnidadVecinal(uvCode);
    if (uvCode) {
      loadUnidadVecinalData(uvCode);
    } else {
      // Opcional: limpiar datos de UV si se deselecciona
      // loadUnidadVecinalData(null); // o alguna acción para limpiar el estado
    }
  };

  return (
    <select
      className="w-full px-3 py-2 bg-slate-700 text-gray-200 border border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm placeholder-slate-400"
      onChange={(e) => handleUVChange(e.target.value || null)}
      value={selectedUnidadVecinal || ""}
      disabled={loading || !regionGeoJSON || !selectedCommune}>
      <option value="">{selectedCommune ? "Todas las UV de la comuna" : "Seleccione una comuna primero"}</option>
      {unidadesVecinales.map((uv) => (
        <option key={uv.code} value={uv.code}> {/* Usar uv.code como key y value */}
          {uv.name}
        </option>
      ))}
    </select>
  );
};
