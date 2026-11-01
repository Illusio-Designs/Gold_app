import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import { Alert02Icon, Settings01Icon } from "@hugeicons/core-free-icons";
import { gooeyToast } from "goey-toast";
import notificationSoundService from "../services/notificationSoundService";
import {
  wipeAllData,
  resetForReview,
  getAppSettings,
  updateAppSettings,
} from "../services/adminApiService";
import { isAuthenticated, getAdminToken } from "../utils/authUtils";
import { showErrorToast, showSuccessToast } from "../utils/toast";
import Button from "../components/common/Button";
import Modal from "../components/common/Modal";
import PageHeader from "../components/common/PageHeader";
import "../styles/pages/SettingsPage.css";

const CONFIRM_PHRASE = "DELETE ALL DATA";
const RESET_PHRASE = "RESET FOR REVIEW";

const SettingsPage = () => {
  const [confirmText, setConfirmText] = useState("");
  const [wiping, setWiping] = useState(false);
  const [resetText, setResetText] = useState("");
  const [resetting, setResetting] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [wipeConfirmOpen, setWipeConfirmOpen] = useState(false);
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

  const canReset = resetText === RESET_PHRASE && !resetting;

  const handleReset = () => {
    if (!isAuthenticated()) {
      showErrorToast("Please login again");
      navigate("/auth");
      return;
    }
    if (resetText !== RESET_PHRASE) return;
    setResetConfirmOpen(true);
  };

  const doReset = async () => {
    setResetConfirmOpen(false);
    try {
      setResetting(true);
      const token = getAdminToken();
      await resetForReview(RESET_PHRASE, token);
      showSuccessToast("Reset done. Orders & non-admin users cleared; catalog kept.");
      setResetText("");
    } catch (err) {
      showErrorToast(err?.response?.data?.error || "Reset failed");
    } finally {
      setResetting(false);
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

  return (
    <div className="settings-page">
      <PageHeader title="Settings" subtitle="Manage administrative settings" icon={Settings01Icon} />

      <div className="settings-grid">
        <section className="au-panel">
          <div className="au-panel-head">
            <h3>B2C Pricing</h3>
          </div>
          <p className="settings-note">
            The consumer app prices are calculated as
            {" "}<strong>(net weight × gold rate) + making&nbsp;%</strong>.
            Update today's gold rate here and it applies across the B2C app.
          </p>

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
              placeholder="e.g. 6250"
            />
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

          <div className="settings-actions">
            <Button onClick={handleSavePricing} disabled={savingPricing}>
              {savingPricing ? "Saving…" : "Save Pricing"}
            </Button>
          </div>
        </section>
      </div>

      <section className="au-panel">
        <div className="au-panel-head">
          <h3>Notification preview</h3>
        </div>
        <p className="au-sub" style={{ marginTop: 0, lineHeight: 1.6 }}>
          The dashboard uses gooey (blob-morph) toasts. Tap a button to see how
          each type looks — a new order also plays the order sound.
        </p>
        <div className="toast-preview-actions">
          <Button
            variant="primary"
            onClick={() => {
              gooeyToast("New order received", {
                description: "B2B-1A2B3C · ₹24,500 · tap to view",
                action: {
                  label: "View order",
                  onClick: () => navigate("/dashboard/orders"),
                },
              });
              notificationSoundService.playSound("new_order");
            }}
          >
            New order (with sound)
          </Button>
          <Button variant="secondary" onClick={() => gooeyToast.success("Saved successfully")}>
            Success
          </Button>
          <Button variant="secondary" onClick={() => gooeyToast.error("Something went wrong")}>
            Error
          </Button>
          <Button variant="secondary" onClick={() => gooeyToast.warning("Please double-check this")}>
            Warning
          </Button>
          <Button variant="secondary" onClick={() => gooeyToast.info("Here's some information")}>
            Info
          </Button>
        </div>
      </section>

      <section className="au-panel review-reset">
        <div className="au-panel-head">
          <h3>Prepare for store review</h3>
        </div>
        <p className="au-sub" style={{ marginTop: 0, lineHeight: 1.6 }}>
          Clears all <strong>orders, custom orders, carts</strong> and{" "}
          <strong>non-admin users</strong> so the app is clean for Google Play /
          App Store reviewers. Your <strong>products, categories, sliders and
          media are kept</strong> (every product is set back to “available”),
          and <strong>admin accounts stay</strong>. This cannot be undone.
        </p>

        <label className="danger-zone__label" htmlFor="reset-confirm">
          Type <code>{RESET_PHRASE}</code> to enable:
        </label>
        <input
          id="reset-confirm"
          className="danger-zone__input"
          value={resetText}
          onChange={(e) => setResetText(e.target.value)}
          placeholder={RESET_PHRASE}
          autoComplete="off"
          spellCheck={false}
        />
        <div className="danger-zone__actions">
          <Button variant="primary" onClick={handleReset} disabled={!canReset}>
            {resetting ? "Resetting…" : "Reset for review"}
          </Button>
        </div>
      </section>

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

      {/* Themed confirmation dialogs (replace native window.confirm) */}
      <Modal
        isOpen={resetConfirmOpen}
        onClose={() => setResetConfirmOpen(false)}
        title="Reset for review?"
        size="small"
      >
        <p style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
          This clears all <strong>orders, custom orders, carts</strong> and{" "}
          <strong>non-admin users</strong>. Your <strong>products, categories,
          sliders and media are kept</strong>, and admin accounts stay. This{" "}
          <strong>cannot be undone</strong>.
        </p>
        <div className="modal-actions">
          <Button variant="secondary" onClick={() => setResetConfirmOpen(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={doReset}>
            Yes, reset for review
          </Button>
        </div>
      </Modal>

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
