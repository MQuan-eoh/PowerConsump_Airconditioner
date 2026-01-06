import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { format, startOfMonth } from "date-fns";
import {
  subscribeToACUnits,
  createACUnit,
  deleteACUnit,
  updateACUnit,
  getDailyBaseline,
  saveDailyBaseline,
} from "../services/firebaseService";
import { getHistoryValueV3 } from "../services/eraService";
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

  const [totalKwh, setTotalKwh] = useState(0);
  const [acConsumptions, setAcConsumptions] = useState({});
  const [baselines, setBaselines] = useState({});
  const acUnitsRef = useRef(acUnits);

  // Update ref when acUnits changes to keep it fresh for the interval
  useEffect(() => {
    acUnitsRef.current = acUnits;
  }, [acUnits]);

  // Helper to fetch baseline
  const fetchBaseline = async (ac, dateStr) => {
    const id = ac.id;
    try {
      const cacheKey = `baseline_${id}_${dateStr}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached !== null) return parseFloat(cached);

      let val = await getDailyBaseline(id, dateStr);

      if (val === null) {
        let configId = ac.eraConfigId;

        if (!configId) {
          // If no config ID, we can't fetch from E-RA.
          // Return 0 or handle as "no data"
          return 0;
        }

        const dateFrom = `${dateStr}T00:00:00`;
        const dateTo = `${dateStr}T00:02:00`;

        try {
          const historyData = await getHistoryValueV3(
            configId,
            dateFrom,
            dateTo
          );

          if (historyData && historyData.length > 0) {
            const sortedData = [...historyData].sort((a, b) => {
              const dateA = new Date(a.created_at || a.x);
              const dateB = new Date(b.created_at || b.x);
              return dateA - dateB;
            });

            const firstItem = sortedData[0];
            const eraVal = parseFloat(
              firstItem.val !== undefined ? firstItem.val : firstItem.y
            );

            if (!isNaN(eraVal)) {
              val = eraVal;
              await saveDailyBaseline(id, dateStr, val);
            }
          }
        } catch (eraError) {
          console.error("Error fetching from E-RA:", eraError);
        }
      }

      const result = val !== null ? val : 0;
      if (val !== null) localStorage.setItem(cacheKey, val);
      return result;
    } catch (error) {
      console.error(`Error fetching baseline for ${id}:`, error);
      return 0;
    }
  };

  // Step 1: Fetch baseline power consumption for the first day of the month and today
  useEffect(() => {
    const fetchBaselines = async () => {
      if (acUnits.length === 0) return;

      const now = new Date();
      const firstDayOfMonth = format(startOfMonth(now), "yyyy-MM-dd");
      const todayStr = format(now, "yyyy-MM-dd");

      const newBaselines = {};

      await Promise.all(
        acUnits.map(async (ac) => {
          const monthly = await fetchBaseline(ac, firstDayOfMonth);
          const daily = await fetchBaseline(ac, todayStr);
          newBaselines[ac.id] = { monthly, daily };
        })
      );

      console.log("New baselines fetched:", newBaselines);
      setBaselines(newBaselines);
    };

    fetchBaselines();
  }, [acUnits]); // Run when acUnits list changes (e.g. initial load or add/remove)

  // Step 3 & 4: Calculate monthly and daily consumption
  useEffect(() => {
    const calculateConsumption = async () => {
      const units = acUnits; // Use current state directly as we are in useEffect dependency
      let total = 0;
      const newConsumptions = {};

      console.log("Calculating consumption...");

      // 1. Filter ACs that are linked to E-RA
      const linkedUnits = units.filter((ac) => ac.isEraLinked !== false);

      // 2. Get current power consumption for each linked unit
      const consumptionPromises = linkedUnits.map(async (ac) => {
        try {
          const baseline = baselines[ac.id];

          if (!baseline) {
            return 0;
          }

          // Get Current Value from E-RA
          let currentVal = 0;
          let configId = ac.eraConfigId;

          if (!configId) {
            // No config ID, return 0
            return 0;
          }

          // Fetch latest value (last 24 hours to ensure we catch it even if device is infrequent)
          const now = new Date();
          const past = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          const dateFrom = format(past, "yyyy-MM-dd'T'HH:mm:ss");
          const dateTo = format(now, "yyyy-MM-dd'T'HH:mm:ss");

          const historyData = await getHistoryValueV3(
            configId,
            dateFrom,
            dateTo
          );

          if (historyData && historyData.length > 0) {
            // Sort by date descending to get latest
            const sortedData = [...historyData].sort((a, b) => {
              const dateA = new Date(a.created_at || a.x);
              const dateB = new Date(b.created_at || b.x);
              return dateB - dateA;
            });

            const lastItem = sortedData[0];
            const val = parseFloat(
              lastItem.val !== undefined ? lastItem.val : lastItem.y
            );
            if (!isNaN(val)) {
              currentVal = val;
            }
          }

          const monthlyConsumption = Math.max(0, currentVal - baseline.monthly);
          const dailyConsumption = Math.max(0, currentVal - baseline.daily);

          newConsumptions[ac.id] = {
            monthly: monthlyConsumption,
            daily: dailyConsumption,
          };

          return monthlyConsumption;
        } catch (error) {
          console.error(
            `Error calculating consumption for AC ${ac.id}:`,
            error
          );
          return 0;
        }
      });

      const results = await Promise.all(consumptionPromises);

      // (5) Sum total
      total = results.reduce((acc, curr) => acc + curr, 0);

      console.log("Total Monthly Consumption:", total);
      setTotalKwh(total);
      setAcConsumptions(newConsumptions);
    };

    if (acUnits.length > 0) {
      calculateConsumption();
    }

    // Update every 1 minute
    const interval = setInterval(calculateConsumption, 60 * 1000);

    return () => clearInterval(interval);
  }, [acUnits, baselines]);

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
                monthlyKwh={acConsumptions[ac.id]?.monthly || 0}
                todayKwh={acConsumptions[ac.id]?.daily || 0}
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
