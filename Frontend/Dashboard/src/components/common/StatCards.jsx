import React from "react";
import PropTypes from "prop-types";
import "../../styles/common/StatCards.css";

/**
 * Summary stat strip shown above a page's table — the "upper part" chrome used
 * on every management page (matches the Orders page treatment).
 *
 * <StatCards stats={[
 *   { label: "Total", value: 42, tone: "brand" },
 *   { label: "Active", value: 30, tone: "success" },
 * ]} />
 *
 * tone: brand | success | warning | info | purple | danger | neutral
 */
const StatCards = ({ stats = [], className = "" }) => {
  if (!Array.isArray(stats) || stats.length === 0) return null;
  return (
    <div className={`stat-cards ${className}`}>
      {stats.map((s) => (
        <div className={`stat-card ${s.tone || "brand"}`} key={s.label}>
          <span className="stat-card__label">{s.label}</span>
          <span className="stat-card__value">{s.value ?? 0}</span>
        </div>
      ))}
    </div>
  );
};

StatCards.propTypes = {
  stats: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      tone: PropTypes.oneOf([
        "brand",
        "success",
        "warning",
        "info",
        "purple",
        "danger",
        "neutral",
      ]),
    })
  ),
  className: PropTypes.string,
};

export default StatCards;
