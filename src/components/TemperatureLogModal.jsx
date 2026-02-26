import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
  Cell,
} from "recharts";
import { useTranslation } from "react-i18next";
import { getTemperatureLogs } from "../services/firebaseService";
import { getTempColor } from "../utils/tempUtils";
import "./TemperatureLogModal.css";

const CustomBarShape = (props) => {
  const { fill, x, y, width, height } = props;

  return (
    <g>
      {/* Front Face */}
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={fill}
        opacity={0.8}
      />
      {/* Top Face (Simulated 3D) */}
      <path
        d={`M${x},${y} L${x + 5},${y - 5} L${x + width + 5},${y - 5} L${
          x + width
        },${y} Z`}
        fill={fill}
        opacity={0.6}
      />
      {/* Side Face (Simulated 3D) */}
      <path
        d={`M${x + width},${y} L${x + width + 5},${y - 5} L${x + width + 5},${
          y + height - 5
        } L${x + width},${y + height} Z`}
        fill={fill}
        opacity={0.4}
      />
    </g>
  );
};

const TemperatureLogModal = ({ isOpen, onClose, acId }) => {
  const { t } = useTranslation();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState("day"); // day, week, month
  const [viewMode, setViewMode] = useState("chart"); // chart, list

  useEffect(() => {
    if (isOpen && acId) {
      fetchLogs();
    }
  }, [isOpen, acId, period]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await getTemperatureLogs(acId, period);
      setLogs(data);
    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatChartTime = (timestamp) => {
    const date = new Date(timestamp);
    if (period === "day")
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    return date.toLocaleDateString([], { day: "2-digit", month: "2-digit" });
  };

  // Prepare data for chart (reverse to show chronological order)
  const chartData = [...logs].reverse().map((log) => ({
    ...log,
    timeLabel: formatChartTime(log.timestamp),
  }));

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-overlay"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="modal-content log-modal"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>{t("tempLog")}</h2>
              <button className="close-btn" onClick={onClose}>
                &times;
              </button>
            </div>

            <div className="log-controls">
              <div className="log-filters">
                <button
                  className={`filter-btn ${period === "day" ? "active" : ""}`}
                  onClick={() => setPeriod("day")}
                >
                  {t("day")}
                </button>
                <button
                  className={`filter-btn ${period === "week" ? "active" : ""}`}
                  onClick={() => setPeriod("week")}
                >
                  {t("week")}
                </button>
                <button
                  className={`filter-btn ${period === "month" ? "active" : ""}`}
                  onClick={() => setPeriod("month")}
                >
                  {t("month")}
                </button>
              </div>

              <div className="view-toggles">
                <button
                  className={`toggle-btn ${
                    viewMode === "chart" ? "active" : ""
                  }`}
                  onClick={() => setViewMode("chart")}
                  title="Chart View"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <line x1="8" y1="12" x2="8" y2="17" />
                    <line x1="12" y1="8" x2="12" y2="17" />
                    <line x1="16" y1="14" x2="16" y2="17" />
                  </svg>
                </button>
                <button
                  className={`toggle-btn ${
                    viewMode === "list" ? "active" : ""
                  }`}
                  onClick={() => setViewMode("list")}
                  title="List View"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="8" y1="6" x2="21" y2="6" />
                    <line x1="8" y1="12" x2="21" y2="12" />
                    <line x1="8" y1="18" x2="21" y2="18" />
                    <line x1="3" y1="6" x2="3.01" y2="6" />
                    <line x1="3" y1="12" x2="3.01" y2="12" />
                    <line x1="3" y1="18" x2="3.01" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="log-content-container">
              {loading ? (
                <div className="loading-spinner"></div>
              ) : logs.length > 0 ? (
                viewMode === "chart" ? (
                  <div className="chart-container">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart
                        data={chartData}
                        margin={{
                          top: 20,
                          right: 30,
                          left: 20,
                          bottom: 20,
                        }}
                      >
                        <defs>
                          <linearGradient
                            id="colorTemp"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#8884d8"
                              stopOpacity={0.8}
                            />
                            <stop
                              offset="95%"
                              stopColor="#8884d8"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="rgba(255,255,255,0.1)"
                        />
                        <XAxis dataKey="timeLabel" stroke="#ccc" />
                        <YAxis
                          stroke="#ccc"
                          domain={["dataMin - 2", "dataMax + 2"]}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "rgba(0,0,0,0.8)",
                            border: "none",
                            borderRadius: "8px",
                          }}
                          itemStyle={{ color: "#fff" }}
                        />
                        <Bar
                          dataKey="newTemp"
                          fill="#8884d8"
                          barSize={20}
                          shape={<CustomBarShape />}
                        >
                          {chartData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={getTempColor(entry.newTemp)}
                            />
                          ))}
                        </Bar>
                        <Line
                          type="monotone"
                          dataKey="newTemp"
                          stroke="#ff7300"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                        >
                          <LabelList
                            dataKey="newTemp"
                            position="top"
                            fill="#fff"
                            offset={10}
                          />
                        </Line>
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="table-container">
                    <table className="log-table">
                      <thead>
                        <tr>
                          <th>{t("time")}</th>
                          <th>{t("oldTemp")}</th>
                          <th>{t("newTemp")}</th>
                          <th>{t("source")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {logs.map((log) => (
                          <tr key={log.id}>
                            <td>{formatTime(log.timestamp)}</td>
                            <td
                              style={{
                                color: getTempColor(log.oldTemp),
                                fontWeight: "bold",
                              }}
                            >
                              {log.oldTemp}°C
                            </td>
                            <td
                              style={{
                                color: getTempColor(log.newTemp),
                                fontWeight: "bold",
                              }}
                            >
                              {log.newTemp}°C
                            </td>
                            <td>
                              {log.source === "user"
                                ? t("manualAdjustment")
                                : log.source === "user_override_ai"
                                ? t("userOverrideAI")
                                : t("autoAdjustment")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              ) : (
                <div className="no-logs">{t("noLogs")}</div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TemperatureLogModal;
