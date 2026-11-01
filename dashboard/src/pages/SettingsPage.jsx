import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import { Alert02Icon, Coins01Icon } from "@hugeicons/core-free-icons";
import {
  wipeAllData,
  getAppSettings,
  updateAppSettings,
} from "../services/adminApiService";
import { isAuthenticated, getAdminToken } from "../utils/authUtils";
import { showErrorToast, showSuccessToast } from "../utils/toast";
import Button from "../components/common/Button";
import Modal from "../components/common/Modal";
import "../styles/pages/SettingsPage.css";

const CONFIRM_PHRASE = "DELETE ALL DATA";

const fmtWhen = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-IN", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });
};

const inr = (n) => Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });

const SettingsPage = () => {
  const navigate = useNavigate();

  // Daily gold rate
  const [goldRate, setGoldRate] = useState("");
  const [makingPct, setMakingPct] = useState("");
  const [rateUpdatedAt, setRateUpdatedAt] = useState("");
  const [savingRate, setSavingRate] = useState(false);

  // Danger zone
  const [confirmText, setConfirmText] = useState("");
  const [wiping, setWiping] = useState(false);
  const [wipeConfirmOpen, setWipeConfirmOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const token = getAdminToken();
        const s = await getAppSettings(token);
        setGoldRate(s?.gold_rate ?? "");
        setMakingPct(s?.making_charge_percent ?? "");
        setRateUpdatedAt(s?.gold_rate_updated_at ?? "");
      } catch (e) {
        // non-fatal — admin can still set the rate
      }
    })();
  }, []);

  const handleSaveRate = async () => {
    const rate = Number(goldRate);
    const making = Number(makingPct);
    if (!isFinite(rate) || rate <= 0 || !isFinite(making) || making < 0) {
      showErrorToast("Enter a valid gold rate and making %");
      return;
    }
    try {
      setSavingRate(true);
      const token = getAdminToken();
      const now = new Date().toISOString();
      await updateAppSettings(
        { gold_rate: rate, making_charge_percent: making, gold_rate_updated_at: now },
        token
      );
      setRateUpdatedAt(now);
      showSuccessToast("Today's gold rate saved for the B2C app.");
    } catch (err) {
      showErrorToast(err?.response?.data?.error || "Failed to save the rate");
    } finally {
      setSavingRate(false);
    }
  };

  const canWipe = confirmText === CONFIRM_PHRASE && !wiping;

  const handleWipe = () => {
    if (!isAuthenticated()) {
      showErrorToast("Please login again");
      navigate("/auth");
      return;
    }
    if (confirmText !== CONFIRM_PHRASE) return;
    setWipeConfirmOpen(true);
  };

  const doWipe = async () => {
    setWipeConfirmOpen(false);
    try {
      setWiping(true);
      const token = getAdminToken();
      await wipeAllData(CONFIRM_PHRASE, token);
      showSuccessToast("All data wiped. Admin accounts were preserved.");
      setConfirmText("");
    } catch (err) {
      showErrorToast(err?.response?.data?.error || "Data wipe failed");
    } finally {
      setWiping(false);
    }
  };

  const rateNum = Number(goldRate);
  const showHint = isFinite(rateNum) && rateNum > 0;

  return (
    <div className="settings-page">
      {/* Daily gold rate (B2C) */}
      <section className="au-panel">
        <div className="au-panel-head">
          <h3>
            <HugeiconsIcon icon={Coins01Icon} size={18} style={{ verticalAlign: "-3px", marginRight: 8 }} />
            Daily gold rate
          </h3>
          {rateUpdatedAt && (
            <span className="au-muted">Updated {fmtWhen(rateUpdatedAt)}</span>
          )}
        </div>
        <p className="au-sub" style={{ marginTop: 0, lineHeight: 1.6 }}>
          Set today's gold rate for the <strong>B2C app</strong>. Consumer prices are
          calculated as <strong>(net weight × gold rate) + making&nbsp;%</strong>.
          Lock it once each morning — like a jeweller's counter rate.
        </p>

        <div className="rate-grid">
          <div className="field">
            <label htmlFor="gold-rate">Gold rate (₹ per gram)</label>
            <input
              id="gold-rate"
              className="form-control"
              type="number"
              min="0"
              step="0.01"
              value={goldRate}
              onChange={(e) => setGoldRate(e.target.value)}
              placeholder="e.g. 7250"
            />
            {showHint && (
              <small className="rate-hint">
                ≈ ₹{inr(rateNum * 10)} / 10g · 22K ≈ ₹{inr(rateNum * 0.916)}/g
              </small>
            )}
          </div>

          <div className="field">
            <label htmlFor="making-pct">Making charge (%)</label>
            <input
              id="making-pct"
              className="form-control"
              type="number"
              min="0"
              step="0.01"
              value={makingPct}
              onChange={(e) => setMakingPct(e.target.value)}
              placeholder="e.g. 12"
            />
          </div>
        </div>

        <div className="settings-actions">
          <Button onClick={handleSaveRate} disabled={savingRate}>
            {savingRate ? "Saving…" : "Save today's rate"}
          </Button>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="danger-zone">
        <div className="danger-zone__head">
          <HugeiconsIcon icon={Alert02Icon} size={20} />
          <h2>Danger Zone</h2>
        </div>

        <div className="danger-zone__body">
          <h3>Wipe all data</h3>
          <p>
            Permanently deletes <strong>all business data</strong> — products,
            categories, orders, carts, sliders, app icons/versions, media
            records and all non-admin users. <strong>Admin accounts are kept</strong> so
            you stay logged in. This action <strong>cannot be undone</strong>.
          </p>

          <label className="danger-zone__label" htmlFor="wipe-confirm">
            Type <code>{CONFIRM_PHRASE}</code> to enable the button:
          </label>
          <input
            id="wipe-confirm"
            className="danger-zone__input"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={CONFIRM_PHRASE}
            autoComplete="off"
            spellCheck={false}
          />

          <div className="danger-zone__actions">
            <Button variant="danger" onClick={handleWipe} disabled={!canWipe}>
              {wiping ? "Wiping…" : "Wipe All Data"}
            </Button>
          </div>
        </div>
      </section>

      <Modal
        isOpen={wipeConfirmOpen}
        onClose={() => setWipeConfirmOpen(false)}
        title="Wipe ALL data?"
        size="small"
      >
        <p style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
          This permanently deletes <strong>all business data</strong> — products,
          categories, orders, carts, sliders, media records and all non-admin
          users. Admin accounts are kept. This <strong>cannot be undone</strong>.
        </p>
        <div className="modal-actions">
          <Button variant="secondary" onClick={() => setWipeConfirmOpen(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={doWipe}>
            Yes, wipe everything
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default SettingsPage;
