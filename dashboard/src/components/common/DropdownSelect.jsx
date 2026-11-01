import React from "react";
import Select from "react-select";
import "../../styles/common/DropdownSelect.css";

const DropdownSelect = ({
  label,
  name,
  options,
  value,
  onChange,
  placeholder = "Select an option",
  isMulti = false,
  isClearable = true,
  isSearchable = true,
  className = "",
  isDisabled = false,
  required = false,
}) => {
  // Transform options if they're strings to the format react-select expects
  const formattedOptions = options.map((option) =>
    typeof option === "string" ? { value: option, label: option } : option
  );

  // Transform value if it's a string to the format react-select expects
  const formattedValue = value
    ? typeof value === "string"
      ? { value, label: value }
      : value
    : null;

  // Find the matching option for the current value
  const findMatchingOption = (value) => {
    if (!value) return null;

    // If value is already an object with value and label, return it
    if (typeof value === "object" && value.value && value.label) {
      return value;
    }

    // If value is a string, find the matching option
    if (typeof value === "string") {
      return formattedOptions.find((option) => option.value === value) || null;
    }

    return null;
  };

  const selectedValue = findMatchingOption(value);

  const customStyles = {
    control: (base, state) => ({
      ...base,
      minHeight: "42px",
      border: `1.5px solid ${state.isFocused ? "#b4824e" : "#e4d3b3"}`,
      borderRadius: "11px",
      boxShadow: state.isFocused ? "0 0 0 4px rgba(180,130,78,0.16)" : "none",
      backgroundColor: "#fff",
      fontSize: "14px",
      paddingLeft: "2px",
      transition: "border-color .15s ease, box-shadow .15s ease",
      "&:hover": { borderColor: "#b4824e" },
    }),
    input: (base) => ({ ...base, color: "#2a1620" }),
    placeholder: (base) => ({ ...base, color: "#a99684" }),
    singleValue: (base) => ({ ...base, color: "#5d0829", fontWeight: 600 }),
    dropdownIndicator: (base, state) => ({
      ...base,
      color: state.isFocused ? "#5d0829" : "#a99684",
      "&:hover": { color: "#5d0829" },
    }),
    clearIndicator: (base) => ({
      ...base,
      color: "#a99684",
      "&:hover": { color: "#b23a48" },
    }),
    indicatorSeparator: (base) => ({ ...base, backgroundColor: "#eadfcf" }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? "#5d0829"
        : state.isFocused
        ? "#fbead3"
        : "#fff",
      color: state.isSelected ? "#fce2bf" : "#2a1620",
      fontSize: "14px",
      borderRadius: "8px",
      cursor: "pointer",
      "&:active": { backgroundColor: state.isSelected ? "#5d0829" : "#fbead3" },
    }),
    menu: (base) => ({
      ...base,
      zIndex: 9999,
      border: "1px solid #eadfcf",
      borderRadius: "12px",
      overflow: "hidden",
      marginTop: "6px",
      boxShadow: "0 20px 44px -24px rgba(68,6,31,0.4)",
      backgroundColor: "#fff",
    }),
    menuList: (base) => ({ ...base, padding: "6px" }),
    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
  };

  const handleChange = (selectedOption, actionMeta) => {
    if (onChange) {
      onChange(selectedOption, { ...actionMeta, name });
    }
  };

  return (
    <div className={`dropdown-select ${className}`}>
      {label && (
        <label className="dropdown-label">
          {label}
          {required && <span className="required-mark">*</span>}
        </label>
      )}
      <Select
        value={selectedValue}
        onChange={handleChange}
        options={formattedOptions}
        placeholder={placeholder}
        isMulti={isMulti}
        isClearable={isClearable}
        isSearchable={isSearchable}
        isDisabled={isDisabled}
        styles={customStyles}
        classNamePrefix="react-select"
        noOptionsMessage={() => "No options found"}
        loadingMessage={() => "Loading..."}
        menuPortalTarget={typeof document !== "undefined" ? document.body : null}
        menuPosition="fixed"
      />
    </div>
  );
};

export default DropdownSelect;
