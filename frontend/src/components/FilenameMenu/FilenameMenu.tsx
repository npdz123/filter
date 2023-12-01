import React, { useState } from "react";
import styles from "./FilenameMenu.module.css";

interface FilenameMenuProps {
  onAddEntry: (entry: string) => void;
}

export const FilenameMenu: React.FC<FilenameMenuProps> = ({ onAddEntry }) => {
  const [entry, setEntry] = useState("");

  const handleAddEntry = () => {
    if (entry.trim() !== "") {
      onAddEntry(entry);
      setEntry("");
    }
  };

  return (
    <div className={styles.filenameMenu}>
      <input
        type="text"
        placeholder="Filename search"
        value={entry}
        onChange={(e) => setEntry(e.target.value)}
        className={styles.filenameInput}
    />
      <button onClick={handleAddEntry}>Add</button>
    </div>
  );
};