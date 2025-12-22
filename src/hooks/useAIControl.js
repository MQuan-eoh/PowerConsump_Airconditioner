import { useState, useEffect, useRef } from "react";
import { calculateOptimalSettings } from "../utils/aiLogic";
import {
  logAIAction,
  logReward,
  getLearnedUserPreference,
} from "../services/aiLogService";
import { updateACUnit } from "../services/firebaseService";

/**
 * Hook to manage AI Control Logic
 * @param {Object} ac - AC Unit object from Firebase
 * @param {Object} eraValues - Real-time sensor values from E-RA
 * @param {Function} setEraTemperature - Function to set temp on device
 * @param {Function} setEraFanSpeed - Function to set fan on device
 * @param {Function} setEraMode - Function to set mode on device
 */
export const useAIControl = (
  ac,
  eraValues,
  setEraTemperature,
  setEraFanSpeed,
  setEraMode
) => {
  const [isAIActive, setIsAIActive] = useState(false);
  const lastActionTimeRef = useRef(null);
  const lastProposedSettingsRef = useRef(null);
  const monitoringIntervalRef = useRef(null);
  const prevModeRef = useRef(null);

  // Check if AI mode is enabled
  useEffect(() => {
    setIsAIActive(ac?.operationMode === "ai");
  }, [ac?.operationMode]);

  // Handle Page Load vs Mode Switch Logic
  useEffect(() => {
    const currentMode = ac?.operationMode;

    if (currentMode === "ai") {
      // If switching to AI, or loading with AI
      if (prevModeRef.current !== "ai") {
        // Transitioned to AI.
        if (prevModeRef.current === undefined || prevModeRef.current === null) {
          // Was null/undefined -> AI. This is Page Load.
          // Suppress immediate action by setting lastActionTime to now
          console.log("[AI Mode] Suppressing immediate action on page load");
          lastActionTimeRef.current = Date.now();
        } else {
          // Was Manual -> AI. This is User Activation.
          // Allow immediate action (reset timer if needed, or leave as is)
          // If we want to force immediate action, we could set lastActionTimeRef.current = null;
          // But usually it is null by default or old.
        }
      }
    }
    prevModeRef.current = currentMode;
  }, [ac?.operationMode]);

  // Main AI Loop
  useEffect(() => {
    if (!isAIActive || !ac || !eraValues) {
      if (monitoringIntervalRef.current) {
        clearInterval(monitoringIntervalRef.current);
        monitoringIntervalRef.current = null;
      }
      return;
    }

    const runAILogic = async () => {
      // 1. Gather Inputs
      const currentTemp = eraValues.currentTemperature || 28; // Default if sensor missing
      const currentHumidity = 60; // Mock humidity if sensor missing (E-RA might not have humidity yet)
      // Note: If E-RA has humidity, use eraValues.humidity. Assuming 60 for now as per current context.

      const roomArea = ac.roomArea || 20;
      const acType = ac.acType || "inverter";

      // 1.5 Get Learned User Preference
      const userOffset = getLearnedUserPreference();

      // 2. Calculate Optimal Settings
      const optimal = calculateOptimalSettings({
        currentTemp,
        currentHumidity,
        roomArea,
        acType,
        userOffset,
        // weather: { temp: 32 } // TODO: Integrate real weather API
      });

      // 3. Check if we need to apply changes
      // Only apply if settings are different from current AC state
      const needsUpdate =
        optimal.temp !== ac.temperature ||
        optimal.fan !== ac.fanMode ||
        optimal.mode !==
          (ac.operationMode === "ai" ? "cool" : ac.operationMode); // Logic check: AI mode usually maps to Cool/Auto on device

      // Debounce: Don't change too often (e.g., wait at least 5 mins between AI actions)
      const now = Date.now();
      const timeSinceLastAction = lastActionTimeRef.current
        ? now - lastActionTimeRef.current
        : Infinity;

      if (needsUpdate && timeSinceLastAction > 5 * 60 * 1000) {
        console.log("[AI Mode] Applying new settings:", optimal);

        // Apply to Device
        if (setEraTemperature) setEraTemperature(optimal.temp);
        // Fan speed mapping
        const fanMap = { auto: 0, low: 1, medium: 2, high: 3 };
        if (setEraFanSpeed) setEraFanSpeed(fanMap[optimal.fan]);

        // Apply to Firebase (Sync UI)
        await updateACUnit(ac.id, {
          temperature: optimal.temp,
          fanMode: optimal.fan,
          // Don't change operationMode in Firebase, keep it as 'ai'
        });

        // Log Action
        logAIAction(optimal);

        lastActionTimeRef.current = now;
        lastProposedSettingsRef.current = optimal;
      }
    };

    // Run immediately on mount/mode switch
    runAILogic();

    // Run periodically (every 5 minutes)
    monitoringIntervalRef.current = setInterval(runAILogic, 5 * 60 * 1000);

    return () => {
      if (monitoringIntervalRef.current)
        clearInterval(monitoringIntervalRef.current);
    };
  }, [isAIActive, ac, eraValues, setEraTemperature, setEraFanSpeed]);

  // Reward/Penalty Logic
  // Monitor user manual overrides
  useEffect(() => {
    if (!lastActionTimeRef.current || !lastProposedSettingsRef.current) return;

    // If user changes settings manually shortly after AI action
    // We detect this by checking if AC state changes NOT by AI (we can't easily distinguish source here without more complex state)
    // Simplified approach: If AC state changes and it's NOT matching our last proposed settings, and it's within 15 mins.

    // This part is tricky because 'ac' updates when we update it too.
    // We need to rely on the fact that if 'ac' changes and it DOESN'T match 'lastProposedSettingsRef', it might be user.

    // Let's implement a simpler "Check Reward" interval
    const checkRewardInterval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastAction = now - lastActionTimeRef.current;

      // If 60 mins passed and settings are still what AI proposed -> Reward
      if (
        timeSinceLastAction > 60 * 60 * 1000 &&
        timeSinceLastAction < 61 * 60 * 1000
      ) {
        // Check if current settings still match
        if (ac.temperature === lastProposedSettingsRef.current.temp) {
          logReward(1, "User kept AI settings for 60 mins");
        }
      }
    }, 60 * 1000);

    return () => clearInterval(checkRewardInterval);
  }, [ac]);

  return {
    isAIActive,
  };
};
