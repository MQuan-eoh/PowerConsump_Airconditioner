import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  subscribeToACUnit,
  updateACUnit,
  logTemperatureChange,
  saveDailyBaseline,
  saveDailyEndValue,
  getDailyBaseline,
  getDailyPowerData,
} from "../services/firebaseService";
import {
  getHistoryValueV3,
  getPowerConsumptionConfigId,
} from "../services/eraService";
import { format, startOfMonth, startOfWeek, addDays, parseISO } from "date-fns";
import { getDateRange, processConsumptionData } from "../utils/dateFilter";
import { useLanguage } from "../contexts/LanguageContext";
import { useEra } from "../contexts/EraContext";
import EnergyChart from "../components/EnergyChart";
import WeatherPanel from "../components/WeatherPanel";
import ACSettings from "../components/ACSettings";
import TemperatureLogModal from "../components/TemperatureLogModal";
import SensorCard from "../components/SensorCard";
import {
  FaTemperatureHigh,
  FaBolt,
  FaPlug,
  FaLeaf,
  FaRobot,
  FaDownload,
} from "react-icons/fa";
import { getTempColor } from "../utils/tempUtils";
import { useAIControl } from "../hooks/useAIControl";
import {
  downloadLogs,
  logAIAction,
  getLearnedUserPreference,
} from "../services/aiLogService";
import AIActivationOverlay from "../components/AIActivationOverlay";
import "./ControlPanel.css";

const ControlPanel = () => {
  const { t } = useLanguage();
  const { acId } = useParams();
  const navigate = useNavigate();

  // E-RA Integration - Lấy dữ liệu real-time và actions từ thiết bị IoT
  const {
    eraValues,
    isReady: isEraReady,
    setTemperature: setEraTemperature,
    setPower: setEraPower,
    setMode: setEraMode,
    setFanSpeed: setEraFanSpeed,
  } = useEra();

  const [ac, setAC] = useState(null);

  // AI Control Hook
  useAIControl(ac, eraValues, setEraTemperature, setEraFanSpeed, setEraMode);

  const [loading, setLoading] = useState(true);
  const [energyHistory, setEnergyHistory] = useState([]);
  const [chartPeriod, setChartPeriod] = useState("day");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showSettings, setShowSettings] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [showAIActivation, setShowAIActivation] = useState(false);
  const [stats, setStats] = useState({
    daily: 0,
    weekly: 0,
    monthly: 0,
    yearly: 0,
  });

  // Determine if this AC is linked to E-RA (default to true if undefined for legacy support)
  const isEraLinked = ac?.isEraLinked !== false;

  // New Logic: Daily Baseline
  const [dailyBaseline, setDailyBaseline] = useState(null);
  const [monthlyBaseline, setMonthlyBaseline] = useState(null);

  // Real-time sensor history state
  const [sensorHistory, setSensorHistory] = useState({
    temp: [],
    voltage: [],
    current: [],
    power: [],
  });

  // Update sensor history when eraValues changes
  useEffect(() => {
    if (!eraValues) return;

    setSensorHistory((prev) => {
      const MAX_POINTS = 20; // Keep last 20 data points

      const updateChannel = (channelData, newValue) => {
        // Only add valid numbers
        if (newValue === null || newValue === undefined || isNaN(newValue)) {
          // If we want to maintain the chart flow even with missing data, we could duplicate the last value
          // or just return current state. Let's return current state to avoid flatlining with nulls if not intended.
          // However, to make the chart "move" we might need regular updates.
          // For now, let's only add if we have a value.
          return channelData;
        }

        // Avoid adding duplicate values if the update is too fast and value hasn't changed?
        // Actually, for a real-time chart, seeing a flat line is correct if value is constant.
        // But we need to know if this useEffect triggers on time interval or value change.
        // Assuming eraValues updates when data comes in.

        const newData = [...channelData, { value: parseFloat(newValue) }];
        return newData.slice(-MAX_POINTS);
      };

      return {
        temp: updateChannel(prev.temp, eraValues.currentTemperature),
        voltage: updateChannel(prev.voltage, eraValues.voltage),
        current: updateChannel(prev.current, eraValues.current),
        power: updateChannel(prev.power, eraValues.powerConsumption),
      };
      console.log("=====================");
      console.log(
        "Updated Power Consumption Values:",
        eraValues.powerConsumption
      );
    });
  }, [eraValues]);

  useEffect(() => {
    const fetchBaseline = async () => {
      const todayStr = format(new Date(), "yyyy-MM-dd");
      const localStorageKey = `dailyBaseline_${acId}_${todayStr}`;

      // 1. Check LocalStorage
      const cachedBaseline = localStorage.getItem(localStorageKey);
      if (cachedBaseline) {
        console.log("Using cached baseline from LocalStorage:", cachedBaseline);
        setDailyBaseline(parseFloat(cachedBaseline));
        return;
      }

      // 2. Check Firebase
      const firebaseBaseline = await getDailyBaseline(acId, todayStr);
      if (firebaseBaseline !== null) {
        console.log("Using baseline from Firebase:", firebaseBaseline);
        localStorage.setItem(localStorageKey, firebaseBaseline);
        setDailyBaseline(firebaseBaseline);
        return;
      }

      // 3. Fetch from E-RA API (00:00 - 00:02)
      let configId = getPowerConsumptionConfigId();
      if (!configId) configId = 101076;

      // Fetch from 00:00 to 00:02 to get the baseline
      const dateFrom = `${todayStr}T00:00:00`;
      const dateTo = `${todayStr}T00:02:00`;

      console.log(
        "Fetching baseline from E-RA (00:00 - 00:02):",
        dateFrom,
        "to",
        dateTo
      );
      const historyData = await getHistoryValueV3(configId, dateFrom, dateTo);

      if (historyData && historyData.length > 0) {
        // Sort by date ascending to get the earliest record
        const sortedData = [...historyData].sort((a, b) => {
          const dateA = new Date(a.created_at || a.x);
          const dateB = new Date(b.created_at || b.x);
          return dateA - dateB;
        });

        // Get the first value (earliest in the day)
        const firstItem = sortedData[0];
        const val = parseFloat(
          firstItem.val !== undefined ? firstItem.val : firstItem.y
        );

        if (!isNaN(val)) {
          console.log(
            "Fetched baseline from E-RA:",
            val,
            "at",
            firstItem.created_at || firstItem.x
          );

          // Save to Firebase
          try {
            await saveDailyBaseline(acId, todayStr, val);
            console.log("Saved baseline to Firebase successfully.");
          } catch (err) {
            console.error("Failed to save baseline to Firebase:", err);
          }

          // Save to LocalStorage
          localStorage.setItem(localStorageKey, val);
          setDailyBaseline(val);
        } else {
          console.warn("First item value is NaN:", firstItem);
        }
      } else {
        console.warn("No history data found for today to establish baseline.");
      }
    };

    if (acId) {
      fetchBaseline();
    }
  }, [acId]);

  // Fetch Monthly Baseline
  useEffect(() => {
    const fetchMonthlyBaseline = async () => {
      const now = new Date();
      const firstDayOfMonth = format(startOfMonth(now), "yyyy-MM-dd");
      const localStorageKey = `monthlyBaseline_${acId}_${firstDayOfMonth}`;

      // 1. Check LocalStorage
      const cachedBaseline = localStorage.getItem(localStorageKey);
      if (cachedBaseline) {
        console.log(
          "Using cached monthly baseline from LocalStorage:",
          cachedBaseline
        );
        setMonthlyBaseline(parseFloat(cachedBaseline));
        return;
      }

      // 2. Check Firebase
      let val = await getDailyBaseline(acId, firstDayOfMonth);

      // If not in Firebase, fetch from E-RA
      if (val === null) {
        console.log(
          `Monthly baseline for ${acId} not found in Firebase. Fetching from E-RA...`
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
              console.log(`Fetched monthly baseline from E-RA: ${eraVal}`);
              val = eraVal;

              // Save to Firebase for next time
              await saveDailyBaseline(acId, firstDayOfMonth, val);
              console.log("Saved monthly baseline to Firebase.");
            }
          } else {
            console.warn("No history data found in E-RA for start of month.");
          }
        } catch (eraError) {
          console.error("Error fetching monthly baseline from E-RA:", eraError);
        }
      }

      if (val !== null) {
        console.log("Using monthly baseline:", val);
        localStorage.setItem(localStorageKey, val);
        setMonthlyBaseline(val);
        return;
      }
    };

    if (acId) {
      fetchMonthlyBaseline();
    }
  }, [acId]);

  // Save Daily End Value (Debounced)
  useEffect(() => {
    if (!eraValues?.powerConsumption || !acId) return;

    const saveEndValue = async () => {
      const todayStr = format(new Date(), "yyyy-MM-dd");
      try {
        await saveDailyEndValue(
          acId,
          todayStr,
          parseFloat(eraValues.powerConsumption)
        );
      } catch (err) {
        console.error("Failed to save daily end value:", err);
      }
    };

    const timer = setTimeout(saveEndValue, 5000); // Debounce 5s
    return () => clearTimeout(timer);
  }, [eraValues?.powerConsumption, acId]);

  // Calculate Daily and Monthly Consumption based on Baseline and Current Value
  useEffect(() => {
    if (eraValues?.powerConsumption) {
      const currentKwh = parseFloat(eraValues.powerConsumption);

      if (dailyBaseline !== null) {
        const dailyKwh = Math.max(0, currentKwh - dailyBaseline);
        setStats((prev) => ({
          ...prev,
          daily: dailyKwh,
        }));
      }

      if (monthlyBaseline !== null) {
        const monthlyKwh = Math.max(0, currentKwh - monthlyBaseline);
        console.log(
          `Calculating monthly consumption: Current=${currentKwh}, Baseline=${monthlyBaseline}, Result=${monthlyKwh}`
        );
        setStats((prev) => ({
          ...prev,
          monthly: monthlyKwh,
        }));
      }
    }
  }, [dailyBaseline, monthlyBaseline, eraValues?.powerConsumption]);

  useEffect(() => {
    const unsubscribe = subscribeToACUnit(acId, (data) => {
      setAC(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [acId]);

  // Load Chart Data and Other Stats (Weekly, Monthly)
  useEffect(() => {
    const loadChartAndStats = async () => {
      let configId = getPowerConsumptionConfigId();
      if (!configId) configId = 101076;

      // 1. Load Chart Data
      let chartData = [];

      if (chartPeriod === "week") {
        // Use Firebase Daily Data for Week View
        const days = [];
        const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
        for (let i = 0; i < 7; i++) {
          days.push(format(addDays(start, i), "yyyy-MM-dd"));
        }

        const promises = days.map(async (dateStr) => {
          const data = await getDailyPowerData(acId, dateStr);
          let kwh = 0;

          if (data && data.beginPW !== undefined) {
            if (data.endPW) {
              kwh = data.endPW - data.beginPW;
            } else if (
              dateStr === format(new Date(), "yyyy-MM-dd") &&
              eraValues?.powerConsumption
            ) {
              // Today: use current value if endPW not set
              kwh = parseFloat(eraValues.powerConsumption) - data.beginPW;
            }
          }

          return {
            date: dateStr,
            kwh: Math.max(0, kwh),
          };
        });

        chartData = await Promise.all(promises);
      } else {
        const { date_from, date_to } = getDateRange(chartPeriod, selectedDate);
        const historyData = await getHistoryValueV3(
          configId,
          date_from,
          date_to
        );
        const result = processConsumptionData(historyData, chartPeriod, {
          date_from,
          date_to,
        });
        chartData = result.chartData;
      }

      setEnergyHistory(chartData);

      // 2. Load Weekly Stats (Monthly is handled by baseline calculation)
      // We only need to do this once or when period changes, but doing it here is fine.
      // Note: Daily and Monthly stats are handled by the real-time effect above.
      const periods = ["week"];
      const statsPromises = periods.map(async (p) => {
        const range = getDateRange(p);
        const data = await getHistoryValueV3(
          configId,
          range.date_from,
          range.date_to
        );
        const { total } = processConsumptionData(data, p);
        return { period: p, total };
      });

      const statsResults = await Promise.all(statsPromises);

      setStats((prev) => ({
        ...prev,
        weekly: statsResults.find((s) => s.period === "week")?.total || 0,
        // monthly is calculated via baseline subtraction in another useEffect
      }));
    };

    loadChartAndStats();
  }, [acId, chartPeriod, selectedDate]);

  // Update Today's value in Chart when in Week mode
  useEffect(() => {
    if (
      chartPeriod === "week" &&
      energyHistory.length > 0 &&
      eraValues?.powerConsumption &&
      dailyBaseline !== null
    ) {
      const todayStr = format(new Date(), "yyyy-MM-dd");
      const currentKwh = Math.max(
        0,
        parseFloat(eraValues.powerConsumption) - dailyBaseline
      );

      setEnergyHistory((prev) =>
        prev.map((item) => {
          if (item.date === todayStr) {
            return { ...item, kwh: currentKwh };
          }
          return item;
        })
      );
    }
  }, [eraValues?.powerConsumption, chartPeriod, dailyBaseline]);

  // Sync online status with E-RA
  useEffect(() => {
    if (ac && isEraLinked && isEraReady && !ac.isOnline) {
      updateACUnit(acId, { isOnline: true });
    }
  }, [isEraReady, isEraLinked, ac?.isOnline, acId]);

  const handlePowerToggle = async () => {
    if (ac) {
      const newPowerState = !ac.isOn;

      // Gửi lệnh đến E-RA thiết bị IoT
      if (isEraReady && isEraLinked) {
        setEraPower(newPowerState);
      }

      // Cập nhật Firebase để sync state
      await updateACUnit(acId, { isOn: newPowerState });
    }
  };

  const handleTemperatureChange = async (delta) => {
    if (ac && ac.isOn) {
      const oldTemp = ac.temperature;
      const newTemp = Math.max(16, Math.min(30, ac.temperature + delta));

      if (oldTemp !== newTemp) {
        // Gửi nhiệt độ đến E-RA thiết bị IoT
        if (isEraReady && isEraLinked) {
          setEraTemperature(newTemp);
        }

        // Cập nhật Firebase để sync state
        await updateACUnit(acId, { temperature: newTemp });

        // Log the change
        const isAIMode = ac.operationMode === "ai";
        const source = isAIMode ? "user_override_ai" : "user";

        await logTemperatureChange(acId, oldTemp, newTemp, source);

        // Log to AI Logs if in AI Mode
        if (isAIMode) {
          logAIAction({
            action: "USER_OVERRIDE",
            details: `User manually adjusted temperature`,
            oldTemp,
            newTemp,
            delta,
            reason: "User preference override",
            temp: newTemp,
            fan: ac.fanMode,
            mode: ac.operationMode,
          });
        }
      }
    }
  };

  const handleFanModeChange = async (mode) => {
    if (ac) {
      // Map fan mode sang E-RA fan speed level
      const fanSpeedMap = {
        auto: 0,
        low: 1,
        medium: 2,
        high: 3,
      };

      // Gửi tốc độ quạt đến E-RA thiết bị IoT
      if (isEraReady && fanSpeedMap[mode] !== undefined && isEraLinked) {
        setEraFanSpeed(fanSpeedMap[mode]);
      }

      // Cập nhật Firebase để sync state
      await updateACUnit(acId, { fanMode: mode });
    }
  };

  const handleOperationModeChange = async (mode) => {
    if (ac) {
      // Map operation mode sang E-RA mode
      // 'manual' -> 'cool', 'ai' -> 'auto'
      if (isEraReady && isEraLinked) {
        const eraMode = mode === "ai" ? "auto" : "cool";
        setEraMode(eraMode);
      }

      // Show AI Activation Overlay if switching to AI mode
      if (mode === "ai") {
        setShowAIActivation(true);
        setTimeout(() => setShowAIActivation(false), 3000);
      }

      // Cập nhật Firebase để sync state
      await updateACUnit(acId, { operationMode: mode });
    }
  };

  const handleSettingsSave = async (settings) => {
    await updateACUnit(acId, settings);
    setShowSettings(false);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>{t("loading")}</p>
      </div>
    );
  }

  if (!ac) {
    return (
      <div className="not-found">
        <h2>{t("acNotFound")}</h2>
        <button className="btn btn-primary" onClick={() => navigate("/")}>
          {t("backToHome")}
        </button>
      </div>
    );
  }

  return (
    <div className="control-panel">
      <AIActivationOverlay isVisible={showAIActivation} />
      <header className="control-header">
        <button className="back-btn" onClick={() => navigate("/")}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          {t("back")}
        </button>
        <div className="header-info">
          <h1>{ac.name}</h1>
          <div className="status-badges">
            <span
              className={`status-badge ${ac.isOnline ? "online" : "offline"}`}
            >
              <span
                className={`status-dot ${ac.isOnline ? "online" : "offline"}`}
              ></span>
              {ac.isOnline ? t("online") : t("offline")}
            </span>
            <span
              className={`status-badge ${
                isEraLinked && isEraReady ? "era-connected" : "era-disconnected"
              }`}
            >
              <span
                className={`status-dot ${
                  isEraLinked && isEraReady ? "online" : "offline"
                }`}
              ></span>
              E-RA{" "}
              {isEraLinked
                ? isEraReady
                  ? "Connected"
                  : "Disconnected"
                : "Not Linked"}
            </span>
          </div>
        </div>
        <button
          className="btn btn-secondary"
          onClick={() => setShowSettings(true)}
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
          {t("configuration")}
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => setShowLogs(true)}
          style={{ marginLeft: "10px" }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
          </svg>
          {t("tempLog")}
        </button>
        <button
          className="btn btn-secondary"
          onClick={downloadLogs}
          style={{ marginLeft: "10px" }}
          title="Download AI Training Logs"
        >
          <FaDownload style={{ marginRight: "5px" }} />
          AI Logs
        </button>
      </header>

      <div className="control-content">
        <div className="left-panel">
          {/* E-RA Real-time Sensor Data */}
          {isEraReady && isEraLinked && (
            <div className="era-realtime-section">
              <h3>Real-time Sensor Data</h3>
              {ac.operationMode === "ai" && (
                <div
                  className="ai-learning-status"
                  style={{
                    marginBottom: "15px",
                    padding: "10px",
                    background: "rgba(34, 197, 94, 0.1)",
                    border: "1px solid rgba(34, 197, 94, 0.3)",
                    borderRadius: "8px",
                    color: "#22c55e",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <FaRobot />
                  <span>
                    AI Learned Preference:{" "}
                    <strong>
                      {getLearnedUserPreference() > 0 ? "+" : ""}
                      {getLearnedUserPreference()}°C
                    </strong>
                  </span>
                </div>
              )}
              <div className="era-sensor-grid">
                <SensorCard
                  title={t("currentTemp") || "Current Temp"}
                  value={
                    eraValues.currentTemperature !== null
                      ? eraValues.currentTemperature
                      : "--"
                  }
                  unit="°C"
                  icon={<FaTemperatureHigh />}
                  color="#f97316" // Orange
                  data={sensorHistory.temp}
                />
                <SensorCard
                  title={t("voltage") || "Voltage"}
                  value={eraValues.voltage !== null ? eraValues.voltage : "--"}
                  unit="V"
                  icon={<FaBolt />}
                  color="#eab308" // Yellow
                  data={sensorHistory.voltage}
                />
                <SensorCard
                  title={t("current") || "Current"}
                  value={eraValues.current !== null ? eraValues.current : "--"}
                  unit="A"
                  icon={<FaPlug />}
                  color="#3b82f6" // Blue
                  data={sensorHistory.current}
                />
                <SensorCard
                  title={t("powerConsumption") || "Power Consumption"}
                  value={
                    eraValues.powerConsumption !== null
                      ? eraValues.powerConsumption
                      : "--"
                  }
                  unit="kWh"
                  icon={<FaLeaf />}
                  color="#22c55e" // Green
                  data={sensorHistory.power}
                />
              </div>
            </div>
          )}

          <div className="main-control glass-card">
            <div className="room-info">
              <span className="room-name">{ac.roomName}</span>
              <span className="room-area">{ac.roomArea} m2</span>
            </div>

            <div className="temperature-control">
              <button
                className="temp-btn minus"
                onClick={() => handleTemperatureChange(-1)}
                disabled={!ac.isOn}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>

              <motion.div
                className={`temperature-display ${ac.isOn ? "active" : ""}`}
                animate={{ scale: ac.isOn ? 1 : 0.9 }}
                style={{
                  color: ac.isOn ? getTempColor(ac.temperature) : undefined,
                }}
              >
                {ac.isOn ? (
                  <>
                    <span className="temp-value">{ac.temperature}</span>
                    <span className="temp-unit">C</span>
                  </>
                ) : (
                  <span className="power-off">OFF</span>
                )}
              </motion.div>

              <button
                className="temp-btn plus"
                onClick={() => handleTemperatureChange(1)}
                disabled={!ac.isOn}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
            </div>

            <button
              className={`power-btn ${ac.isOn ? "on" : "off"}`}
              onClick={handlePowerToggle}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
                <line x1="12" y1="2" x2="12" y2="12" />
              </svg>
            </button>

            <div className="mode-controls">
              <div className="control-group">
                <label>{t("fanMode")}</label>
                <div className="mode-buttons">
                  {["auto", "low", "medium", "high"].map((mode) => (
                    <button
                      key={mode}
                      className={`mode-btn ${
                        ac.fanMode === mode ? "active" : ""
                      }`}
                      onClick={() => handleFanModeChange(mode)}
                    >
                      {mode === "auto"
                        ? t("auto")
                        : mode === "low"
                        ? t("low")
                        : mode === "medium"
                        ? t("medium")
                        : t("high")}
                    </button>
                  ))}
                </div>
              </div>

              <div className="control-group">
                <label>{t("operationMode")}</label>
                <div className="mode-buttons operation-mode">
                  <button
                    className={`mode-btn ${
                      ac.operationMode === "manual" ? "active" : ""
                    }`}
                    onClick={() => handleOperationModeChange("manual")}
                  >
                    {t("manual")}
                  </button>
                  <button
                    className={`mode-btn ai ${
                      ac.operationMode === "ai" ? "active" : ""
                    }`}
                    onClick={() => handleOperationModeChange("ai")}
                  >
                    {t("aiMode")}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="ac-specs glass-card">
            <h3>{t("acSpecs")}</h3>
            <div className="specs-grid">
              <div className="spec-item">
                <span className="spec-label">{t("type")}</span>
                <span className="spec-value">
                  {ac.acType === "inverter" ? t("inverter") : t("nonInverter")}
                </span>
              </div>
              <div className="spec-item">
                <span className="spec-label">{t("capacity")}</span>
                <span className="spec-value">{ac.capacity} BTU</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">{t("power")}</span>
                <span className="spec-value">{ac.power} W</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">{t("brand")}</span>
                <span className="spec-value">{ac.brand || "N/A"}</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">{t("model")}</span>
                <span className="spec-value">{ac.model || "N/A"}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="right-panel">
          <div className="energy-stats glass-card">
            <h3>{t("energyStats")}</h3>
            <div className="stats-grid">
              <div className="energy-stat-item">
                <span className="stat-value">{stats.daily.toFixed(2)}</span>
                <span className="stat-label">{t("kwhToday")}</span>
              </div>
              <div className="energy-stat-item">
                <span className="stat-value">{stats.weekly.toFixed(2)}</span>
                <span className="stat-label">{t("kwhThisWeek")}</span>
              </div>
              <div className="energy-stat-item">
                <span className="stat-value">{stats.monthly.toFixed(2)}</span>
                <span className="stat-label">{t("kwhThisMonth")}</span>
              </div>
              <div className="energy-stat-item">
                <span className="stat-value">{stats.yearly.toFixed(2)}</span>
                <span className="stat-label">{t("kwhThisYear")}</span>
              </div>
            </div>
          </div>

          <div className="energy-chart-container glass-card">
            <div className="chart-header">
              <h3>{t("energyChart")}</h3>
              <div
                className="chart-controls"
                style={{ display: "flex", gap: "10px", alignItems: "center" }}
              >
                {chartPeriod === "week" && (
                  <input
                    type="date"
                    className="date-picker"
                    value={format(selectedDate, "yyyy-MM-dd")}
                    onChange={(e) => {
                      if (e.target.value) {
                        const newDate = parseISO(e.target.value);
                        setSelectedDate(newDate);
                      }
                    }}
                    style={{
                      padding: "5px 10px",
                      borderRadius: "8px",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      background: "rgba(255, 255, 255, 0.05)",
                      color: "var(--text-primary)",
                      outline: "none",
                      cursor: "pointer",
                    }}
                  />
                )}
                <div className="chart-period-selector">
                  {["day", "week", "month"].map((period) => (
                    <button
                      key={period}
                      className={`period-btn ${
                        chartPeriod === period ? "active" : ""
                      }`}
                      onClick={() => {
                        setChartPeriod(period);
                        // Reset date to today when switching periods if needed,
                        // or keep it. Let's keep it for now or reset?
                        // User might want to see "Day" for the selected date too.
                        // But for now, let's just enable it for Week as requested.
                        if (period === "week" && !selectedDate) {
                          setSelectedDate(new Date());
                        }
                      }}
                    >
                      {period === "day"
                        ? t("day")
                        : period === "week"
                        ? t("week")
                        : t("month")}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <EnergyChart data={energyHistory} period={chartPeriod} />
          </div>

          <WeatherPanel />
        </div>
      </div>

      {showSettings && (
        <ACSettings
          ac={ac}
          onClose={() => setShowSettings(false)}
          onSave={handleSettingsSave}
        />
      )}

      <TemperatureLogModal
        isOpen={showLogs}
        onClose={() => setShowLogs(false)}
        acId={acId}
      />
    </div>
  );
};

export default ControlPanel;
