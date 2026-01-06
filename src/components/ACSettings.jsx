import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "../contexts/LanguageContext";
import "./ACSettings.css";

const ACSettings = ({ ac, onClose, onSave }) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: ac.name || "",
    roomName: ac.roomName || "",
    roomArea: ac.roomArea || "",
    acType: ac.acType || "inverter",
    capacity: ac.capacity || "9000",
    power: ac.power || "1000",
    brand: ac.brand || "",
    model: ac.model || "",
    eraConfigId: ac.eraConfigId || "",
    voltageId: ac.voltageId || "",
    currentId: ac.currentId || "",
    tempId: ac.tempId || "",
    isEraLinked: ac.isEraLinked !== false, // Default to true if undefined (legacy support)
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      roomArea: parseFloat(formData.roomArea) || 0,
      capacity: parseInt(formData.capacity) || 9000,
      power: parseInt(formData.power) || 1000,
      eraConfigId: formData.eraConfigId ? parseInt(formData.eraConfigId) : null,
      voltageId: formData.voltageId ? parseInt(formData.voltageId) : null,
      currentId: formData.currentId ? parseInt(formData.currentId) : null,
      tempId: formData.tempId ? parseInt(formData.tempId) : null,
    });
  };

  return (
    <AnimatePresence>
      <motion.div
        className="modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="modal-content settings-modal"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <h2>{t("acConfiguration")}</h2>
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

          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="settings-section">
                <h3>{t("basicInfo")}</h3>
                <div className="form-row">
                  <div className="input-group">
                    <label>{t("acName")}</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="input-field"
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="input-group">
                    <label>{t("roomName")}</label>
                    <input
                      type="text"
                      name="roomName"
                      value={formData.roomName}
                      onChange={handleChange}
                      className="input-field"
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label>{t("roomArea")}</label>
                    <input
                      type="number"
                      name="roomArea"
                      value={formData.roomArea}
                      onChange={handleChange}
                      className="input-field"
                      min="0"
                      step="0.1"
                    />
                  </div>
                </div>
              </div>

              <div className="settings-section">
                <h3>{t("technicalSpecs")}</h3>
                <p className="section-desc">{t("techSpecsDesc")}</p>

                <div className="form-row">
                  <div className="input-group">
                    <label>{t("acType")}</label>
                    <select
                      name="acType"
                      value={formData.acType}
                      onChange={handleChange}
                      className="input-field"
                    >
                      <option value="inverter">{t("inverter")}</option>
                      <option value="non-inverter">{t("nonInverter")}</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label>{t("capacityBTU")}</label>
                    <select
                      name="capacity"
                      value={formData.capacity}
                      onChange={handleChange}
                      className="input-field"
                    >
                      <option value="9000">9000 BTU (1HP)</option>
                      <option value="12000">12000 BTU (1.5HP)</option>
                      <option value="18000">18000 BTU (2HP)</option>
                      <option value="24000">24000 BTU (2.5HP)</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="input-group">
                    <label>{t("powerW")}</label>
                    <input
                      type="number"
                      name="power"
                      value={formData.power}
                      onChange={handleChange}
                      className="input-field"
                      min="0"
                    />
                  </div>
                  <div className="input-group">
                    <label>E-RA Config ID (Power)</label>
                    <input
                      type="number"
                      name="eraConfigId"
                      value={formData.eraConfigId}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="E.g.: 101076"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="input-group">
                    <label>Temp ID</label>
                    <input
                      type="number"
                      name="tempId"
                      value={formData.tempId}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="E.g.: 101077"
                    />
                  </div>
                  <div className="input-group">
                    <label>Voltage ID</label>
                    <input
                      type="number"
                      name="voltageId"
                      value={formData.voltageId}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="E.g.: 101078"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="input-group">
                    <label>Current ID</label>
                    <input
                      type="number"
                      name="currentId"
                      value={formData.currentId}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="E.g.: 101079"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="input-group">
                    <label>{t("brandLabel")}</label>
                    <input
                      type="text"
                      name="brand"
                      value={formData.brand}
                      onChange={handleChange}
                      className="input-field"
                      placeholder={t("brandPlaceholder")}
                    />
                  </div>
                  <div className="input-group">
                    <label>{t("modelLabel")}</label>
                    <input
                      type="text"
                      name="model"
                      value={formData.model}
                      onChange={handleChange}
                      className="input-field"
                      placeholder={t("modelPlaceholder")}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div
                    className="input-group checkbox-group"
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <input
                      type="checkbox"
                      name="isEraLinked"
                      checked={formData.isEraLinked}
                      onChange={handleChange}
                      id="isEraLinked"
                      style={{ width: "auto", margin: 0 }}
                    />
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <label
                        htmlFor="isEraLinked"
                        style={{ marginBottom: 0, cursor: "pointer" }}
                      >
                        {t("linkToEra") || "Link to E-RA Device (IoT)"}
                      </label>
                      <small
                        style={{
                          color: "var(--text-muted)",
                          fontSize: "0.8rem",
                        }}
                      >
                        {t("linkToEraHelp") ||
                          "Enable this to sync with real-time IoT data."}
                      </small>
                    </div>
                  </div>
                </div>
              </div>

              <div className="ai-mode-info">
                <div className="info-icon">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 16v-4M12 8h.01" />
                  </svg>
                </div>
                <div className="info-content">
                  <strong>{t("aiModeInfo")}</strong>
                  <p>{t("aiModeDesc")}</p>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
              >
                {t("cancel")}
              </button>
              <button type="submit" className="btn btn-primary">
                {t("saveConfig")}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ACSettings;
