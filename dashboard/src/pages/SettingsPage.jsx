import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Settings as SettingsIcon } from "lucide-react";
import {
  wipeAllData,
  getAppSettings,
  updateAppSettings,
} from "../services/adminApiService";
import { isAuthenticated, getAdminToken } from "../utils/authUtils";
import { showErrorToast, showSuccessToast } from "../utils/toast";
import Button from "../components/common/Button";
import PageHeader from "../components/common/PageHeader";
import "../styles/pages/SettingsPage.css";

const CONFIRM_PHRASE = "DELETE ALL DATA";

const SettingsPage = () => {
  const [confirmText, setConfirmText] = useState("");
  const [wiping, setWiping] = useState(false);
  const [goldRate, setGoldRate] = useState("");
  const [makingPct, setMakingPct] = useState("");
  const [savingPricing, setSavingPricing] = useState(false);
  const navigate = useNavigate();

  // Load current pricing settings.
  useEffect(() => {
    (async () => {
      try {
        const token = getAdminToken();
        const s = await getAppSettings(token);
        setGoldRate(s?.gold_rate ?? "");
        setMakingPct(s?.making_charge_percent ?? "");
      } catch (e) {
        // non-fatal — admin can still set them
      }
    })();
  }, []);

  const handleSavePricing = async () => {
    const rate = Number(goldRate);
    const making = Number(makingPct);
    if (!isFinite(rate) || rate < 0 || !isFinite(making) || making < 0) {
      showErrorToast("Enter a valid gold rate and making %");
      return;
    }
    try {
      setSavingPricing(true);
      const token = getAdminToken();
      await updateAppSettings(
        { gold_rate: rate, making_charge_percent: making },
        token
      );
      showSuccessToast("Pricing settings saved");
    } catch (err) {
      showErrorToast(err?.response?.data?.error || "Failed to save pricing");
    } finally {
      setSavingPricing(false);
    }
  };

  const canWipe = confirmText === CONFIRM_PHRASE && !wiping;

  const handleWipe = async () => {
    if (!isAuthenticated()) {
      showErrorToast("Please login again");
      navigate("/auth");
      return;
    }
    if (confirmText !== CONFIRM_PHRASE) return;

    const sure = window.confirm(
      "This permanently deletes ALL business data (users, products, orders, categories, media records, sliders, etc.). Admin accounts are kept. This cannot be undone. Continue?"
    );
    if (!sure) return;

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

  return (
    <div className="settings-page">
      <PageHeader title="Settings" subtitle="Manage administrative settings" icon={SettingsIcon} />

      <section className="settings-card">
        <h2>D2C Pricing</h2>
        <p>
          The consumer app prices are calculated as
          {" "}<strong>(net weight × gold rate) + making&nbsp;%</strong>.
          Update today's gold rate here and it applies across the D2C app.
        </p>

        <div className="settings-field">
          <label htmlFor="gold-rate">Gold rate (₹ per gram)</label>
          <input
            id="gold-rate"
            type="number"
            min="0"
            step="0.01"
            value={goldRate}
            onChange={(e) => setGoldRate(e.target.value)}
            placeholder="e.g. 6250"
          />
        </div>

        <div className="settings-field">
          <label htmlFor="making-pct">Making charge (%)</label>
          <input
            id="making-pct"
            type="number"
            min="0"
            step="0.01"
            value={makingPct}
            onChange={(e) => setMakingPct(e.target.value)}
            placeholder="e.g. 12"
          />
        </div>

        <div className="settings-actions">
          <Button onClick={handleSavePricing} disabled={savingPricing}>
            {savingPricing ? "Saving…" : "Save Pricing"}
          </Button>
        </div>
      </section>

      <section className="danger-zone">
        <div className="danger-zone__head">
          <AlertTriangle size={20} />
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
    </div>
  );
};

export default SettingsPage;
