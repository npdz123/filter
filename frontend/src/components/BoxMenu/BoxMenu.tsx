import React, { useState } from "react";
import hierarchy from "./hierarchy.json";
import styles from "./BoxMenu.module.css";

interface BoxMenuProps {
  title: string;
  options: string[]; // Use the 'options' prop to pass menu items
  selectedOptions: string[];
  onChange: (selectedOptions: string[]) => void;
  parentSelection?: string;
}

export const BoxMenu: React.FC<BoxMenuProps> = ({
  title,
  options, // Use 'options' instead of data
  selectedOptions,
  onChange,
  parentSelection,
}) => {
  const data = parentSelection ? (hierarchy as any)[parentSelection] : hierarchy.areas;

  return (
    <div className={styles.BoxMenu}>
      <div className={styles.BoxMenuTitle}>{title}</div>
      <div className={styles.BoxMenuOptions}>
        {options.map((item, index) => (
          <div
            key={index}
            className={`${styles.BoxMenuOption} ${selectedOptions.includes(item) ? styles.selected : ""}`}
            onClick={() => {
              const newSelectedOptions = selectedOptions.includes(item)
                ? selectedOptions.filter((selectedItem) => selectedItem !== item)
                : [...selectedOptions, item];
              onChange(newSelectedOptions);
            }}
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
};