import { useTranslation } from "react-i18next";
import "./StatsHeader.css";

const StatsHeader = ({ online, offline, total, totalKwh }) => {
  const { t } = useTranslation();

  return (
    <div className="stats-header">
      <div className="stat-card glass-card">
        <div className="stat-icon online">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
        <div className="stat-content">
          <span className="stat-value">{online}</span>
          <span className="stat-label">{t("online")}</span>
        </div>
      </div>

      <div className="stat-card glass-card">
        <div className="stat-icon offline">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
          </svg>
        </div>
        <div className="stat-content">
          <span className="stat-value">{offline}</span>
          <span className="stat-label">{t("offline")}</span>
        </div>
      </div>

      <div className="stat-card glass-card">
        <div className="stat-icon total">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="2" y="4" width="20" height="12" rx="2" />
            <path d="M6 20h12M12 16v4" />
            <path d="M6 8h.01M6 11h.01" />
          </svg>
        </div>
        <div className="stat-content">
          <span className="stat-value">{total}</span>
          <span className="stat-label">{t("total")}</span>
        </div>
      </div>

      <div className="stat-card glass-card energy-stat">
        <div className="stat-icon energy">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
        </div>
        <div className="stat-content">
          <span className="stat-value">{totalKwh.toFixed(2)}</span>
          <span className="stat-label">{t("kwhThisMonth")}</span>
        </div>
        <div className="stat-subtitle">{t("fromStartOfMonth")}</div>
      </div>
    </div>
  );
};

export default StatsHeader;
