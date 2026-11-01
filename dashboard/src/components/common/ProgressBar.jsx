import React from "react";
import PropTypes from "prop-types";
import "../../styles/common/ProgressBar.css";

/**
 * Gold-gradient progress bar. Value is clamped to 0–100.
 */
const ProgressBar = ({ value = 0, label, showPct = true }) => {
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  const rounded = Math.round(pct);

  return (
    <div className="pb-root">
      {(label != null || showPct) && (
        <div className="pb-head">
          {label != null && <span className="pb-label">{label}</span>}
          {showPct && <span className="pb-pct">{rounded}%</span>}
        </div>
      )}
      <div
        className="pb-track"
        role="progressbar"
        aria-valuenow={rounded}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="pb-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

ProgressBar.propTypes = {
  value: PropTypes.number,
  label: PropTypes.node,
  showPct: PropTypes.bool,
};

export default ProgressBar;
