import React from "react";
import PropTypes from "prop-types";
import { HugeiconsIcon } from "@hugeicons/react";
import "../../styles/common/EmptyState.css";

/**
 * Centered empty-state placeholder with optional icon and action.
 */
const EmptyState = ({ icon, title, message, action }) => (
  <div className="es-root">
    {icon && (
      <span className="es-icon">
        <HugeiconsIcon icon={icon} size={44} />
      </span>
    )}
    <h3 className="es-title">{title}</h3>
    {message && <p className="es-message">{message}</p>}
    {action && <div className="es-action">{action}</div>}
  </div>
);

EmptyState.propTypes = {
  icon: PropTypes.oneOfType([PropTypes.object, PropTypes.array, PropTypes.func]),
  title: PropTypes.node.isRequired,
  message: PropTypes.node,
  action: PropTypes.node,
};

export default EmptyState;
