/**
 * E-RA Context
 * React Context để quản lý E-RA Widget state và cung cấp cho các components
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import {
  initEraWidget,
  getCurrentValues,
  isEraReady,
  sendTemperatureToDevice,
  toggleACPower,
  changeModeToDevice,
  sendFanSpeedToDevice,
  requestHistories,
  cleanupEraWidget,
  getValueById,
} from "../services/eraService";

// Tạo context
const EraContext = createContext(null);

// Provider component
export const EraProvider = ({ children }) => {
  // State cho E-RA values
  const [eraValues, setEraValues] = useState({
    targetTemperature: null,
    currentTemperature: null,
    mode: null,
    fanSpeed: null,
    isOn: false,
    current: null,
    voltage: null,
    powerConsumption: 0,
  });

  // State cho trạng thái kết nối
  const [isConnected, setIsConnected] = useState(false);
  const [isConfigLoaded, setIsConfigLoaded] = useState(false);
  const [histories, setHistories] = useState([]);

  // Ref để track initialization
  const isInitializedRef = useRef(false);

  // Khởi tạo E-RA Widget khi component mount
  useEffect(() => {
    if (isInitializedRef.current) return;

    // Delay một chút để đảm bảo CDN script đã load
    const initTimeout = setTimeout(() => {
      const success = initEraWidget({
        onValuesUpdate: (values) => {
          setEraValues(values);
        },
        onConfiguration: (config) => {
          setIsConfigLoaded(true);
          console.log("E-RA Configuration loaded in context");
        },
        onHistories: (data) => {
          setHistories(data);
        },
      });

      if (success) {
        setIsConnected(true);
        isInitializedRef.current = true;
      }
    }, 500);

    return () => {
      clearTimeout(initTimeout);
      if (isInitializedRef.current) {
        cleanupEraWidget();
        isInitializedRef.current = false;
      }
    };
  }, []);

  // Cập nhật trạng thái ready
  useEffect(() => {
    const checkReady = setInterval(() => {
      if (isEraReady() && !isConfigLoaded) {
        setIsConfigLoaded(true);
        setEraValues(getCurrentValues());
      }
    }, 1000);

    return () => clearInterval(checkReady);
  }, [isConfigLoaded]);

  // Gửi nhiệt độ đến thiết bị
  const setTemperature = useCallback((temp) => {
    const success = sendTemperatureToDevice(temp);
    if (success) {
      // Optimistic update
      setEraValues((prev) => ({
        ...prev,
        targetTemperature: temp,
      }));
    }
    return success;
  }, []);

  // Bật/tắt điều hòa
  const setPower = useCallback((turnOn) => {
    const success = toggleACPower(turnOn);
    if (success) {
      // Optimistic update
      setEraValues((prev) => ({
        ...prev,
        isOn: turnOn,
      }));
    }
    return success;
  }, []);

  // Thay đổi chế độ
  const setMode = useCallback((mode) => {
    const success = changeModeToDevice(mode);
    if (success) {
      // Optimistic update
      setEraValues((prev) => ({
        ...prev,
        mode: mode,
      }));
    }
    return success;
  }, []);

  // Thay đổi tốc độ quạt
  const setFanSpeed = useCallback((level) => {
    const success = sendFanSpeedToDevice(level);
    if (success) {
      // Optimistic update
      setEraValues((prev) => ({
        ...prev,
        fanSpeed: level,
      }));
    }
    return success;
  }, []);

  // Yêu cầu dữ liệu lịch sử
  const getHistories = useCallback((timeframe) => {
    return requestHistories(timeframe);
  }, []);

  // Value object cho context
  const contextValue = {
    // State
    eraValues,
    isConnected,
    isConfigLoaded,
    histories,

    // Actions
    setTemperature,
    setPower,
    setMode,
    setFanSpeed,
    getHistories,
    getValueById,

    // Utilities
    isReady: isConnected && isConfigLoaded,
  };

  return (
    <EraContext.Provider value={contextValue}>{children}</EraContext.Provider>
  );
};

// Custom hook để sử dụng E-RA context
export const useEra = () => {
  const context = useContext(EraContext);
  if (!context) {
    throw new Error("useEra must be used within an EraProvider");
  }
  return context;
};

export default EraContext;
