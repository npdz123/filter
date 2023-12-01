import React, { useState } from "react";
import styles from "./ConversationIdMenu.module.css";

interface ConversationIdMenuProps {
  onAddConversationId: (entry: string) => void;
}

export const ConversationIdMenu: React.FC<ConversationIdMenuProps> = ({ onAddConversationId }) => {
  const [entry, setConversationId] = useState("");

  const handleAddConversationId = () => {
    if (entry.trim() !== "") {
      onAddConversationId(entry);
      setConversationId("");
    }
  };

  return (
    <div className={styles.ConversationIdMenu}>
      <input
        type="text"
        placeholder="Conversation id"
        value={entry}
        onChange={(e) => setConversationId(e.target.value)}
        className={styles.ConversationIdInput}
    />
      <button onClick={handleAddConversationId}>Add</button>
    </div>
  );
};