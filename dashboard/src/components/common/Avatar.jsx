import React from "react";
import PropTypes from "prop-types";
import "../../styles/common/Avatar.css";

const initialsFrom = (name) => {
  if (!name) return "";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
};

/**
 * Circular avatar. Shows an image when `src` is set, otherwise initials
 * derived from `name` on a maroon or gold background.
 */
const Avatar = ({ name = "", src, size = 40, tone = "maroon" }) => {
  const initials = initialsFrom(name);
  const style = {
    width: size,
    height: size,
    fontSize: Math.max(11, Math.round(size * 0.4)),
  };

  return (
    <span
      className={`av-root av-root--${tone}`}
      style={style}
      role="img"
      aria-label={name || undefined}
    >
      {src ? (
        <img className="av-img" src={src} alt={name || ""} />
      ) : (
        <span className="av-initials">{initials}</span>
      )}
    </span>
  );
};

Avatar.propTypes = {
  name: PropTypes.string,
  src: PropTypes.string,
  size: PropTypes.number,
  tone: PropTypes.oneOf(["maroon", "gold"]),
};

export default Avatar;
