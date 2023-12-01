import React, { useState } from "react";
import styles from "./SelectedHistoryMenu.module.css";

interface SelectedHistoryMenuProps {
  onToggleSelectedHistory: (selected: boolean) => void;
}

export const SelectedHistoryMenu: React.FC<SelectedHistoryMenuProps> = ({ onToggleSelectedHistory }) => {
  const [selectedHistory, setSelectedHistory] = useState<boolean>(false);

  const handleToggleHistory = (selected: boolean) => {
    setSelectedHistory(selected);
    onToggleSelectedHistory(selected);
  };

  return (
    <div className={styles.SelectedHistoryMenu}>
      <label>
        <input
          type="checkbox"
          checked={selectedHistory}
          onChange={(e) => handleToggleHistory(e.target.checked)}
        />
        Include History
      </label>
    </div>
  );
};