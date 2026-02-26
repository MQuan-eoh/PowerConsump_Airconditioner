import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  addElectricityBill,
  subscribeToElectricityBills,
  deleteElectricityBill,
  calculateSavings,
} from "../services/firebaseService";
import { useTranslation } from "react-i18next";
import "./BillManagement.css";

const BillManagement = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [bills, setBills] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    month: "",
    kwh: "",
    amount: "",
    isBefore: true,
  });

  useEffect(() => {
    const unsubscribe = subscribeToElectricityBills(setBills);
    return () => unsubscribe();
  }, []);

  const handleAddBill = async (e) => {
    e.preventDefault();
    await addElectricityBill({
      month: formData.month,
      kwh: parseFloat(formData.kwh) || 0,
      amount: parseFloat(formData.amount) || 0,
      isBefore: formData.isBefore,
    });
    setFormData({ month: "", kwh: "", amount: "", isBefore: true });
    setShowAddModal(false);
  };

  const handleDeleteBill = async (billId) => {
    if (window.confirm(t("confirmDeleteBill"))) {
      await deleteElectricityBill(billId);
    }
  };

  const beforeBills = bills.filter((b) => b.isBefore);
  const afterBills = bills.filter((b) => !b.isBefore);

  const totalBeforeKwh = beforeBills.reduce((sum, b) => sum + b.kwh, 0);
  const totalAfterKwh = afterBills.reduce((sum, b) => sum + b.kwh, 0);
  const avgBeforeKwh =
    beforeBills.length > 0 ? totalBeforeKwh / beforeBills.length : 0;
  const avgAfterKwh =
    afterBills.length > 0 ? totalAfterKwh / afterBills.length : 0;

  const savings = calculateSavings(avgBeforeKwh, avgAfterKwh);

  const formatMoney = (amount) => {
    return new Intl.NumberFormat("vi-VN").format(amount);
  };

  return (
    <div className="bill-management">
      <header className="bill-header">
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
        <h1>{t("billManagement")}</h1>
        <button
          className="btn btn-primary"
          onClick={() => setShowAddModal(true)}
        >
          {t("addBill")}
        </button>
      </header>

      <div className="savings-summary glass-card">
        <h2>{t("savingsAnalysis")}</h2>
        <p className="summary-desc">{t("savingsDesc")}</p>

        <div className="comparison-grid">
          <div className="comparison-card before">
            <h3>{t("beforeUsing")}</h3>
            <div className="comparison-value">
              <span className="value">{avgBeforeKwh.toFixed(2)}</span>
              <span className="unit">{t("kwhPerMonth")}</span>
            </div>
            <p className="comparison-count">
              {beforeBills.length} {t("bills")}
            </p>
          </div>

          <div className="comparison-arrow">
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </div>

          <div className="comparison-card after">
            <h3>{t("afterUsing")}</h3>
            <div className="comparison-value">
              <span className="value">{avgAfterKwh.toFixed(2)}</span>
              <span className="unit">{t("kwhPerMonth")}</span>
            </div>
            <p className="comparison-count">
              {afterBills.length} {t("bills")}
            </p>
          </div>
        </div>

        {beforeBills.length > 0 && afterBills.length > 0 && (
          <div className="savings-result">
            <div className="savings-grid">
              <div className="savings-item">
                <span className="savings-label">{t("saved")}</span>
                <span className="savings-value kwh">
                  {savings.kwhSaved.toFixed(2)} kWh
                </span>
              </div>
              <div className="savings-item">
                <span className="savings-label">{t("percentage")}</span>
                <span className="savings-value percent">
                  {savings.percentSaved}%
                </span>
              </div>
              <div className="savings-item">
                <span className="savings-label">{t("moneySaved")}</span>
                <span className="savings-value money">
                  {formatMoney(savings.moneySaved)} VND
                </span>
              </div>
              <div className="savings-item">
                <span className="savings-label">{t("carbonCredit")}</span>
                <span className="savings-value carbon">
                  {savings.carbonCredits.toFixed(4)} {t("tonCO2")}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bills-container">
        <div className="bills-section">
          <h3>{t("billsBeforeSolution")}</h3>
          <div className="bills-list">
            {beforeBills.length === 0 ? (
              <div className="no-bills">{t("noBillsYet")}</div>
            ) : (
              beforeBills.map((bill, index) => (
                <motion.div
                  key={bill.id}
                  className="bill-item glass-card"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="bill-month">{bill.month}</div>
                  <div className="bill-details">
                    <div className="bill-kwh">
                      <span className="label">{t("energy")}</span>
                      <span className="value">{bill.kwh} kWh</span>
                    </div>
                    <div className="bill-amount">
                      <span className="label">{t("amount")}</span>
                      <span className="value">
                        {formatMoney(bill.amount)} VND
                      </span>
                    </div>
                  </div>
                  <button
                    className="delete-bill-btn"
                    onClick={() => handleDeleteBill(bill.id)}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </motion.div>
              ))
            )}
          </div>
        </div>

        <div className="bills-section">
          <h3>{t("billsAfterSolution")}</h3>
          <div className="bills-list">
            {afterBills.length === 0 ? (
              <div className="no-bills">{t("noBillsYet")}</div>
            ) : (
              afterBills.map((bill, index) => (
                <motion.div
                  key={bill.id}
                  className="bill-item glass-card after"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="bill-month">{bill.month}</div>
                  <div className="bill-details">
                    <div className="bill-kwh">
                      <span className="label">{t("energy")}</span>
                      <span className="value">{bill.kwh} kWh</span>
                    </div>
                    <div className="bill-amount">
                      <span className="label">{t("amount")}</span>
                      <span className="value">
                        {formatMoney(bill.amount)} VND
                      </span>
                    </div>
                  </div>
                  <button
                    className="delete-bill-btn"
                    onClick={() => handleDeleteBill(bill.id)}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showAddModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              className="modal-content"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2>{t("addElectricityBill")}</h2>
                <button
                  className="close-btn"
                  onClick={() => setShowAddModal(false)}
                >
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

              <form onSubmit={handleAddBill}>
                <div className="modal-body">
                  <div className="input-group">
                    <label>{t("monthYYYYMM")}</label>
                    <input
                      type="month"
                      value={formData.month}
                      onChange={(e) =>
                        setFormData({ ...formData, month: e.target.value })
                      }
                      className="input-field"
                      required
                    />
                  </div>

                  <div className="form-row">
                    <div className="input-group">
                      <label>{t("kwhAmount")}</label>
                      <input
                        type="number"
                        value={formData.kwh}
                        onChange={(e) =>
                          setFormData({ ...formData, kwh: e.target.value })
                        }
                        className="input-field"
                        placeholder={t("kwhPlaceholder")}
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                    <div className="input-group">
                      <label>{t("billAmount")}</label>
                      <input
                        type="number"
                        value={formData.amount}
                        onChange={(e) =>
                          setFormData({ ...formData, amount: e.target.value })
                        }
                        className="input-field"
                        placeholder={t("amountPlaceholder")}
                        min="0"
                        required
                      />
                    </div>
                  </div>

                  <div className="input-group">
                    <label>{t("billType")}</label>
                    <div className="bill-type-selector">
                      <button
                        type="button"
                        className={`type-btn ${
                          formData.isBefore ? "active" : ""
                        }`}
                        onClick={() =>
                          setFormData({ ...formData, isBefore: true })
                        }
                      >
                        {t("beforeUsingBtn")}
                      </button>
                      <button
                        type="button"
                        className={`type-btn after ${
                          !formData.isBefore ? "active" : ""
                        }`}
                        onClick={() =>
                          setFormData({ ...formData, isBefore: false })
                        }
                      >
                        {t("afterUsingBtn")}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowAddModal(false)}
                  >
                    {t("cancel")}
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {t("addBill")}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BillManagement;
