import React, { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import lottie from "lottie-web";
import animationData from "../../assests/amrut-ring.json";
import "../../styles/common/RingLoader.css";

/**
 * Brand page-load loader — the engagement-ring Lottie (gold interlocked bands
 * + maroon diamond). Use `fullscreen` for app boot / route fallback, or inline
 * (default) inside a content area while its data loads.
 */
const RingLoader = ({ label = "Loading", size = 150, fullscreen = false }) => {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return undefined;
    const reduce =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const anim = lottie.loadAnimation({
      container: ref.current,
      renderer: "svg",
      loop: true,
      autoplay: !reduce,
      animationData,
    });
    if (reduce) anim.goToAndStop(Math.max(0, (anim.totalFrames || 1) - 1), true);
    return () => anim.destroy();
  }, []);

  return (
    <div className={`ring-loader${fullscreen ? " ring-loader--full" : ""}`}>
      <div
        className="ring-loader__anim"
        style={{ width: size, height: size }}
        ref={ref}
        role="img"
        aria-label={label}
      />
      {label && (
        <div className="ring-loader__label">
          {label}
          <span className="ring-loader__dots">
            <i />
            <i />
            <i />
          </span>
        </div>
      )}
    </div>
  );
};

RingLoader.propTypes = {
  label: PropTypes.string,
  size: PropTypes.number,
  fullscreen: PropTypes.bool,
};

export default RingLoader;
