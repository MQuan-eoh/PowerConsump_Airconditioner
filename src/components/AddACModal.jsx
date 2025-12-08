import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "../contexts/LanguageContext";
import "./AddACModal.css";

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd({
      ...formData,
      roomArea: parseFloat(formData.roomArea) || 0,
      capacity: parseInt(formData.capacity) || 9000,
      power: parseInt(formData.power) || 1000,
    });
  };

  return (
    <AnimatePresence>
      <motion.div
        className="modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="modal-content"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          // onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <h2>{t("addNewAC")}</h2>
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
                {t("addNewAC")}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AddACModal;
