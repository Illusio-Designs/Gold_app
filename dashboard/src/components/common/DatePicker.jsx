import React, { useState, useRef, useEffect } from "react";
import PropTypes from "prop-types";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Calendar03Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";
import "../../styles/common/DatePicker.css";

const DOW = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const MON_SHORT = MONTHS.map((m) => m.slice(0, 3));

const pad = (n) => String(n).padStart(2, "0");
const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromISO = (s) => {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
};

/**
 * Custom calendar date picker (no native input). Controlled: `value` is an
 * ISO "YYYY-MM-DD" string, `onChange` receives the same. Brand-styled popover.
 */
const DatePicker = ({ value, onChange, placeholder = "Select date", min, max, disabled = false }) => {
  const [open, setOpen] = useState(false);
  const selected = fromISO(value);
  const [view, setView] = useState(selected || new Date());
  const ref = useRef(null);

  useEffect(() => {
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    if (selected) setView(selected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const y = view.getFullYear();
  const m = view.getMonth();
  const firstDow = new Date(y, m, 1).getDay();
  const daysIn = new Date(y, m + 1, 0).getDate();
  const minD = fromISO(min);
  const maxD = fromISO(max);
  const today = new Date();

  const cells = [];
  for (let i = 0; i < firstDow; i += 1) cells.push(null);
  for (let d = 1; d <= daysIn; d += 1) cells.push(d);

  const same = (a, d) => a && a.getFullYear() === y && a.getMonth() === m && a.getDate() === d;
  const disabledDay = (d) => {
    const cur = new Date(y, m, d);
    if (minD && cur < minD) return true;
    if (maxD && cur > maxD) return true;
    return false;
  };

  const pick = (d) => {
    if (disabledDay(d)) return;
    onChange(toISO(new Date(y, m, d)));
    setOpen(false);
  };

  const display = selected
    ? `${selected.getDate()} ${MON_SHORT[selected.getMonth()]} ${selected.getFullYear()}`
    : placeholder;

  return (
    <div className="dp" ref={ref}>
      <button
        type="button"
        className="dp-field"
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <HugeiconsIcon icon={Calendar03Icon} size={18} />
        <span className={selected ? "" : "dp-ph"}>{display}</span>
      </button>

      {open && (
        <div className="dp-pop" role="dialog" aria-label="Choose date">
          <div className="dp-head">
            <button type="button" className="dp-nav" onClick={() => setView(new Date(y, m - 1, 1))} aria-label="Previous month">
              <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
            </button>
            <span className="dp-title">{MONTHS[m]} {y}</span>
            <button type="button" className="dp-nav" onClick={() => setView(new Date(y, m + 1, 1))} aria-label="Next month">
              <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
            </button>
          </div>
          <div className="dp-grid dp-dow">
            {DOW.map((d) => <span key={d}>{d}</span>)}
          </div>
          <div className="dp-grid">
            {cells.map((d, i) =>
              d === null ? (
                <span key={`e${i}`} />
              ) : (
                <button
                  type="button"
                  key={d}
                  className={`dp-day${same(selected, d) ? " sel" : ""}${same(today, d) ? " today" : ""}`}
                  onClick={() => pick(d)}
                  disabled={disabledDay(d)}
                >
                  {d}
                </button>
              )
            )}
          </div>
          <div className="dp-foot">
            <button type="button" className="dp-link" onClick={() => { onChange(toISO(new Date())); setOpen(false); }}>Today</button>
            {value && <button type="button" className="dp-link" onClick={() => { onChange(""); setOpen(false); }}>Clear</button>}
          </div>
        </div>
      )}
    </div>
  );
};

DatePicker.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  min: PropTypes.string,
  max: PropTypes.string,
  disabled: PropTypes.bool,
};

export default DatePicker;
