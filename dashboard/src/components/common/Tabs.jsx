import React, { useState } from "react";
import PropTypes from "prop-types";
import "../../styles/common/Tabs.css";

/**
 * Underline tabs. Controlled when `value`/`onChange` are passed, otherwise
 * manages the active key internally (defaults to the first tab).
 */
const Tabs = ({ tabs, value, onChange }) => {
  const isControlled = value !== undefined;
  const [internal, setInternal] = useState(tabs[0] ? tabs[0].key : undefined);
  const active = isControlled ? value : internal;

  const select = (key) => {
    if (!isControlled) setInternal(key);
    if (onChange) onChange(key);
  };

  const activeTab = tabs.find((t) => t.key === active) || tabs[0];

  return (
    <div className="tb-root">
      <div className="tb-row" role="tablist">
        {tabs.map((tab) => {
          const selected = activeTab && tab.key === activeTab.key;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={selected}
              className={`tb-tab${selected ? " tb-tab--active" : ""}`}
              onClick={() => select(tab.key)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <div className="tb-panel" role="tabpanel">
        {activeTab ? activeTab.content : null}
      </div>
    </div>
  );
};

Tabs.propTypes = {
  tabs: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.node.isRequired,
      content: PropTypes.node,
    })
  ).isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func,
};

export default Tabs;
