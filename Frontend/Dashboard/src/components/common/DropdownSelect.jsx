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
      border: state.isFocused ? "1px solid #5d0829" : "1px solid #c09e83",
      borderRadius: "8px",
      boxShadow: state.isFocused ? "0 0 0 2px #c09e83" : "none",
      backgroundColor: "#fff",
      fontSize: "14px",
      "&:hover": {
        borderColor: "#5d0829",
      },
    }),
    input: (base) => ({
      ...base,
      color: "#5d0829",
    }),
    singleValue: (base) => ({
      ...base,
      color: "#5d0829",
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? "#5d0829"
        : state.isFocused
        ? "#fce2bf"
        : "white",
      color: state.isSelected ? "white" : "#5d0829",
      "&:hover": {
        backgroundColor: state.isSelected ? "#5d0829" : "#fce2bf",
        color: state.isSelected ? "white" : "#5d0829",
      },
    }),
    menu: (base) => ({
      ...base,
      zIndex: 9999,
      border: "1px solid #c09e83",
      borderRadius: "8px",
      backgroundColor: "#fff",
    }),
    menuPortal: (base) => ({
      ...base,
      zIndex: 9999,
    }),
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
      />
    </div>
  );
};

export default DropdownSelect;
