import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "../contexts/LanguageContext";
import { fetchUnitChips, fetchChipConfigs } from "../services/eraService";
import "./AddACModal.css";
// reusing the CSS from ConfigMappingModal for the inline section if needed, or inline styles
import "./ConfigMappingModal.css";

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

const AddACModal = ({ onClose, onAdd }) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: "",
    roomName: "",
    roomArea: "",
    acType: "inverter",
    capacity: "9000",
    power: "1000",
    brand: "",
    model: "",
  });

  const [chips, setChips] = useState([]);
  const [configs, setConfigs] = useState([]);
  const [selectedChipId, setSelectedChipId] = useState("");
  const [loadingEra, setLoadingEra] = useState(false);
  const [eraError, setEraError] = useState(null);
  const [mappings, setMappings] = useState({});
  const [step, setStep] = useState(1);

  // Initialize mappings when configs are loaded
  useEffect(() => {
    if (configs.length > 0) {
      const initial = {};
      MAPPING_FIELDS.forEach((field) => {
        initial[field.key] = "";
      });
      setMappings(initial);
    }
  }, [configs]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleMappingChange = (key, configId) => {
    setMappings((prev) => ({
      ...prev,
      [key]: configId,
    }));
  };

  const handleLoadChips = async () => {
    setLoadingEra(true);
    setEraError(null);
    try {
      const data = await fetchUnitChips();
      // Handle array or pagination result
      const list = Array.isArray(data) ? data : data.results || [];
      setChips(list);
    } catch (error) {
      console.error(error);
      setEraError("Failed to load chips from E-RA");
    } finally {
      setLoadingEra(false);
    }
  };

  const handleChipChange = async (e) => {
    const chipId = e.target.value;
    setSelectedChipId(chipId);
    setConfigs([]);

    if (chipId) {
      setLoadingEra(true);
      setEraError(null);
      try {
        const data = await fetchChipConfigs(chipId);
        const list = Array.isArray(data) ? data : data.results || [];
        setConfigs(list);
      } catch (error) {
        console.error(error);
        setEraError("Failed to load configs for selected chip");
        setConfigs([]);
      } finally {
        setLoadingEra(false);
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (step === 1) {
      setStep(2);
      return;
    }

    // Final submission (from step 2)
    onAdd({
      ...formData,
      roomArea: parseFloat(formData.roomArea) || 0,
      capacity: parseInt(formData.capacity) || 9000,
      power: parseInt(formData.power) || 1000,
      chipId: selectedChipId,
      configMapping: mappings,
    });
  };

  return (
    <>
      <AnimatePresence>
        <motion.div
          key="add-ac-modal"
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="modal-content wide-modal"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
          >
            <div className="modal-header">
              <h2>{step === 1 ? t("addNewAC") : "Cấu hình mapping dữ liệu"}</h2>
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
                {step === 1 ? (
                  <>
                    <div className="form-row">
                      <div className="input-group">
                        <label>{t("acName")}</label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          className="input-field"
                          placeholder={t("acNamePlaceholder")}
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
                          placeholder={t("roomNamePlaceholder")}
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
                          placeholder={t("roomAreaPlaceholder")}
                          min="0"
                          step="0.1"
                        />
                      </div>
                    </div>

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
                          <option value="non-inverter">
                            {t("nonInverter")}
                          </option>
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
                          placeholder={t("powerPlaceholder")}
                          min="0"
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
                  </>
                ) : (
                  <div className="era-setup-container">
                    {/* Device Selection Section */}
                    <div className="setup-section glass-card">
                      <div className="section-header">
                        <div className="header-icon">
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                            <polyline points="13 2 13 9 20 9"></polyline>
                          </svg>
                        </div>
                        <h3>E-RA Integration</h3>
                      </div>

                      {eraError && (
                        <div className="error-message">
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                          </svg>
                          {eraError}
                        </div>
                      )}

                      <div className="action-row">
                        <button
                          type="button"
                          className="btn btn-outline-primary full-width"
                          onClick={handleLoadChips}
                          disabled={loadingEra}
                        >
                          {loadingEra ? (
                            <>
                              <span className="spinner"></span>
                              Loading Devices...
                            </>
                          ) : (
                            <>
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                style={{ marginRight: "8px" }}
                              >
                                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                              </svg>
                              Load Devices from E-RA
                            </>
                          )}
                        </button>
                      </div>

                      {chips.length > 0 && (
                        <div className="input-group slide-down">
                          <label>Select Device (Chip)</label>
                          <select
                            className="input-field"
                            value={selectedChipId}
                            onChange={handleChipChange}
                            disabled={loadingEra}
                          >
                            <option value="">-- Select Device --</option>
                            {chips.map((chip, index) => (
                              <option key={chip.id || index} value={chip.id}>
                                {chip.name || chip.code} (ID: {chip.id})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    {/* Mapping Section */}
                    {configs.length > 0 && (
                      <div className="setup-section glass-card slide-down">
                        <div className="section-header">
                          <div className="header-icon green">
                            <svg
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                            </svg>
                          </div>
                          <h3>Configuration Mapping</h3>
                        </div>

                        <div className="mapping-grid">
                          {MAPPING_FIELDS.map((field) => (
                            <div className="mapping-item" key={field.key}>
                              <label>{field.label}</label>
                              <select
                                className="input-field"
                                value={mappings[field.key] || ""}
                                onChange={(e) =>
                                  handleMappingChange(field.key, e.target.value)
                                }
                              >
                                <option value="">-- Select Config --</option>
                                {configs.map((cfg, index) => (
                                  <option key={cfg.id || index} value={cfg.id}>
                                    {cfg.caption ||
                                      cfg.name ||
                                      cfg.parameter_name}
                                    <span className="config-id">
                                      {" "}
                                      (ID: {cfg.id})
                                    </span>
                                  </option>
                                ))}
                              </select>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="modal-footer">
                {step === 2 && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setStep(1)}
                    style={{ marginRight: "auto" }}
                  >
                    {t("back")}
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onClose}
                >
                  {t("cancel")}
                </button>
                <button type="submit" className="btn btn-primary">
                  {step === 1 ? t("addAC") : t("finish")}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </>
  );
};

export default AddACModal;
