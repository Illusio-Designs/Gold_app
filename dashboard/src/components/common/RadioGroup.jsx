import React from "react";
import PropTypes from "prop-types";
import "../../styles/common/FormBits.css";

/**
 * Radio group backed by real <input type="radio"> controls.
 */
const RadioGroup = ({ name, value, onChange, options = [], inline = false }) => (
  <div
    className={`fb-radio-group${inline ? " fb-radio-group--inline" : ""}`}
    role="radiogroup"
  >
    {options.map((option) => (
      <label className="fb-radio" key={option.value}>
        <input
          type="radio"
          className="fb-radio-input"
          name={name}
          value={option.value}
          checked={value === option.value}
          onChange={() => onChange && onChange(option.value)}
        />
        <span className="fb-radio-label">{option.label}</span>
      </label>
    ))}
  </div>
);

RadioGroup.propTypes = {
  name: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.node.isRequired,
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
        .isRequired,
    })
  ).isRequired,
  inline: PropTypes.bool,
};

export default RadioGroup;
