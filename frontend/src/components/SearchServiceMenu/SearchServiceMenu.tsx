import React, { useState } from "react";
import styles from "./SearchServiceMenu.module.css";

interface SearchServiceMenuProps {
  onToggleSearchService: (service: string) => void;
}

export const SearchServiceMenu: React.FC<SearchServiceMenuProps> = ({ onToggleSearchService }) => {
  const [selectedService, setSelectedService] = useState<string | null>(null);

  const handleSelectService = (service: string) => {
    setSelectedService(service);
    onToggleSearchService(service);
  };

  return (
    <div className={styles.SearchServiceMenu}>
      <label>
        <input
          type="checkbox"
          checked={selectedService === "cognitiveSearch"}
          onChange={() => handleSelectService("cognitiveSearch")}
        />
        Cognitive Search
      </label>

      <label>
        <input
          type="checkbox"
          checked={selectedService === "bigQuery"}
          onChange={() => handleSelectService("bigQuery")}
        />
        BigQuery
      </label>
    </div>
  );
};