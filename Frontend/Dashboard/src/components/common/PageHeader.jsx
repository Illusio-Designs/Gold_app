import React from "react";
import PropTypes from "prop-types";
import "../../styles/common/PageHeader.css";

/**
 * Consistent page header banner used on non-table pages (Profile, Settings,
 * Notifications, …) so they match the rest of the dashboard chrome.
 */
const PageHeader = ({ title, subtitle, icon: Icon, actions }) => (
  <div className="page-header">
    <div className="page-header__left">
      {Icon && (
        <span className="page-header__icon">
          <Icon size={22} />
        </span>
      )}
      <div>
        <h1 className="page-header__title">{title}</h1>
        {subtitle && <p className="page-header__subtitle">{subtitle}</p>}
      </div>
    </div>
    {actions && <div className="page-header__actions">{actions}</div>}
  </div>
);

PageHeader.propTypes = {
  title: PropTypes.node.isRequired,
  subtitle: PropTypes.node,
  icon: PropTypes.elementType,
  actions: PropTypes.node,
};

export default PageHeader;
