import { motion } from "framer-motion";
import { useLanguage } from "../contexts/LanguageContext";
import { getTempColor } from "../utils/tempUtils";
import "./ACCard.css";

const ACCard = ({ ac, monthlyKwh, onClick, onDelete }) => {
  const { t } = useLanguage();

  const getFanModeLabel = (mode) => {
    const labels = {
      auto: t("auto"),
      low: t("low"),
      medium: t("medium"),
      high: t("high"),
    };
    return labels[mode] || mode;
  };

  const getOperationModeLabel = (mode) => {
    return mode === "ai" ? t("aiMode") : t("manual");
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete();
  };

  const handleSettings = (e) => {
    e.stopPropagation();
    onClick();
  };

  const hasData = monthlyKwh > 0 || (ac.todayKwh && ac.todayKwh > 0);

  return (
    <div
      className={`ac-card glass-card ${ac.isOnline ? "online" : "offline"} ${
        ac.isOn ? "active" : ""
      } ${!hasData ? "no-data" : ""}`}
      onClick={onClick}
    >
      <div className="ac-card-header">
        <div className="ac-status">
          <span
            className={`status-dot ${ac.isOnline ? "online" : "offline"}`}
          ></span>
          <span className="status-text">
            {ac.isOnline ? t("online") : t("offline")}
          </span>
        </div>
        <div className="ac-card-actions">
          <button
            className="action-btn settings-btn"
            onClick={handleSettings}
            title={t("settings")}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
          <button
            className="action-btn delete-btn"
            onClick={handleDelete}
            title={t("delete")}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        </div>
      </div>

      <div className="ac-card-body">
        <div className="ac-info">
          <h3 className="ac-name">{ac.name}</h3>
          <p className="ac-room">{ac.roomName}</p>
        </div>

        {ac.isOnline && ac.isOn ? (
          <motion.div
            className="ac-temperature"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            style={{ color: getTempColor(ac.temperature) }}
          >
            <span className="temp-value">{ac.temperature}</span>
            <span className="temp-unit">C</span>
          </motion.div>
        ) : (
          <div className="ac-temperature off">
            <span className="power-off-text">{ac.isOnline ? "OFF" : "--"}</span>
          </div>
        )}

        <div className="ac-details">
          <div className="detail-item">
            <span className="detail-label">{t("fan")}</span>
            <span className="detail-value">{getFanModeLabel(ac.fanMode)}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">{t("mode")}</span>
            <span
              className={`detail-value mode ${
                ac.operationMode === "ai" ? "ai-mode" : ""
              }`}
            >
              {getOperationModeLabel(ac.operationMode)}
            </span>
          </div>
        </div>
      </div>

      <div className="ac-card-footer">
        <div className="energy-info">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
          <span className="energy-label">{t("thisMonth")}</span>
          <span className="energy-value">{monthlyKwh.toFixed(2)} kWh</span>
        </div>
        <div className="today-kwh">
          <span className="today-label">{t("today")}</span>
          <span className="today-value">
            {(ac.todayKwh || 0).toFixed(2)} kWh
          </span>
        </div>
      </div>
    </div>
  );
};

export default ACCard;
