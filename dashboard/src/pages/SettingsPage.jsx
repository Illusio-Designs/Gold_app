import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import { Alert02Icon } from "@hugeicons/core-free-icons";
import { wipeAllData } from "../services/adminApiService";
import { isAuthenticated, getAdminToken } from "../utils/authUtils";
import { showErrorToast, showSuccessToast } from "../utils/toast";
import Button from "../components/common/Button";
import Modal from "../components/common/Modal";
import "../styles/pages/SettingsPage.css";

const CONFIRM_PHRASE = "DELETE ALL DATA";

const SettingsPage = () => {
  const [confirmText, setConfirmText] = useState("");
  const [wiping, setWiping] = useState(false);
  const [wipeConfirmOpen, setWipeConfirmOpen] = useState(false);
  const navigate = useNavigate();

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

      {/* Themed confirmation dialog (replaces native window.confirm) */}
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
