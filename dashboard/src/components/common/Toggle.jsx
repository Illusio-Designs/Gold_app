import React from "react";
import PropTypes from "prop-types";
import "../../styles/common/Toggle.css";

/**
 * iOS-style switch. <Toggle checked={on} onChange={setOn} label="Active" />
 */
const Toggle = ({ checked = false, onChange, label, disabled = false }) => {
  const toggle = () => {
    if (disabled || !onChange) return;
    onChange(!checked);
  };

  const handleKeyDown = (e) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      toggle();
    }
  };

  return (
    <label className={`tg-root${disabled ? " tg-root--disabled" : ""}`}>
      <span
        role="switch"
        aria-checked={checked}
        aria-disabled={disabled || undefined}
        tabIndex={disabled ? -1 : 0}
        className={`tg-track${checked ? " tg-track--on" : ""}`}
        onClick={toggle}
        onKeyDown={handleKeyDown}
      >
        <span className="tg-knob" />
      </span>
      {label != null && <span className="tg-label">{label}</span>}
    </label>
  );
};

Toggle.propTypes = {
  checked: PropTypes.bool,
  onChange: PropTypes.func,
  label: PropTypes.node,
  disabled: PropTypes.bool,
};

export default Toggle;
