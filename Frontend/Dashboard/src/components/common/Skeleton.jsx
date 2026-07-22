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

export const SkeletonTable = ({ rows = 6, cols = 5, className = "" }) => (
  <div className={`skeleton-table ${className}`} aria-hidden="true">
    {Array.from({ length: rows }).map((_, r) => (
      <div className="skeleton-table__row" key={r}>
        {Array.from({ length: cols }).map((_, c) => (
          <Skeleton key={c} height={14} width={c === 0 ? "40%" : "80%"} />
        ))}
      </div>
    ))}
  </div>
);

export const SkeletonCards = ({ count = 8, className = "" }) => (
  <div className={`skeleton-cards ${className}`} aria-hidden="true">
    {Array.from({ length: count }).map((_, i) => (
      <div className="skeleton-cards__item" key={i}>
        <Skeleton variant="rect" height={150} radius={10} />
        <Skeleton height={14} width="70%" />
        <Skeleton height={12} width="45%" />
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
