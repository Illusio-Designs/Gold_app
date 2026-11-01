import React from "react";
import PropTypes from "prop-types";
import "../../styles/common/FormBits.css";

/**
 * Styled checkbox backed by a real <input type="checkbox">.
 */
const Checkbox = ({ checked = false, onChange, label, disabled = false }) => (
  <label className={`fb-check${disabled ? " fb-disabled" : ""}`}>
    <input
      type="checkbox"
      className="fb-check-input"
      checked={checked}
      disabled={disabled}
      onChange={(e) => onChange && onChange(e.target.checked)}
    />
    {label != null && <span className="fb-check-label">{label}</span>}
  </label>
);

Checkbox.propTypes = {
  checked: PropTypes.bool,
  onChange: PropTypes.func,
  label: PropTypes.node,
  disabled: PropTypes.bool,
};

export default Checkbox;
