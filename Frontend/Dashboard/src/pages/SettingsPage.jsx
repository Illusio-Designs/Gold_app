import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Settings as SettingsIcon } from "lucide-react";
import { wipeAllData } from "../services/adminApiService";
import { isAuthenticated, getAdminToken } from "../utils/authUtils";
import { showErrorToast, showSuccessToast } from "../utils/toast";
import Button from "../components/common/Button";
import PageHeader from "../components/common/PageHeader";
import "../styles/pages/SettingsPage.css";

const CONFIRM_PHRASE = "DELETE ALL DATA";

const SettingsPage = () => {
  const [confirmText, setConfirmText] = useState("");
  const [wiping, setWiping] = useState(false);
  const navigate = useNavigate();

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
