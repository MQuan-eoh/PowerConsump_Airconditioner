import { motion, AnimatePresence } from "framer-motion";
import { FaRobot, FaCheck, FaMagic } from "react-icons/fa";
import "./AIActivationOverlay.css";

const AIActivationOverlay = ({ isVisible }) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="ai-overlay-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="ai-activation-card"
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: -20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <div className="ai-particles">
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="particle"
                  animate={{
                    y: [0, -40, -80],
                    x: [0, i % 2 === 0 ? 20 : -20, 0],
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.3,
                    ease: "easeOut",
                  }}
                />
              ))}
            </div>

            <div className="ai-icon-container">
              <div className="pulse-ring"></div>
              <div className="pulse-ring delay"></div>
              <motion.div
                className="icon-circle"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
              >
                <FaRobot className="main-icon" />
                <motion.div
                  className="check-badge"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: "spring" }}
                >
                  <FaCheck />
                </motion.div>
              </motion.div>
            </div>

            <motion.div
              className="text-content"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h2 className="ai-title">
                AI Mode <span className="highlight">Activated</span>
              </h2>
              <p className="ai-subtitle">
                <FaMagic className="magic-icon" />
                Optimizing environment...
              </p>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AIActivationOverlay;
