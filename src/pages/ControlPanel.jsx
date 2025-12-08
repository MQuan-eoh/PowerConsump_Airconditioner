import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  subscribeToACUnit,
  updateACUnit,
  getEnergyHistory,
  subscribeToDailyConsumption,
  getMonthlyConsumption,
  getYearlyConsumption,
} from "../services/firebaseService";
import { useLanguage } from "../contexts/LanguageContext";
import { useEra } from "../contexts/EraContext";
import EnergyChart from "../components/EnergyChart";
import WeatherPanel from "../components/WeatherPanel";
import ACSettings from "../components/ACSettings";
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
  const [loading, setLoading] = useState(true);
  const [chartPeriod, setChartPeriod] = useState("day");
  const [energyHistory, setEnergyHistory] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [stats, setStats] = useState({
    daily: 0,
    weekly: 0,
    monthly: 0,
    yearly: 0,
  });

  // Determine if this AC is linked to E-RA (default to true if undefined for legacy support)
  const isEraLinked = ac?.isEraLinked !== false;

  useEffect(() => {
    const unsubscribe = subscribeToACUnit(acId, (data) => {
      setAC(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [acId]);

  useEffect(() => {
    const loadEnergyData = async () => {
      let days = 7;
      if (chartPeriod === "day") days = 7;
      else if (chartPeriod === "week") days = 28;
      else if (chartPeriod === "month") days = 30;

      const history = await getEnergyHistory(acId, days);
      setEnergyHistory(history);

      const monthly = await getMonthlyConsumption(acId);
      const yearly = await getYearlyConsumption(acId);

      setStats((prev) => ({
        ...prev,
        monthly,
        yearly,
      }));
    };

    loadEnergyData();
  }, [acId, chartPeriod]);

  useEffect(() => {
    const unsubscribe = subscribeToDailyConsumption(acId, (data) => {
      const today = new Date().toISOString().split("T")[0];
      const todayKwh = data[today]?.totalKwh || 0;

      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      let weeklyKwh = 0;

      Object.keys(data).forEach((dateKey) => {
        const date = new Date(dateKey);
        if (date >= weekAgo) {
          weeklyKwh += data[dateKey].totalKwh || 0;
        }
      });

      setStats((prev) => ({
        ...prev,
        daily: todayKwh,
        weekly: weeklyKwh,
      }));
    });

    return () => unsubscribe();
  }, [acId]);

  // Cập nhật stats từ E-RA nếu có dữ liệu powerConsumption
  useEffect(() => {
    if (isEraReady && eraValues.powerConsumption && isEraLinked) {
      setStats((prev) => ({
        ...prev,
        daily: eraValues.powerConsumption,
      }));
    }
  }, [isEraReady, eraValues.powerConsumption, isEraLinked]);

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
      const newTemp = Math.max(16, Math.min(30, ac.temperature + delta));

      // Gửi nhiệt độ đến E-RA thiết bị IoT
      if (isEraReady && isEraLinked) {
        setEraTemperature(newTemp);
      }

      // Cập nhật Firebase để sync state
      await updateACUnit(acId, { temperature: newTemp });
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
      </header>

      <div className="control-content">
        <div className="left-panel">
          {/* E-RA Real-time Sensor Data */}
          {isEraReady && isEraLinked && (
            <div className="era-realtime glass-card">
              <h3>Real-time Sensor Data (E-RA)</h3>
              <div className="era-data-grid">
                <div className="era-data-item">
                  <span className="era-label">
                    {t("currentTemp") || "Current Temp"}
                  </span>
                  <span className="era-value">
                    {eraValues.currentTemperature !== null
                      ? `${eraValues.currentTemperature}C`
                      : "--"}
                  </span>
                </div>
                <div className="era-data-item">
                  <span className="era-label">{t("voltage") || "Voltage"}</span>
                  <span className="era-value">
                    {eraValues.voltage !== null
                      ? `${eraValues.voltage}V`
                      : "--"}
                  </span>
                </div>
                <div className="era-data-item">
                  <span className="era-label">{t("current") || "Current"}</span>
                  <span className="era-value">
                    {eraValues.current !== null
                      ? `${eraValues.current}A`
                      : "--"}
                  </span>
                </div>
                <div className="era-data-item">
                  <span className="era-label">
                    {t("powerConsumption") || "Power"}
                  </span>
                  <span className="era-value">
                    {eraValues.powerConsumption !== null
                      ? `${eraValues.powerConsumption}kWh`
                      : "--"}
                  </span>
                </div>
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
              <div className="chart-period-selector">
                {["day", "week", "month"].map((period) => (
                  <button
                    key={period}
                    className={`period-btn ${
                      chartPeriod === period ? "active" : ""
                    }`}
                    onClick={() => setChartPeriod(period)}
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
    </div>
  );
};

export default ControlPanel;
