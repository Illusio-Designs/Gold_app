import React, { useEffect } from "react";
import PropTypes from "prop-types";
import { X } from "lucide-react";
import "../../styles/common/SidePanel.css";

/**
 * Slide-in side panel (drawer). Drop-in replacement for <Modal> for forms:
 * same props (isOpen, onClose, title, children, size, showCloseButton,
 * closeOnOverlayClick, className) plus an optional `footer`.
 */
const SidePanel = ({
  isOpen,
  onClose,
  title,
  children,
  footer = null,
  size = "medium",
  showCloseButton = true,
  closeOnOverlayClick = true,
  className = "",
}) => {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", onKey);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="side-panel-overlay"
      onClick={closeOnOverlayClick ? (e) => e.target === e.currentTarget && onClose() : undefined}
      role="dialog"
      aria-modal="true"
      aria-labelledby="side-panel-title"
    >
      <aside className={`side-panel side-panel--${size} ${className}`}>
        <header className="side-panel__header">
          <h2 id="side-panel-title" className="side-panel__title">
            {title}
          </h2>
          {showCloseButton && (
            <button className="side-panel__close" onClick={onClose} aria-label="Close panel">
              <X size={20} />
            </button>
          )}
        </header>
        <div className="side-panel__body">{children}</div>
        {footer && <footer className="side-panel__footer">{footer}</footer>}
      </aside>
    </div>
  );
};

SidePanel.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.node.isRequired,
  children: PropTypes.node.isRequired,
  footer: PropTypes.node,
  size: PropTypes.oneOf(["small", "medium", "large"]),
  showCloseButton: PropTypes.bool,
  closeOnOverlayClick: PropTypes.bool,
  className: PropTypes.string,
};

export default SidePanel;
