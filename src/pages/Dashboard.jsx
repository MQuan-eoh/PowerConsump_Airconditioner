import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { format, startOfMonth } from "date-fns";
import { useMqttData } from "../contexts/MqttContext";
import {
  subscribeToACUnits,
  createACUnit,
  deleteACUnit,
  updateACUnit,
  getDailyBaseline,
  saveDailyBaseline,
} from "../services/firebaseService";
import { getHistoryValueV3, getStartOfDayValueFromEra, getStartOfMonthValueFromEra } from "../services/eraService";
import { useTranslation } from "react-i18next";
import { useEra } from "../contexts/EraContext";
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
  const { t } = useTranslation();

  useEffect(() => {
    const unsubscribe = subscribeToACUnits(async (units) => {
      setACUnits(units);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const { acLiveStates } = useMqttData();
  const { getValueById, isReady: isEraReady } = useEra();

  const getMergedACs = () => {
    return acUnits.map((ac) => {
      const live =
        acLiveStates && acLiveStates[ac.id] ? acLiveStates[ac.id] : null;

      // Extract raw ERA values if available (from widget APIs initially)
      let eraTemp = null;
      let eraPower = null;

      if (isEraReady && ac.configMapping) {
        if (ac.configMapping.targetTemp) {
          const val = getValueById(parseInt(ac.configMapping.targetTemp));
          if (val !== null && val !== undefined) eraTemp = parseFloat(val);
        }
        if (ac.configMapping.power) {
           const val = getValueById(parseInt(ac.configMapping.power));
           if (val !== null && val !== undefined) {
             eraPower = String(val) === "1" || String(val).toLowerCase() === "true" || String(val) === "on";
           }
        }
      }

      if (!live && !isEraReady) return ac; // Fallback to firebase if IoT is completely disconnected

      // Priority: 1. Live MQTT -> 2. Era Widget Init State -> 3. Firebase state
      return {
        ...ac,
        ...(live || {}), // Overwrite any matching keys directly
        temperature:
          live?.targetTemp !== undefined ? live.targetTemp : 
          (eraTemp !== null ? eraTemp : ac.temperature),
        isOn:
          live?.power !== undefined
            ? (String(live.power) === "1" ||
              String(live.power).toLowerCase() === "true" ||
              String(live.power) === "on")
            : (eraPower !== null ? eraPower : ac.isOn),
        fanMode: live?.fanSpeed !== undefined ? live.fanSpeed : ac.fanMode,
        // Assume online if we have live data recently
        isOnline: live?.lastUpdated
          ? Date.now() - live.lastUpdated < 120000
          : ac.isOnline, // 2 mins timeout
        currentTemp: live?.currentTemp, // Pass this through even if ACCard doesn't use it yet
      };
    });
  };

  const displayACUnits = getMergedACs();

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

  // Helper to fetch baseline
  const fetchBaseline = async (ac, dateStr) => {
    const id = ac.id;
    try {
      const isFirstOfMonth = dateStr.endsWith("-01");
      const cacheKey = isFirstOfMonth ? `monthlyBaseline_${id}_${dateStr}` : `dailyBaseline_${id}_${dateStr}`;
      
      const cached = localStorage.getItem(cacheKey);
      if (cached !== null && cached !== "undefined" && cached !== "NaN") {
        const parsed = parseFloat(cached);
        if (!isNaN(parsed) && parsed > 0) return parsed;
      }

      let val = await getDailyBaseline(id, dateStr);

      if (val === null || val <= 0) {
        // Try eraConfigId first, then fallback to configMapping.powerConsumption
        let configId = ac.eraConfigId || ac.configMapping?.powerConsumption;

        if (!configId) {
          return 0;
        }
        configId = parseInt(configId);
        
        // Determine whether this is a "first day of month" request or a "daily" request
        const fetchDate = new Date(dateStr + "T00:00:00");

        if (isFirstOfMonth) {
          val = await getStartOfMonthValueFromEra(configId, fetchDate);
        } else {
          val = await getStartOfDayValueFromEra(configId, fetchDate);
        }

        if (val !== null && val > 0) {
          await saveDailyBaseline(id, dateStr, val);
        }
      }

      const result = val !== null && val > 0 ? val : 0;
      if (result > 0) localStorage.setItem(cacheKey, result.toString());
      return result;
    } catch (error) {
      console.error(`Error fetching baseline for ${id}:`, error);
      return 0;
    }
  };

  const { data: consumptionData } = useQuery({
    queryKey: ["dashboard-consumption", acUnits.map((a) => a.id)],
    queryFn: async () => {
      if (acUnits.length === 0) return { totalKwh: 0, acConsumptions: {} };

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

      let total = 0;
      const newConsumptions = {};

      const linkedUnits = acUnits.filter((ac) => ac.isEraLinked !== false);

      const consumptionPromises = linkedUnits.map(async (ac) => {
        try {
          const baseline = newBaselines[ac.id];
          if (!baseline) return 0;

          let currentVal = 0;
          let configId = ac.eraConfigId || ac.configMapping?.powerConsumption;

          if (!configId) return 0;
          configId = parseInt(configId);

          const past = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          const dateFrom = format(past, "yyyy-MM-dd'T'HH:mm:ss");
          const dateTo = format(now, "yyyy-MM-dd'T'HH:mm:ss");

          const historyData = await getHistoryValueV3(configId, dateFrom, dateTo);

          if (historyData && historyData.length > 0) {
            const sortedData = [...historyData].sort((a, b) => {
              const dateA = new Date(a.created_at || a.x);
              const dateB = new Date(b.created_at || b.x);
              return dateB - dateA;
            });

            const lastItem = sortedData[0];
            const val = parseFloat(lastItem.val !== undefined ? lastItem.val : lastItem.y);
            if (!isNaN(val)) {
              currentVal = val;
            }
          }

          const monthlyConsumption =
            baseline.monthly !== null && !isNaN(baseline.monthly)
              ? Math.max(0, currentVal - baseline.monthly)
              : 0;
          const dailyConsumption =
            baseline.daily !== null && !isNaN(baseline.daily)
              ? Math.max(0, currentVal - baseline.daily)
              : 0;

          newConsumptions[ac.id] = {
            monthly: monthlyConsumption,
            daily: dailyConsumption,
          };

          return monthlyConsumption;
        } catch (error) {
          console.error(`Error calculating consumption for AC ${ac.id}:`, error);
          return 0;
        }
      });

      const results = await Promise.all(consumptionPromises);
      total = results.reduce((acc, curr) => acc + curr, 0);

      return { totalKwh: total, acConsumptions: newConsumptions };
    },
    refetchInterval: 60 * 1000,
    staleTime: 5 * 60 * 1000,
    enabled: acUnits.length > 0,
  });

  const totalKwh = consumptionData?.totalKwh || 0;
  const acConsumptions = consumptionData?.acConsumptions || {};

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
          displayACUnits.map((ac, index) => (
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
