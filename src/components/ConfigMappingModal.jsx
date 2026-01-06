import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "../contexts/LanguageContext";
import "./ConfigMappingModal.css";
import "./ACCard.css"; // Ensure ACCard styles are imported for the card effect

const MAPPING_FIELDS = [
  { key: "targetTemp", label: "Target Temperature" },
  { key: "currentTemp", label: "Current Temperature" },
  { key: "mode", label: "Operational Mode" },
  { key: "fanSpeed", label: "Fan Speed" },
  { key: "power", label: "Power State (On/Off)" },
  { key: "current", label: "Current (Amperes)" },
  { key: "voltage", label: "Voltage (Volts)" },
  { key: "powerConsumption", label: "Power Consumption (kWh)" },
];

const ConfigMappingModal = ({
  visible,
  onClose,
  onSubmit,
  configs = [],
  acName,
}) => {
  const { t } = useLanguage();
  const [mappings, setMappings] = useState({});

  useEffect(() => {
    // Reset mappings when visible changes or configs change
    if (visible) {
      const initial = {};
      MAPPING_FIELDS.forEach((field) => {
        initial[field.key] = "";
      });
      setMappings(initial);
    }
  }, [visible, configs]);

  const handleMappingChange = (key, configId) => {
    setMappings((prev) => ({
      ...prev,
      [key]: configId,
    }));
  };

  const handleFinish = (e) => {
    e.preventDefault();
    onSubmit(mappings);
  };

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="modal-content neon-border"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
        >
          <div className="modal-header">
            <h2>Config Mapping: {acName}</h2>
            <button className="close-btn" onClick={onClose}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div
            className="neon-border ac-card glass-card online active"
            style={{
              padding: "15px",
              borderRadius: "8px",
            }}
          >
            <h4
              style={{
                color: "#00f3ff",
                textShadow: "0 0 5px #00f3ff",
                marginBottom: "15px",
              }}
            >
              Configuration Mapping
            </h4>

            <form onSubmit={handleFinish}>
              <div
                className="mapping-grid"
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10px",
                }}
              >
                {MAPPING_FIELDS.map((field) => (
                  <div
                    className="input-group"
                    key={field.key}
                    style={{ marginBottom: "10px" }}
                  >
                    <label style={{ color: "#fff", fontSize: "0.8rem" }}>
                      {field.label}
                    </label>
                    <select
                      className="input-field neon-input"
                      value={mappings[field.key] || ""}
                      onChange={(e) =>
                        handleMappingChange(field.key, e.target.value)
                      }
                      style={{ fontSize: "0.85rem", padding: "5px" }}
                    >
                      <option value="">-- Select Config --</option>
                      {configs.map((cfg, index) => (
                        <option key={cfg.id || index} value={cfg.id}>
                          {cfg.caption || cfg.name || cfg.parameter_name} (ID:{" "}
                          {cfg.id})
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              <div className="modal-footer" style={{ marginTop: "20px" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onClose}
                >
                  {t("cancel")}
                </button>
                <button type="submit" className="btn btn-primary neon-btn">
                  Finish Setup
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ConfigMappingModal;
