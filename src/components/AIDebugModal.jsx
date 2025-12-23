import React, { useState, useEffect } from "react";
import "./AIDebugModal.css";
import { calculateOptimalSettings } from "../utils/aiLogic";
import { getLearnedUserPreference } from "../services/aiLogService";

const AIDebugModal = ({ isOpen, onClose, eraValues, ac }) => {
  const [debugData, setDebugData] = useState(null);

  const runAnalysis = () => {
    if (!ac) return;

    const currentTemp = eraValues?.currentTemperature || 28; // Default fallback
    const currentHumidity = eraValues?.humidity || 60; // Default fallback
    const roomArea = ac.roomArea || 20;
    const acType = ac.acType || "inverter";

    // Get learned preference
    const userOffset = getLearnedUserPreference();

    // Calculate optimal settings
    const optimal = calculateOptimalSettings({
      currentTemp,
      currentHumidity,
      roomArea,
      acType,
      userOffset,
      // weather: { temp: 32 } // Mock weather for now
    });

    setDebugData({
      inputs: {
        currentTemp,
        currentHumidity,
        roomArea,
        acType,
        userOffset,
      },
      outputs: optimal,
      timestamp: new Date().toLocaleTimeString(),
    });
  };

  useEffect(() => {
    if (isOpen) {
      runAnalysis();
    }
  }, [isOpen, eraValues, ac]);

  if (!isOpen) return null;

  return (
    <div className="ai-debug-modal-overlay" onClick={onClose}>
      <div
        className="ai-debug-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ai-debug-header">
          <h2>AI Algorithm Analysis</h2>
          <button className="close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        {debugData ? (
          <>
            <div className="debug-section">
              <h3>Input Parameters (Dữ liệu đầu vào)</h3>
              <div className="data-grid">
                <div className="data-item">
                  <span className="data-label">Current Temp</span>
                  <span className="data-value">
                    {debugData.inputs.currentTemp}°C
                  </span>
                </div>
                <div className="data-item">
                  <span className="data-label">Humidity</span>
                  <span className="data-value">
                    {debugData.inputs.currentHumidity}%
                  </span>
                </div>
                <div className="data-item">
                  <span className="data-label">Room Area</span>
                  <span className="data-value">
                    {debugData.inputs.roomArea} m²
                  </span>
                </div>
                <div className="data-item">
                  <span className="data-label">AC Type</span>
                  <span
                    className="data-value"
                    style={{ textTransform: "capitalize" }}
                  >
                    {debugData.inputs.acType}
                  </span>
                </div>
                <div className="data-item">
                  <span className="data-label">Learned Offset</span>
                  <span className="data-value highlight">
                    {debugData.inputs.userOffset > 0 ? "+" : ""}
                    {debugData.inputs.userOffset}°C
                  </span>
                  <span style={{ fontSize: "0.7rem", color: "#888" }}>
                    (Based on time of day)
                  </span>
                </div>
              </div>
            </div>

            <div className="debug-section">
              <h3>Algorithm Decision (Quyết định của AI)</h3>
              <div className="data-grid">
                <div className="data-item">
                  <span className="data-label">Target Temp</span>
                  <span className="data-value highlight">
                    {debugData.outputs.temp}°C
                  </span>
                </div>
                <div className="data-item">
                  <span className="data-label">Fan Mode</span>
                  <span
                    className="data-value"
                    style={{ textTransform: "capitalize" }}
                  >
                    {debugData.outputs.fan}
                  </span>
                </div>
                <div className="data-item">
                  <span className="data-label">Operation Mode</span>
                  <span
                    className="data-value"
                    style={{ textTransform: "capitalize" }}
                  >
                    {debugData.outputs.mode}
                  </span>
                </div>
              </div>
            </div>

            <div className="debug-section">
              <h3>Decision Logic (Lý do)</h3>
              {debugData.outputs.reason ? (
                <ul className="reasons-list">
                  {debugData.outputs.reason
                    .split(". ")
                    .map(
                      (reason, index) =>
                        reason.trim() && <li key={index}>{reason}</li>
                    )}
                </ul>
              ) : (
                <p className="no-reasons">
                  Standard operation (26°C base) - No adjustments needed.
                </p>
              )}
            </div>

            <div
              style={{
                textAlign: "center",
                color: "#888",
                fontSize: "0.8rem",
                marginTop: "20px",
              }}
            >
              Last analysis: {debugData.timestamp}
            </div>

            <button className="refresh-btn" onClick={runAnalysis}>
              Refresh Analysis
            </button>
          </>
        ) : (
          <div style={{ padding: "20px", textAlign: "center" }}>
            Loading analysis...
          </div>
        )}
      </div>
    </div>
  );
};

export default AIDebugModal;
