import React from "react";
import PropTypes from "prop-types";
import "../../styles/common/Badge.css";

/**
 * Status pill. <Badge tone="success">Approved</Badge>
 * tones: neutral | success | warning | danger | info | brand
 */
const Badge = ({ children, tone = "neutral", className = "" }) => (
  <span className={`badge badge--${tone} ${className}`}>{children}</span>
);

Badge.propTypes = {
  children: PropTypes.node.isRequired,
  tone: PropTypes.oneOf(["neutral", "success", "warning", "danger", "info", "brand"]),
  className: PropTypes.string,
};

export default Badge;
