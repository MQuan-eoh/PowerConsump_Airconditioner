/**
 * E-RA Widget Service
 * Tích hợp E-RA Platform để giám sát và điều khiển thiết bị IoT điều hòa
 * Dựa trên ERA_WIDGET_INTEGRATION_GUIDE.md
 */

// ==========================================
// BIẾN TOÀN CỤC
// ==========================================

// Instance của EraWidget (khởi tạo từ CDN)
let eraWidget = null;

// Biến config (để lưu cấu hình nhận dữ liệu real-time)
let configTargetTempAir1 = null;
let configCurrentTempAir1 = null;
let configModeAir1 = null;
let configFanSpeed = null;
let configPowerAir1 = null;
let configCurrentAir1 = null;
let configVoltageAir1 = null;
let configPowerConsumption = null;

// Biến actions (để lưu các lệnh điều khiển)
let onAirConditioner1 = null;
let offAirConditioner1 = null;
let modeAuto = null;
let modeCool = null;
let modeDry = null;
let modeFan = null;
let tempControlAir1 = null;
let fanSpeedControl = null;

// Biến values (để lưu giá trị nhận được)
let targetTempAir1 = null;
let currentTempAir1 = null;
let currentModeAir1 = null;
let fanSpeed = null;
let powerAir1 = null;
let currentAir1Value = null;
let voltageAir1Value = null;
let currentPowerConsumptionValue = null;
let latestValues = {};

// Callbacks để thông báo khi có dữ liệu mới
let onValuesUpdateCallback = null;
let onConfigurationCallback = null;
let onHistoriesCallback = null;

// Trạng thái kết nối
let isInitialized = false;
let isConfigurationLoaded = false;

// ==========================================
// KHỞI TẠO E-RA WIDGET
// ==========================================

/**
 * Khởi tạo E-RA Widget
 * @param {Object} options - Các tùy chọn khởi tạo
 * @param {Function} options.onValuesUpdate - Callback khi nhận values mới
 * @param {Function} options.onConfiguration - Callback khi nhận configuration
 * @param {Function} options.onHistories - Callback khi nhận histories
 */
export const initEraWidget = (options = {}) => {
  // Kiểm tra EraWidget có sẵn từ CDN không
  if (
    typeof window.EraWidget === "undefined" &&
    typeof window.eraWidget === "undefined"
  ) {
    console.error(
      "E-RA Widget not loaded. Please include the E-RA Widget script in index.html"
    );
    return false;
  }

  // Lưu callbacks
  onValuesUpdateCallback = options.onValuesUpdate || null;
  onConfigurationCallback = options.onConfiguration || null;
  onHistoriesCallback = options.onHistories || null;

  // Tạo instance của EraWidget
  if (typeof window.EraWidget !== "undefined") {
    eraWidget = new window.EraWidget();
  } else {
    eraWidget = window.eraWidget;
  }

  // Khởi tạo với configuration
  eraWidget.init({
    needRealtimeConfigs: true,
    needActions: true,

    // Callback nhận configuration từ server
    onConfiguration: (configuration) => {
      handleConfiguration(configuration);
    },

    // Callback nhận values real-time
    onValues: (values) => {
      handleValues(values);
    },

    // Callback nhận histories
    onHistories: (histories) => {
      handleHistories(histories);
    },
  });

  isInitialized = true;
  console.log("E-RA Widget initialized successfully");

  // Expose global cho debug
  window.eraService = {
    getValues: getCurrentValues,
    sendTemperature: sendTemperatureToDevice,
    togglePower: toggleACPower,
    changeMode: changeModeToDevice,
    setFanSpeed: sendFanSpeedToDevice,
  };

  return true;
};

// ==========================================
// XỬ LÝ CONFIGURATION
// ==========================================

/**
 * Xử lý configuration nhận từ E-RA
 */
const handleConfiguration = (configuration) => {
  console.log("E-RA Configuration received:", configuration);

  // Kiểm tra dữ liệu hợp lệ
  if (!configuration || !configuration.realtime_configs) {
    console.error("Invalid configuration received");
    return;
  }

  // Gán realtime configs theo index (theo ERA_WIDGET_INTEGRATION_GUIDE.md)
  // Index 0: Target Temperature
  configTargetTempAir1 = configuration.realtime_configs[0] || null;

  // Index 1: Current Temperature
  configCurrentTempAir1 = configuration.realtime_configs[1] || null;

  // Index 2: Mode
  configModeAir1 = configuration.realtime_configs[2] || null;

  // Index 3: Fan Speed
  configFanSpeed = configuration.realtime_configs[3] || null;

  // Index 4: Power Status
  configPowerAir1 = configuration.realtime_configs[4] || null;

  // Index 5: Current (Ampere)
  configCurrentAir1 = configuration.realtime_configs[5] || null;

  // Index 6: Voltage
  configVoltageAir1 = configuration.realtime_configs[6] || null;

  // Index 7: Power Consumption (kWh)
  configPowerConsumption = configuration.realtime_configs[7] || null;

  // Gán actions từ mảng actions theo index
  if (configuration.actions) {
    // Index 0: Turn On
    onAirConditioner1 = configuration.actions[0] || null;

    // Index 1: Turn Off
    offAirConditioner1 = configuration.actions[1] || null;

    // Index 2: Temperature Control
    tempControlAir1 = configuration.actions[2] || null;

    // Index 3-6: Mode Controls
    modeAuto = configuration.actions[3] || null;
    modeCool = configuration.actions[4] || null;
    modeDry = configuration.actions[5] || null;
    modeFan = configuration.actions[6] || null;

    // Index 7: Fan Speed Control
    fanSpeedControl = configuration.actions[7] || null;
  }

  isConfigurationLoaded = true;

  // Gọi callback nếu có
  if (onConfigurationCallback) {
    onConfigurationCallback({
      configs: {
        targetTemp: configTargetTempAir1,
        currentTemp: configCurrentTempAir1,
        mode: configModeAir1,
        fanSpeed: configFanSpeed,
        power: configPowerAir1,
        current: configCurrentAir1,
        voltage: configVoltageAir1,
        powerConsumption: configPowerConsumption,
      },
      actions: {
        turnOn: onAirConditioner1,
        turnOff: offAirConditioner1,
        setTemp: tempControlAir1,
        modeAuto,
        modeCool,
        modeDry,
        modeFan,
        setFanSpeed: fanSpeedControl,
      },
    });
  }

  console.log("E-RA Configuration loaded successfully", {
    configsCount: configuration.realtime_configs?.length || 0,
    actionsCount: configuration.actions?.length || 0,
  });
};

// ==========================================
// XỬ LÝ VALUES REAL-TIME
// ==========================================

/**
 * Xử lý values nhận từ E-RA
 */
const handleValues = (values) => {
  // If service is not initialized (e.g. after cleanup), ignore values silently
  if (!isInitialized) {
    return;
  }

  if (!isConfigurationLoaded) {
    console.warn("Configuration not loaded yet, skipping values processing");
    return;
  }

  latestValues = values;

  // GET VALUES từ E-RA với safe access
  if (configTargetTempAir1?.id && values[configTargetTempAir1.id]) {
    targetTempAir1 = values[configTargetTempAir1.id]?.value ?? null;
  }

  if (configCurrentTempAir1?.id && values[configCurrentTempAir1.id]) {
    currentTempAir1 = values[configCurrentTempAir1.id]?.value ?? null;
  }

  if (configModeAir1?.id && values[configModeAir1.id]) {
    currentModeAir1 = values[configModeAir1.id]?.value ?? null;
  }

  if (configFanSpeed?.id && values[configFanSpeed.id]) {
    fanSpeed = values[configFanSpeed.id]?.value ?? null;
  }

  if (configPowerAir1?.id && values[configPowerAir1.id]) {
    powerAir1 = values[configPowerAir1.id]?.value ?? null;
  }

  if (configCurrentAir1?.id && values[configCurrentAir1.id]) {
    currentAir1Value = values[configCurrentAir1.id]?.value ?? null;
  }

  if (configVoltageAir1?.id && values[configVoltageAir1.id]) {
    voltageAir1Value = values[configVoltageAir1.id]?.value ?? null;
  }

  if (configPowerConsumption?.id && values[configPowerConsumption.id]) {
    currentPowerConsumptionValue =
      values[configPowerConsumption.id]?.value ?? 0;
  }

  // Gọi callback với dữ liệu đã format
  if (onValuesUpdateCallback) {
    onValuesUpdateCallback(getCurrentValues());
  }

  // console.log("E-RA Values received:", getCurrentValues());
};

/**
 * Xử lý histories nhận từ E-RA
 */
const handleHistories = (histories) => {
  console.log("E-RA Histories received:", histories);

  if (onHistoriesCallback) {
    onHistoriesCallback(histories);
  }
};

// ==========================================
// LẤY GIÁ TRỊ HIỆN TẠI
// ==========================================

/**
 * Lấy tất cả giá trị hiện tại từ E-RA
 * @returns {Object} Các giá trị hiện tại của điều hòa
 */
export const getCurrentValues = () => {
  return {
    targetTemperature: targetTempAir1,
    currentTemperature: currentTempAir1,
    mode: currentModeAir1,
    fanSpeed: fanSpeed,
    isOn: powerAir1 === 1 || powerAir1 === true,
    current: currentAir1Value,
    voltage: voltageAir1Value,
    powerConsumption: currentPowerConsumptionValue,
  };
};

/**
 * Kiểm tra E-RA đã sẵn sàng chưa
 */
export const isEraReady = () => {
  return isInitialized && isConfigurationLoaded;
};

// ==========================================
// CÁC HÀM TRIGGER ACTIONS (GỬI LỆNH ĐIỀU KHIỂN)
// ==========================================

/**
 * Gửi nhiệt độ đến thiết bị
 * @param {number} temperature - Nhiệt độ cài đặt (16-30)
 */
export const sendTemperatureToDevice = (temperature) => {
  if (!eraWidget || !tempControlAir1?.action) {
    console.error("E-RA Widget or temperature action not available");
    return false;
  }

  const temp = Math.max(16, Math.min(30, temperature));

  try {
    eraWidget.triggerAction(tempControlAir1.action, null, {
      value: temp,
    });
    console.log(`Sent temperature ${temp}C to device`);
    return true;
  } catch (error) {
    console.error("Failed to send temperature:", error);
    return false;
  }
};

/**
 * Bật/Tắt điều hòa
 * @param {boolean} turnOn - true để bật, false để tắt
 */
export const toggleACPower = (turnOn) => {
  if (!eraWidget) {
    console.error("E-RA Widget not available");
    return false;
  }

  const action = turnOn ? onAirConditioner1 : offAirConditioner1;

  if (!action?.action) {
    console.error(`Power ${turnOn ? "ON" : "OFF"} action not available`);
    return false;
  }

  try {
    eraWidget.triggerAction(action.action, null);
    console.log(`AC Power ${turnOn ? "ON" : "OFF"} command sent`);
    return true;
  } catch (error) {
    console.error("Failed to toggle power:", error);
    return false;
  }
};

/**
 * Thay đổi chế độ hoạt động
 * @param {string} mode - Chế độ: 'auto' | 'cool' | 'dry' | 'fan'
 */
export const changeModeToDevice = (mode) => {
  if (!eraWidget) {
    console.error("E-RA Widget not available");
    return false;
  }

  const modeActionMap = {
    auto: modeAuto,
    cool: modeCool,
    dry: modeDry,
    fan: modeFan,
  };

  const modeAction = modeActionMap[mode];

  if (!modeAction?.action) {
    console.error(`Mode action for '${mode}' not available`);
    return false;
  }

  try {
    eraWidget.triggerAction(modeAction.action, null);
    console.log(`Mode changed to: ${mode}`);
    return true;
  } catch (error) {
    console.error("Failed to change mode:", error);
    return false;
  }
};

/**
 * Điều khiển tốc độ quạt
 * @param {number} level - Mức tốc độ quạt (0-5 hoặc theo cấu hình thiết bị)
 */
export const sendFanSpeedToDevice = (level) => {
  if (!eraWidget || !fanSpeedControl?.action) {
    console.error("E-RA Widget or fan speed action not available");
    return false;
  }

  try {
    eraWidget.triggerAction(fanSpeedControl.action, null, {
      value: level,
    });
    console.log(`Fan speed set to level: ${level}`);
    return true;
  } catch (error) {
    console.error("Failed to set fan speed:", error);
    return false;
  }
};

// ==========================================
// YÊU CẦU DỮ LIỆU LỊCH SỬ
// ==========================================

/**
 * Yêu cầu dữ liệu lịch sử từ E-RA
 * @param {string} timeframe - Khoảng thời gian: 'hour' | 'day' | 'week' | 'month'
 */
export const requestHistories = (timeframe = "day") => {
  if (!eraWidget) {
    console.error("E-RA Widget not available");
    return false;
  }

  const now = new Date();
  let startTime;

  switch (timeframe) {
    case "hour":
      startTime = new Date(now.getTime() - 60 * 60 * 1000);
      break;
    case "day":
      startTime = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        0,
        0,
        0,
        0
      );
      break;
    case "week":
      startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "month":
      startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      startTime = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        0,
        0,
        0,
        0
      );
  }

  try {
    eraWidget.requestHistories(startTime.getTime(), now.getTime());
    console.log(`Requested histories for timeframe: ${timeframe}`);
    return true;
  } catch (error) {
    console.error("Failed to request histories:", error);
    return false;
  }
};

// ==========================================
// ĐĂNG KÝ CALLBACKS
// ==========================================

/**
 * Đăng ký callback khi nhận values mới
 * @param {Function} callback - Callback function
 */
export const onValuesUpdate = (callback) => {
  onValuesUpdateCallback = callback;
};

/**
 * Đăng ký callback khi nhận configuration
 * @param {Function} callback - Callback function
 */
export const onConfigurationLoaded = (callback) => {
  onConfigurationCallback = callback;
};

/**
 * Đăng ký callback khi nhận histories
 * @param {Function} callback - Callback function
 */
export const onHistoriesReceived = (callback) => {
  onHistoriesCallback = callback;
};

// ==========================================
// CLEANUP
// ==========================================

/**
 * Dọn dẹp khi unmount
 */
export const cleanupEraWidget = () => {
  eraWidget = null;
  isInitialized = false;
  isConfigurationLoaded = false;
  onValuesUpdateCallback = null;
  onConfigurationCallback = null;
  onHistoriesCallback = null;
  console.log("E-RA Widget cleaned up");
};

/**
 * Get history values from E-RA API
 * @param {number} configId - The configuration ID
 * @param {string} dateFrom - Start date (YYYY-MM-DDTHH:mm:ss)
 * @param {string} dateTo - End date (YYYY-MM-DDTHH:mm:ss)
 * @returns {Promise<Array>} - Array of history values
 */
export const getHistoryValueV3 = async (configId, dateFrom, dateTo) => {
  try {
    // Use relative URL to leverage Vite proxy (avoids CORS issues)
    const url = `/api/chip_manager/configs/value_history_v3/?configs=${configId}&date_from=${encodeURIComponent(
      dateFrom
    )}&date_to=${encodeURIComponent(dateTo)}`;

    console.log("EraService: Fetching history from:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: "Token a159b7047b33aebfdb2e83f614c5049e5d760d6d",
      },
    });

    // Check content type to ensure it is JSON
    const contentType = response.headers.get("content-type");
    const isJsonResponse =
      contentType && contentType.includes("application/json");

    if (!isJsonResponse) {
      const text = await response.text();
      console.error(`EraService: Non-JSON response:`, {
        status: response.status,
        statusText: response.statusText,
        body: text.substring(0, 200),
      });
      throw new Error(
        `Server returned non-JSON response: ${response.status} ${response.statusText}`
      );
    }

    if (!response.ok) {
      let errorMessage = `API call failed: ${response.status} ${response.statusText}`;
      if (response.status === 401)
        errorMessage = "Unauthorized: Invalid or expired token";
      else if (response.status === 403)
        errorMessage = "Forbidden: Access denied";
      else if (response.status === 404)
        errorMessage = "Not Found: Resource not found";

      console.error(errorMessage);
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log("EraService: History Data Received:", data);

    // Extract history from the response structure

    // Case 0: Wrapped in object with configs property { configs: [{ id: ..., history: [...] }] }
    if (
      data.configs &&
      Array.isArray(data.configs) &&
      data.configs.length > 0
    ) {
      if (data.configs[0].history) return data.configs[0].history;
      if (data.configs[0].tail) return data.configs[0].tail;
    }

    // Case 1: Wrapped structure [{ id: ..., history: [...] }]
    if (Array.isArray(data) && data.length > 0 && data[0].history) {
      return data[0].history;
    }

    // Case 2: Direct array of history items [{x:..., y:...}]
    if (Array.isArray(data)) {
      return data;
    }

    return [];
  } catch (error) {
    console.error("EraService: Error fetching history:", error);
    return [];
  }
};

/**
 * Get the Power Consumption Config ID
 * @returns {number|null} - The ID or null if not loaded
 */
export const getPowerConsumptionConfigId = () => {
  if (configPowerConsumption && configPowerConsumption.id) {
    return configPowerConsumption.id;
  }
  return null;
};

/**
 * Get value by Config ID
 * @param {number} id - The Config ID
 * @returns {any} - The value
 */
// ==========================================
// API MAPPING HELPERS
// ==========================================
const ERA_API_BASE_URL = "/api";
const ERA_API_TOKEN = "Token a159b7047b33aebfdb2e83f614c5049e5d760d6d";
const HARDCODED_UNIT_ID = 10922;

/**
 * Fetch list of Chips for a Unit
 * @param {number} unitId
 * @returns {Promise<Array>} List of chips
 */
export const fetchUnitChips = async (unitId = HARDCODED_UNIT_ID) => {
  try {
    const response = await fetch(
      `${ERA_API_BASE_URL}/property_manager/iot_dashboard/filters/owner/chips/?unit=${unitId}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: ERA_API_TOKEN,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Error fetching chips: ${response.statusText}`);
    }

    const data = await response.json();
    // Normalize response: Handle pagination (results array) or direct array
    const chips = Array.isArray(data) ? data : data.results || [];
    console.log(`Fetched ${chips.length} chips for unit ${unitId}`);
    return chips;
  } catch (error) {
    console.error("Failed to fetch unit chips:", error);
    throw error;
  }
};

/**
 * fetch chip configs by chip ID
 * @param {number} chipId - The ID of the Gateway/Chip
 * @returns {Promise<Array>} List of configs
 */
export const fetchChipConfigs = async (chipId) => {
  if (!chipId) {
    console.warn("fetchChipConfigs: No chipId provided");
    return [];
  }

  try {
    const url = `${ERA_API_BASE_URL}/chip_manager/configs/?sensor__chip=${chipId}`;
    console.log("Fetching configs for chip:", chipId, "URL:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: ERA_API_TOKEN,
      },
    });

    if (!response.ok) {
      throw new Error(`Error fetching chip configs: ${response.statusText}`);
    }

    const data = await response.json();
    // Normalize response
    const configs = Array.isArray(data) ? data : data.results || [];
    console.log(`Fetched ${configs.length} configs for chip ${chipId}`);
    return configs;
  } catch (error) {
    console.error("Failed to fetch chip configs:", error);
    throw error;
  }
};

export const getValueById = (id) => {
  if (latestValues && latestValues[id]) {
    return latestValues[id].value;
  }
  return null;
};

export default {
  initEraWidget,
  getCurrentValues,
  isEraReady,
  sendTemperatureToDevice,
  toggleACPower,
  changeModeToDevice,
  sendFanSpeedToDevice,
  requestHistories,
  onValuesUpdate,
  onConfigurationLoaded,
  onHistoriesReceived,
  cleanupEraWidget,
  getHistoryValueV3,
  getPowerConsumptionConfigId,
  getValueById,
  fetchUnitChips,
  fetchChipConfigs,
};
