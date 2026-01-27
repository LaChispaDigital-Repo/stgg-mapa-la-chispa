import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useMapStore } from '../store/useMapStore';
import type { JuntaVecinal as JJVV } from '../types';

export const FiltroJJVV: React.FC = () => {
  const filtroNombreJJVV = useMapStore((state) => state.filtroNombreJJVV);
  const setFiltroNombreJJVV = useMapStore((state) => state.setFiltroNombreJJVV);
  const juntasVecinosList = useMapStore((state) => state.juntasVecinosList);
  const setSelectedJJVV = useMapStore((state) => state.setSelectedJJVV);
  const setPosition = useMapStore((state) => state.setPosition);
  const loadingJJVV = useMapStore((state) => state.loadingJJVV);
  const selectedCommune = useMapStore((state) => state.selectedCommune);

  // Local state for input value (for immediate UI feedback)
  const [inputValue, setInputValue] = useState(filtroNombreJJVV);
  
  // Update local state when store state changes (for reset after selection)
  useEffect(() => {
    setInputValue(filtroNombreJJVV);
  }, [filtroNombreJJVV]);

  // Debounce function with 300ms delay
  const debouncedSetFilter = useCallback(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    
    return (value: string) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      timeoutId = setTimeout(() => {
        setFiltroNombreJJVV(value);
        timeoutId = null;
      }, 300); // 300ms debounce delay
    };
  }, [setFiltroNombreJJVV]);

  // Memoize the debounce function to avoid recreation on each render
  const debouncedFilter = useMemo(() => debouncedSetFilter(), [debouncedSetFilter]);
  
  // Handle input change with debouncing
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setInputValue(newValue); // Update local state immediately for UI responsiveness
    debouncedFilter(newValue); // Debounce the actual store update
  };

  const filteredJJVVs = useMemo(() => {
    if (!filtroNombreJJVV) {
      return []; // Only show results if there's a filter query
    }
    return juntasVecinosList.filter((jjvv) =>
      jjvv.nombre.toLowerCase().includes(filtroNombreJJVV.toLowerCase())
    );
  }, [juntasVecinosList, filtroNombreJJVV]);

  const handleSelectJJVV = (jjvv: JJVV) => {
    setSelectedJJVV(jjvv);
    if (jjvv.latitud && jjvv.longitud) {
      setPosition([jjvv.latitud, jjvv.longitud]);
    }
    setFiltroNombreJJVV(''); // Clear search input after selection
    // Consider also closing the dropdown here if it's managed by local state
  };

  const isDisabled = !selectedCommune || loadingJJVV;

  return (
    <div className="relative"> {/* Added relative for positioning search results */}
      <div className="flex items-center">
        <input
          type="text"
          id="filtro-jjvv-nombre"
          placeholder="Buscar JJVV por nombre..."
          value={inputValue}
          onChange={handleChange}
          disabled={isDisabled}
          className="w-full px-3 py-2 bg-slate-700 text-gray-200 border border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm placeholder-slate-400"
        />
      </div>
      {/* Display filtered results */}
      {filtroNombreJJVV && filteredJJVVs.length > 0 && (
        <ul className="absolute z-10 w-full mt-1 bg-slate-700 border border-slate-600 rounded-md shadow-lg max-h-60 overflow-auto">
          {filteredJJVVs.map((jjvv) => (
            <li
              key={jjvv.id_jjvv}
              onClick={() => handleSelectJJVV(jjvv)}
              className="px-3 py-2 hover:bg-slate-600 cursor-pointer text-gray-200"
            >
              {jjvv.nombre}
            </li>
          ))}
        </ul>
      )}
      {filtroNombreJJVV && !loadingJJVV && filteredJJVVs.length === 0 && juntasVecinosList.length > 0 && (
         <div className="absolute z-10 w-full mt-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-lg text-gray-400">
          No se encontraron JJVV.
        </div>
      )}
    </div>
  );
};
