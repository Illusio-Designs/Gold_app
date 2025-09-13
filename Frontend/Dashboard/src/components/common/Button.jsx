import React from "react";
import "../../styles/common/Button.css";
import PropTypes from "prop-types";

const Button = ({
  children,
  variant = "primary",
  size = "medium",
  disabled = false,
  onClick,
  type = "button",
  className = "",
  iconOnly = false,
  tooltip,
}) => {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`
        common-button
        ${variant}
        ${size}
        ${iconOnly ? "icon-only" : ""}
        ${className}
        ${tooltip ? "has-tooltip" : ""}
      `}
    >
      {children}
      {tooltip && <span className="custom-tooltip">{tooltip}</span>}
    </button>
  );
};

if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.innerHTML = `
    .common-button.has-tooltip {
      position: relative;
      overflow: visible;
    }
    .common-button .custom-tooltip {
      visibility: hidden;
      opacity: 0;
      min-width: 70px;
      max-width: 180px;
      background: rgba(93, 8, 41, 0.95);
      color: #fff;
      text-align: center;
      border-radius: 6px;
      padding: 6px 12px;
      position: absolute;
      z-index: 10;
      left: 50%;
      bottom: 120%;
      transform: translateX(-50%) scale(0.95);
      font-size: 13px;
      font-weight: 400;
      pointer-events: none;
      transition: opacity 0.18s, transform 0.18s;
      box-shadow: 0 2px 8px rgba(93,8,41,0.13);
      white-space: pre-line;
    }
    .common-button.has-tooltip:hover .custom-tooltip,
    .common-button.has-tooltip:focus .custom-tooltip {
      visibility: visible;
      opacity: 1;
      transform: translateX(-50%) scale(1);
    }
    .common-button .custom-tooltip::after {
      content: '';
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      border-width: 6px;
      border-style: solid;
      border-color: rgba(93, 8, 41, 0.95) transparent transparent transparent;
    }
  `;
  document.head.appendChild(style);
}

Button.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf([
    "primary",
    "primary-dark",
    "secondary",
    "danger",
    "outline",
  ]),
  size: PropTypes.oneOf(["small", "medium", "large"]),
  disabled: PropTypes.bool,
  onClick: PropTypes.func,
  type: PropTypes.oneOf(["button", "submit", "reset"]),
  className: PropTypes.string,
  iconOnly: PropTypes.bool,
  tooltip: PropTypes.string,
};

export default Button;
