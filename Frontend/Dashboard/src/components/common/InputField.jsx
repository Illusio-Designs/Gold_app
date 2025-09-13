import React, { useState } from "react";
import "../../styles/common/InputField.css";

const InputField = ({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  multiline = false,
  required = false,
  accept,
  className = "",
  options = [],
  name,
  error,
  disabled = false,
}) => {
  const [preview, setPreview] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
    onChange(e);
  };

  const renderLabel = () => (
    <label className="input-label">
      {label}
      {required && <span className="required-mark">*</span>}
    </label>
  );

  if (type === "file") {
    return (
      <div className={`input-field ${error ? "has-error" : ""} ${className}`}>
        {renderLabel()}
        <div className="file-input-container">
          <div className="file-input-wrapper">
            <input
              type="file"
              onChange={handleFileChange}
              accept={accept}
              required={required}
              className="file-input"
              name={name}
              disabled={disabled}
            />
            <div className="file-input-placeholder">
              {value ? value.name : placeholder || "Choose a file"}
            </div>
            <button className="file-input-button" disabled={disabled}>
              Browse
            </button>
          </div>
        </div>
        {error && <div className="input-error">{error}</div>}
      </div>
    );
  }

  if (type === "select") {
    return (
      <div className={`input-field ${error ? "has-error" : ""} ${className}`}>
        {renderLabel()}
        <select
          value={value}
          onChange={onChange}
          required={required}
          className="select-input"
          name={name}
          disabled={disabled}
        >
          <option value="">{placeholder || "Select an option"}</option>
          {options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <div className="input-error">{error}</div>}
      </div>
    );
  }

  if (multiline) {
    return (
      <div className={`input-field ${error ? "has-error" : ""} ${className}`}>
        {renderLabel()}
        <textarea
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className="textarea-input"
          rows={4}
          name={name}
          disabled={disabled}
        />
        {error && <div className="input-error">{error}</div>}
      </div>
    );
  }

  return (
    <div className={`input-field ${error ? "has-error" : ""} ${className}`}>
      {renderLabel()}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="text-input"
        name={name}
        disabled={disabled}
      />
      {error && <div className="input-error">{error}</div>}
    </div>
  );
};

export default InputField;
