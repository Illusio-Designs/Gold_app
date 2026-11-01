import React from "react";
import PropTypes from "prop-types";
import "../../styles/common/Tooltip.css";

/**
 * CSS-only tooltip. Wraps children; shows a maroon bubble on hover/focus.
 */
const Tooltip = ({ text, children, position = "top" }) => (
  <span className={`tt-root tt-root--${position}`}>
    {children}
    <span className="tt-bubble" role="tooltip">
      {text}
      <span className="tt-arrow" />
    </span>
  </span>
);

Tooltip.propTypes = {
  text: PropTypes.node.isRequired,
  children: PropTypes.node,
  position: PropTypes.oneOf(["top", "bottom"]),
};

export default Tooltip;
