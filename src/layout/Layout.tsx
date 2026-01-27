import type { ReactNode } from "react";
import "./Layout.css";
import { FilterBar } from "../components/FilterBar";
import { MapView } from "../components/MapView";
import { ShowInfo } from "../components/ShowInfo";

export const Layout: React.FC<{ children: ReactNode }> = () => {
  return (
    <div className="my-container">
      <header className="bg-gray-800 text-white">
        <FilterBar />
      </header>
      <main className="main-content">
        <MapView />

        <ShowInfo />
      </main>
      <footer className="bg-gray-800 text-white text-center p-4">
        <p>© 2025 La Chispa Digital. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
};
