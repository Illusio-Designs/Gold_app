import React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { CATEGORY_ICONS, CATEGORY_ICON_NAMES } from "../../utils/categoryIcons";
import "./IconPicker.css";

// Grid of selectable category icons. `value` is the stored icon name string;
// `onChange(name)` fires when the admin picks one.
const IconPicker = ({ value, onChange, label = "Icon" }) => {
  return (
    <div className="icon-picker">
      {label && <label className="icon-picker-label">{label}</label>}
      <div className="icon-picker-grid" role="listbox" aria-label="Category icon">
        {CATEGORY_ICON_NAMES.map((name) => {
          const selected = value === name;
          return (
            <button
              key={name}
              type="button"
              role="option"
              aria-selected={selected}
              title={name}
              className={`icon-picker-cell${selected ? " selected" : ""}`}
              onClick={() => onChange(name)}
            >
              <HugeiconsIcon icon={CATEGORY_ICONS[name]} size={24} />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default IconPicker;
