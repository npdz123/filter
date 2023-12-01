import React, { useState } from "react";
import styles from "./UsuarioIdMenu.module.css";

interface UsuarioIdMenuProps {
  onAddUsuarioId: (entry: string) => void;
}

export const UsuarioIdMenu: React.FC<UsuarioIdMenuProps> = ({ onAddUsuarioId }) => {
  const [entry, setUsuarioId] = useState("");

  const handleAddUsuarioId = () => {
    if (entry.trim() !== "") {
      onAddUsuarioId(entry);
      setUsuarioId("");
    }
  };

  return (
    <div className={styles.UsuarioIdMenu}>
      <input
        type="text"
        placeholder="User id"
        value={entry}
        onChange={(e) => setUsuarioId(e.target.value)}
        className={styles.ConversationIdInput}
    />
      <button onClick={handleAddUsuarioId}>Add</button>
    </div>
  );
};