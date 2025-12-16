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
import {
  getHistoryValueV3,
  getPowerConsumptionConfigId,
} from "../services/eraService";
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
  const [baselines, setBaselines] = useState({});
  const acUnitsRef = useRef(acUnits);

  // Update ref when acUnits changes to keep it fresh for the interval
  useEffect(() => {
    acUnitsRef.current = acUnits;
  }, [acUnits]);

  // Step 1: Fetch baseline power consumption for the first day of the month
  useEffect(() => {
    const fetchBaselines = async () => {
      if (acUnits.length === 0) return;

      const now = new Date();
      const firstDayOfMonth = format(startOfMonth(now), "yyyy-MM-dd");

      // Only fetch for IDs we haven't fetched yet
      const idsToFetch = acUnits
        .map((ac) => ac.id)
        .filter((id) => baselines[id] === undefined);

      if (idsToFetch.length === 0) return;

      console.log(
        "Fetching baselines for:",
        idsToFetch,
        "Date:",
        firstDayOfMonth
      );

      const newBaselines = {};
      await Promise.all(
        idsToFetch.map(async (id) => {
          try {
            // Check localStorage first
            const cacheKey = `baseline_${id}_${firstDayOfMonth}`;
            const cached = localStorage.getItem(cacheKey);

            if (cached !== null) {
              newBaselines[id] = parseFloat(cached);
              console.log(`Baseline for ${id} (cached):`, newBaselines[id]);
            } else {
              // Try Firebase
              let val = await getDailyBaseline(id, firstDayOfMonth);
              console.log(`Baseline for ${id} (firebase):`, val);

              // If not in Firebase, fetch from E-RA
              if (val === null) {
                console.log(
                  `Baseline for ${id} not found in Firebase. Fetching from E-RA...`
                );

                let configId = getPowerConsumptionConfigId();
                if (!configId) configId = 101076; // Default fallback

                // Fetch from 00:00 to 00:02 of the first day of the month
                const dateFrom = `${firstDayOfMonth}T00:00:00`;
                const dateTo = `${firstDayOfMonth}T00:02:00`;

                try {
                  const historyData = await getHistoryValueV3(
                    configId,
                    dateFrom,
                    dateTo
                  );

                  if (historyData && historyData.length > 0) {
                    // Sort by date ascending to get the earliest record
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
                      console.log(`Fetched baseline from E-RA: ${eraVal}`);
                      val = eraVal;

                      // Save to Firebase for next time
                      await saveDailyBaseline(id, firstDayOfMonth, val);
                      console.log("Saved baseline to Firebase.");
                    }
                  } else {
                    console.warn(
                      "No history data found in E-RA for start of month."
                    );
                  }
                } catch (eraError) {
                  console.error("Error fetching from E-RA:", eraError);
                }
              }

              // Store the baseline value (default to 0 if still null)
              const baselineVal = val !== null ? val : 0;
              newBaselines[id] = baselineVal;

              // Cache it if we found a value
              if (val !== null) {
                localStorage.setItem(cacheKey, val);
              }
            }
          } catch (error) {
            console.error(`Error fetching baseline for ${id}:`, error);
            newBaselines[id] = 0;
          }
        })
      );
      console.log("New baselines fetched:", newBaselines);
      setBaselines((prev) => ({ ...prev, ...newBaselines }));
    };

    fetchBaselines();
  }, [acUnits]); // Run when acUnits list changes (e.g. initial load or add/remove)

  // Step 3 & 4: Calculate monthly consumption every 5 minutes
  useEffect(() => {
    const calculateMonthlyConsumption = async () => {
      const units = acUnitsRef.current;
      let total = 0;

      console.log("Calculating monthly consumption...");

      // Fetch current values for all units
      const currentValues = {};

      await Promise.all(
        units.map(async (ac) => {
          let currentVal = ac.currentKwh;

          // If currentKwh is 0 or missing, try to fetch from E-RA
          if (!currentVal || currentVal === 0) {
            try {
              let configId = getPowerConsumptionConfigId();
              if (!configId) configId = 101076;

              const now = new Date();
              // Fetch last 15 minutes to be safe
              const past = new Date(now.getTime() - 15 * 60 * 1000);
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
            } catch (e) {
              console.error(`Error fetching current value for ${ac.id}:`, e);
            }
          }

          currentValues[ac.id] = currentVal;
        })
      );

      units.forEach((ac) => {
        const baseline = baselines[ac.id];
        const current = currentValues[ac.id];

        if (baseline !== undefined && current !== undefined) {
          const consumption = Math.max(0, current - baseline);
          console.log(
            `AC ${ac.id} - Current: ${current}, Baseline: ${baseline}, Consumption: ${consumption}`
          );
          total += consumption;
        }
      });

      console.log("Total Monthly Consumption:", total);
      setTotalKwh(total);
    };

    // Run immediately
    calculateMonthlyConsumption();

    // Update every 5 minutes
    const interval = setInterval(calculateMonthlyConsumption, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [baselines]); // Re-setup if baselines change

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
