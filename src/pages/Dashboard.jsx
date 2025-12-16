import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  subscribeToACUnits,
  createACUnit,
  deleteACUnit,
  updateACUnit,
} from "../services/firebaseService";
import { useLanguage } from "../contexts/LanguageContext";
import ACCard from "../components/ACCard";
import AddACModal from "../components/AddACModal";
import StatsHeader from "../components/StatsHeader";
import LanguageSwitcher from "../components/LanguageSwitcher";
import "./Dashboard.css";

const Dashboard = () => {
  const [acUnits, setACUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    const unsubscribe = subscribeToACUnits(async (units) => {
      setACUnits(units);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAddAC = async (acData) => {
    await createACUnit(acData);
    setShowAddModal(false);
  };

  const handleDeleteAC = async (acId) => {
    if (window.confirm(t("confirmDeleteAC"))) {
      await deleteACUnit(acId);
    }
  };

  const handleACClick = (acId) => {
    navigate(`/control/${acId}`);
  };

  const onlineCount = acUnits.filter((ac) => ac.isOnline).length;
  const offlineCount = acUnits.filter((ac) => !ac.isOnline).length;
  const totalKwh = 0; // TODO: Implement new total calculation logic

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>{t("loading")}</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-left"></div>
        <div className="header-right">
          <LanguageSwitcher />
          <button
            className="btn btn-secondary"
            onClick={() => navigate("/bills")}
          >
            {t("manageBills")}
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setShowAddModal(true)}
          >
            {t("addAC")}
          </button>
        </div>
      </header>

      <StatsHeader
        online={onlineCount}
        offline={offlineCount}
        total={acUnits.length}
        totalKwh={totalKwh}
      />

      <div className="ac-grid">
        {acUnits.length === 0 ? (
          <div className="empty-state glass-card">
            <div className="empty-icon">
              <svg
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <rect x="2" y="4" width="20" height="12" rx="2" />
                <path d="M6 20h12M12 16v4" />
                <path d="M6 8h.01M6 11h.01" />
              </svg>
            </div>
            <h3>{t("noACYet")}</h3>
            <p>{t("clickAddAC")}</p>
            <button
              className="btn btn-primary"
              onClick={() => setShowAddModal(true)}
            >
              {t("addFirstAC")}
            </button>
          </div>
        ) : (
          acUnits.map((ac, index) => (
            <motion.div
              key={ac.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <ACCard
                ac={ac}
                monthlyKwh={0}
                onClick={() => handleACClick(ac.id)}
                onDelete={() => handleDeleteAC(ac.id)}
              />
            </motion.div>
          ))
        )}
      </div>

      {showAddModal && (
        <AddACModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddAC}
        />
      )}
    </div>
  );
};

export default Dashboard;
