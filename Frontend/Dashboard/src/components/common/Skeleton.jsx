import React from "react";
import PropTypes from "prop-types";
import "../../styles/common/Skeleton.css";

/**
 * Shimmer skeleton placeholder. Use instead of spinners while data loads.
 *
 * <Skeleton width="60%" height={16} />                 // a line
 * <Skeleton variant="rect" height={180} radius={12} /> // a block
 * <Skeleton variant="circle" width={40} height={40} /> // avatar
 * <SkeletonText lines={3} />                            // paragraph
 * <SkeletonTable rows={6} cols={5} />                   // table body
 * <SkeletonCards count={8} />                           // media/product grid
 */
const Skeleton = ({ width, height, radius, variant = "line", style = {}, className = "" }) => {
  const r =
    variant === "circle"
      ? "50%"
      : radius != null
        ? typeof radius === "number"
          ? `${radius}px`
          : radius
        : undefined;
  return (
    <span
      className={`skeleton skeleton--${variant} ${className}`}
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
        borderRadius: r,
        ...style,
      }}
      aria-hidden="true"
    />
  );
};

export const SkeletonText = ({ lines = 3, className = "" }) => (
  <span className={`skeleton-text ${className}`} aria-hidden="true">
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton key={i} height={12} width={i === lines - 1 ? "70%" : "100%"} />
    ))}
  </span>
);

// A stat-strip skeleton shaped like the real StatCards row above the table.
export const SkeletonStats = ({ count = 4, className = "" }) => (
  <div className={`skeleton-stats ${className}`} aria-hidden="true">
    {Array.from({ length: count }).map((_, i) => (
      <div className="skeleton-stat-card" key={i}>
        <Skeleton width="55%" height={11} />
        <Skeleton width="40%" height={24} />
      </div>
    ))}
  </div>
);

// A table skeleton shaped like the real table (card shell + toolbar + header
// row + data rows with a thumbnail, column cells and action buttons).
export const SkeletonTable = ({ rows = 6, className = "" }) => (
  <div className={`skeleton-table-card ${className}`} aria-hidden="true">
    <div className="skeleton-table-card__toolbar">
      <Skeleton width={140} height={22} />
      <Skeleton width={280} height={38} radius={10} />
    </div>
    <div className="skeleton-table-card__row skeleton-table-card__head">
      {Array.from({ length: 6 }).map((_, c) => (
        <Skeleton key={c} height={12} width="70%" />
      ))}
    </div>
    {Array.from({ length: rows }).map((_, r) => (
      <div className="skeleton-table-card__row" key={r}>
        <span className="skeleton-cell-media">
          <Skeleton variant="rect" width={44} height={44} radius={9} />
          <span className="skeleton-cell-lines">
            <Skeleton width={120} height={12} />
            <Skeleton width={70} height={10} />
          </span>
        </span>
        <Skeleton height={12} width="70%" />
        <Skeleton height={12} width="50%" />
        <Skeleton height={12} width="60%" />
        <Skeleton height={12} width="80%" />
        <span className="skeleton-cell-actions">
          <Skeleton variant="rect" width={34} height={34} radius={9} />
          <Skeleton variant="rect" width={34} height={34} radius={9} />
        </span>
      </div>
    ))}
  </div>
);

// A card grid skeleton shaped like the media cards (maroon header + image + footer).
export const SkeletonCards = ({ count = 8, className = "" }) => (
  <div className={`skeleton-media-grid ${className}`} aria-hidden="true">
    {Array.from({ length: count }).map((_, i) => (
      <div className="skeleton-media-card" key={i}>
        <div className="skeleton-media-card__head" />
        <Skeleton variant="rect" height={150} radius={0} />
        <div className="skeleton-media-card__foot">
          <Skeleton width="60%" height={14} />
          <Skeleton width="40%" height={11} />
        </div>
      </div>
    ))}
  </div>
);

Skeleton.propTypes = {
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  radius: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  variant: PropTypes.oneOf(["line", "rect", "circle"]),
  style: PropTypes.object,
  className: PropTypes.string,
};

export default Skeleton;
