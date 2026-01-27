import { useMapStore } from "../store/useMapStore";
import { CommuneSelector } from "./CommuneSelector";
import { RegionSelector } from "./RegionSelector";
import { UnidadVecinalSelector } from "./UnidadVecinalSelector";
import { FiltroJJVV } from "./FiltroJJVV";

export const FilterBar = () => {
  const { clearFilters } = useMapStore();
  // Esta función se encarga de limpiar la selección de región}

  return (
    <div className="filterbar-container">
      <RegionSelector />
      <h1>Implementar filtro provincia</h1>
      <CommuneSelector />
      <UnidadVecinalSelector />
      <FiltroJJVV />
      <h1>Implementar ubicación</h1>
      <div>
        <button
          onClick={clearFilters}
          className="w-full px-3 py-2 bg-slate-700 text-gray-200 border border-slate-600 rounded-md shadow-sm 
                  hover:bg-slate-600 hover:border-slate-500 
                  focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 
                  disabled:opacity-50 disabled:cursor-not-allowed 
                  transition-colors duration-150 ease-in-out
                  sm:text-sm">
          Limpiar selección
        </button>
      </div>
    </div>
  );
};
