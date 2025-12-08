# E-RA Widget Integration Guide

# Hướng dẫn tích hợp E-RA Widget để giám sát và điều khiển thiết bị IoT

---

## 📋 Mục Lục

1. [Giới thiệu E-RA Widget](#1-giới-thiệu-e-ra-widget)
2. [Cài đặt và Khởi tạo](#2-cài-đặt-và-khởi-tạo)
3. [Cấu trúc Configuration](#3-cấu-trúc-configuration)
4. [Khai báo biến theo mảng](#4-khai-báo-biến-theo-mảng)
5. [Câu lệnh GET Value (Nhận dữ liệu)](#5-câu-lệnh-get-value-nhận-dữ-liệu)
6. [Câu lệnh Trigger Actions (Gửi lệnh điều khiển)](#6-câu-lệnh-trigger-actions-gửi-lệnh-điều-khiển)
7. [Ví dụ thực tế trong dự án](#7-ví-dụ-thực-tế-trong-dự-án)
8. [Best Practices](#8-best-practices)

---

## 1. Giới thiệu E-RA Widget

E-RA Widget là một thư viện JavaScript được phát triển bởi EOH JSC dùng để:

- **Giám sát (Monitor)**: Nhận dữ liệu real-time từ các thiết bị IoT
- **Điều khiển (Control)**: Gửi lệnh điều khiển đến thiết bị
- **Lịch sử (Histories)**: Truy vấn dữ liệu lịch sử của thiết bị

### Cài đặt CDN

```html
<script src="https://www.unpkg.com/@eohjsc/era-widget@1.1.3/src/index.js"></script>
```

---

## 2. Cài đặt và Khởi tạo

### 2.1 Khởi tạo E-RA Widget Instance

```javascript
// Tạo instance của EraWidget
const eraWidget = new EraWidget();
```

### 2.2 Cấu hình và Khởi chạy

```javascript
eraWidget.init({
  // Khai báo cần nhận real-time configs
  needRealtimeConfigs: true,

  // Khai báo cần nhận actions (điều khiển)
  needActions: true,

  // Callback khi nhận được configuration từ server
  onConfiguration: (configuration) => {
    // Xử lý configuration ở đây
    console.log("Received configuration:", configuration);
  },

  // Callback khi nhận được values (giá trị real-time)
  onValues: (values) => {
    // Xử lý values ở đây
    console.log("Received values:", values);
  },

  // Callback khi nhận được histories (dữ liệu lịch sử)
  onHistories: (histories) => {
    // Xử lý histories ở đây
    console.log("Received histories:", histories);
  },
});
```

---

## 3. Cấu trúc Configuration

Khi `onConfiguration` callback được gọi, object `configuration` sẽ chứa:

### 3.1 Cấu trúc realtime_configs

```javascript
configuration = {
    realtime_configs: [
        { id: "config_id_0", name: "Target Temperature", ... },
        { id: "config_id_1", name: "Current Temperature", ... },
        { id: "config_id_2", name: "Mode", ... },
        // ... các config khác
    ],
    actions: [
        { action: "action_id_0", name: "Turn On", ... },
        { action: "action_id_1", name: "Turn Off", ... },
        // ... các action khác
    ]
}
```

### 3.2 Thuộc tính của mỗi Config

| Thuộc tính | Mô tả                  | Ví dụ                   |
| ---------- | ---------------------- | ----------------------- |
| `id`       | ID duy nhất của config | `"abc123"`              |
| `name`     | Tên hiển thị           | `"Target Temperature"`  |
| `type`     | Loại dữ liệu           | `"number"`, `"boolean"` |

### 3.3 Thuộc tính của mỗi Action

| Thuộc tính | Mô tả                    | Ví dụ          |
| ---------- | ------------------------ | -------------- |
| `action`   | ID của action để trigger | `"turn_on_ac"` |
| `name`     | Tên hiển thị             | `"Turn On AC"` |

---

## 4. Khai báo biến theo mảng

### 4.1 Khai báo biến toàn cục trước

```javascript
// Khai báo biến config (để lưu cấu hình nhận dữ liệu)
let configTargetTempAir1 = null,
  configCurrentTempAir1 = null,
  configModeAir1 = null,
  configFanSpeed = null,
  configPowerAir1 = null,
  configCurrentAir1 = null,
  configVoltageAir1 = null,
  configPowerConsumption = null;

// Khai báo biến actions (để lưu các lệnh điều khiển)
let onAirConditioner1 = null,
  offAirConditioner1 = null,
  modeAuto = null,
  modeCool = null,
  modeDry = null,
  modeFan = null,
  tempControlAir1 = null,
  fanSpeedControl = null;

// Khai báo biến values (để lưu giá trị nhận được)
let targetTempAir1 = null,
  currentTempAir1 = null,
  currentModeAir1 = null,
  fanSpeed = null,
  powerAir1 = null,
  currentAir1_value = null,
  voltageAir1_value = null,
  currentPowerConsumption_value = null;
```

### 4.2 Gán giá trị từ mảng configuration

```javascript
onConfiguration: (configuration) => {
  // Gán configs từ mảng realtime_configs theo index
  // Index 0: Target Temperature
  configTargetTempAir1 = configuration.realtime_configs[0];

  // Index 1: Current Temperature
  configCurrentTempAir1 = configuration.realtime_configs[1];

  // Index 2: Mode
  configModeAir1 = configuration.realtime_configs[2];

  // Index 3: Fan Speed
  configFanSpeed = configuration.realtime_configs[3];

  // Index 4: Power Status
  configPowerAir1 = configuration.realtime_configs[4];

  // Index 5: Current (Ampere)
  configCurrentAir1 = configuration.realtime_configs[5];

  // Index 6: Voltage
  configVoltageAir1 = configuration.realtime_configs[6];

  // Index 7: Power Consumption (kWh)
  configPowerConsumption = configuration.realtime_configs[7];

  // Gán actions từ mảng actions theo index
  // Index 0: Turn On
  onAirConditioner1 = configuration.actions[0];

  // Index 1: Turn Off
  offAirConditioner1 = configuration.actions[1];

  // Index 2: Temperature Control
  tempControlAir1 = configuration.actions[2];

  // Index 3-6: Mode Controls
  modeAuto = configuration.actions[3];
  modeCool = configuration.actions[4];
  modeDry = configuration.actions[5];
  modeFan = configuration.actions[6];

  // Index 7: Fan Speed Control
  fanSpeedControl = configuration.actions[7];
};
```

### 4.3 Bảng Index Configuration cho dự án Smart AC

| Index | Config Variable          | Mô tả                    |
| ----- | ------------------------ | ------------------------ |
| 0     | `configTargetTempAir1`   | Nhiệt độ cài đặt         |
| 1     | `configCurrentTempAir1`  | Nhiệt độ hiện tại        |
| 2     | `configModeAir1`         | Chế độ hoạt động         |
| 3     | `configFanSpeed`         | Tốc độ quạt              |
| 4     | `configPowerAir1`        | Trạng thái nguồn         |
| 5     | `configCurrentAir1`      | Dòng điện (A)            |
| 6     | `configVoltageAir1`      | Điện áp (V)              |
| 7     | `configPowerConsumption` | Điện năng tiêu thụ (kWh) |

| Index | Action Variable      | Mô tả                  |
| ----- | -------------------- | ---------------------- |
| 0     | `onAirConditioner1`  | Bật máy lạnh           |
| 1     | `offAirConditioner1` | Tắt máy lạnh           |
| 2     | `tempControlAir1`    | Điều khiển nhiệt độ    |
| 3     | `modeAuto`           | Chế độ Auto            |
| 4     | `modeCool`           | Chế độ Cool            |
| 5     | `modeDry`            | Chế độ Dry             |
| 6     | `modeFan`            | Chế độ Fan             |
| 7     | `fanSpeedControl`    | Điều khiển tốc độ quạt |

---

## 5. Câu lệnh GET Value (Nhận dữ liệu)

### 5.1 Syntax chính để nhận giá trị

```javascript
// Trong callback onValues
onValues: (values) => {
  // Syntax: values[config.id].value
  // config.id là id của config đã lưu từ onConfiguration

  targetTempAir1 = values[configTargetTempAir1.id].value;
  currentTempAir1 = values[configCurrentTempAir1.id].value;
  currentModeAir1 = values[configModeAir1.id].value;
  fanSpeed = values[configFanSpeed.id].value;
  powerAir1 = values[configPowerAir1.id].value;
  currentAir1_value = values[configCurrentAir1.id].value;
  voltageAir1_value = values[configVoltageAir1.id].value;
  currentPowerConsumption_value = values[configPowerConsumption.id].value;
};
```

### 5.2 Syntax chi tiết

```javascript
// Pattern chuẩn để lấy giá trị
const value = values[configVariable.id].value;

// Với safe fallback (khuyến nghị)
const value = values[configVariable.id]?.value || defaultValue;

// Ví dụ thực tế
if (configPowerConsumption && configPowerConsumption.id) {
  currentPowerConsumption_value = values[configPowerConsumption.id]?.value || 0;
} else {
  currentPowerConsumption_value = 0;
}
```

### 5.3 Cấu trúc object values

```javascript
// Object values có cấu trúc:
values = {
  config_id_1: { value: 25, timestamp: "2024-01-01T00:00:00Z" },
  config_id_2: { value: true, timestamp: "2024-01-01T00:00:00Z" },
  // ...
};

// Truy cập: values["config_id"].value
// Hoặc: values[configVariable.id].value
```

---

## 6. Câu lệnh Trigger Actions (Gửi lệnh điều khiển)

### 6.1 Syntax cơ bản

```javascript
// Syntax: eraWidget.triggerAction(actionId, data, options)
// - actionId: ID của action (lấy từ actionVariable.action)
// - data: null hoặc object data kèm theo
// - options: object chứa value (nếu cần gửi giá trị)

eraWidget.triggerAction(actionVariable.action, null);
```

### 6.2 Các trường hợp sử dụng

#### 6.2.1 Action đơn giản (không có giá trị)

```javascript
// Bật máy lạnh
eraWidget.triggerAction(onAirConditioner1.action, null);

// Tắt máy lạnh
eraWidget.triggerAction(offAirConditioner1.action, null);

// Đổi chế độ
eraWidget.triggerAction(modeAuto.action, null);
eraWidget.triggerAction(modeCool.action, null);
eraWidget.triggerAction(modeDry.action, null);
eraWidget.triggerAction(modeFan.action, null);
```

#### 6.2.2 Action có kèm giá trị

```javascript
// Điều khiển nhiệt độ - gửi kèm value
eraWidget.triggerAction(tempControlAir1.action, null, {
  value: 25, // Nhiệt độ cài đặt
});

// Điều khiển tốc độ quạt - gửi kèm level
eraWidget.triggerAction(fanSpeedControl.action, null, {
  value: 3, // Level quạt (0-5)
});
```

### 6.3 Syntax đầy đủ với options

```javascript
// Cấu trúc đầy đủ
eraWidget.triggerAction(
  actionVariable.action, // Action ID
  null, // Additional data (thường null)
  { value: valueToSend } // Options object với value
);
```

### 6.4 Ví dụ implementation hoàn chỉnh

```javascript
/**
 * Gửi nhiệt độ đến thiết bị
 */
async function sendTemperatureToDevice() {
  const targetTemp = 24; // Nhiệt độ muốn cài đặt

  eraWidget.triggerAction(tempControlAir1.action, null, {
    value: targetTemp,
  });

  console.log(`Sent temperature ${targetTemp}°C to device`);
}

/**
 * Điều khiển nguồn AC
 */
function handlePowerToggle(isPowerOn) {
  const powerAction = isPowerOn ? onAirConditioner1 : offAirConditioner1;

  eraWidget.triggerAction(powerAction.action, null);

  console.log(`Power command: ${isPowerOn ? "ON" : "OFF"}`);
}

/**
 * Đổi chế độ hoạt động
 */
function sendModeToDevice(mode) {
  const modeActionMap = {
    auto: modeAuto,
    cool: modeCool,
    dry: modeDry,
    fan: modeFan,
  };

  const modeAction = modeActionMap[mode];

  if (modeAction) {
    eraWidget.triggerAction(modeAction.action, null);
    console.log(`Mode changed to: ${mode}`);
  }
}

/**
 * Điều khiển tốc độ quạt
 */
function sendFanSpeedToEra(level) {
  if (fanSpeedControl) {
    eraWidget.triggerAction(fanSpeedControl.action, null, {
      value: level,
    });
    console.log(`Fan speed set to level: ${level}`);
  }
}
```

---

## 7. Ví dụ thực tế trong dự án

### 7.1 File: `js/eRaServices-controls.js`

```javascript
// ==========================================
// KHỞI TẠO E-RA WIDGET
// ==========================================
const eraWidget = new EraWidget();

// Biến config
let configTargetTempAir1 = null,
  configCurrentTempAir1 = null,
  configModeAir1 = null,
  configFanSpeed = null,
  configPowerAir1 = null,
  configCurrentAir1 = null,
  configVoltageAir1 = null,
  configPowerConsumption = null;

// Biến actions
let onAirConditioner1 = null,
  offAirConditioner1 = null,
  modeAuto = null,
  modeCool = null,
  modeDry = null,
  modeFan = null,
  tempControlAir1 = null,
  fanSpeedControl = null;

// Biến values
let targetTempAir1 = null,
  currentTempAir1 = null,
  currentModeAir1 = null,
  fanSpeed = null,
  powerAir1 = null;

// ==========================================
// KHỞI TẠO VÀ CẤU HÌNH
// ==========================================
eraWidget.init({
  needRealtimeConfigs: true,
  needActions: true,

  // Callback nhận configuration
  onConfiguration: (configuration) => {
    // Gán realtime configs theo index
    configTargetTempAir1 = configuration.realtime_configs[0];
    configCurrentTempAir1 = configuration.realtime_configs[1];
    configModeAir1 = configuration.realtime_configs[2];
    configFanSpeed = configuration.realtime_configs[3];
    configPowerAir1 = configuration.realtime_configs[4];
    configCurrentAir1 = configuration.realtime_configs[5];
    configVoltageAir1 = configuration.realtime_configs[6];
    configPowerConsumption = configuration.realtime_configs[7];

    // Gán actions theo index
    onAirConditioner1 = configuration.actions[0];
    offAirConditioner1 = configuration.actions[1];
    tempControlAir1 = configuration.actions[2];
    modeAuto = configuration.actions[3];
    modeCool = configuration.actions[4];
    modeDry = configuration.actions[5];
    modeFan = configuration.actions[6];
    fanSpeedControl = configuration.actions[7];

    // Expose global cho các module khác sử dụng
    window.eraWidget = eraWidget;
    window.tempControlAir1 = tempControlAir1;

    console.log("E-RA Configuration loaded successfully");
  },

  // Callback nhận values real-time
  onValues: (values) => {
    // GET VALUES từ E-RA
    targetTempAir1 = values[configTargetTempAir1.id].value;
    currentTempAir1 = values[configCurrentTempAir1.id].value;
    currentModeAir1 = values[configModeAir1.id].value;
    fanSpeed = values[configFanSpeed.id].value;
    powerAir1 = values[configPowerAir1.id].value;
    currentAir1_value = values[configCurrentAir1.id].value;
    voltageAir1_value = values[configVoltageAir1.id].value;

    // Safe access với fallback
    if (configPowerConsumption && configPowerConsumption.id) {
      currentPowerConsumption_value =
        values[configPowerConsumption.id]?.value || 0;
    }

    console.log("Values received from E-RA:", {
      targetTemp: targetTempAir1,
      currentTemp: currentTempAir1,
      mode: currentModeAir1,
      fanSpeed: fanSpeed,
      power: powerAir1,
    });
  },

  // Callback nhận histories
  onHistories: (histories) => {
    console.log("Histories data received:", histories);
  },
});

// ==========================================
// CÁC HÀM TRIGGER ACTIONS
// ==========================================

// Gửi nhiệt độ
async function sendTemperatureToDevice(temp) {
  eraWidget.triggerAction(tempControlAir1.action, null, {
    value: temp,
  });
}

// Điều khiển nguồn
function togglePower(turnOn) {
  const action = turnOn ? onAirConditioner1 : offAirConditioner1;
  eraWidget.triggerAction(action.action, null);
}

// Đổi chế độ
function changeMode(mode) {
  const modeMap = {
    auto: modeAuto,
    cool: modeCool,
    dry: modeDry,
    fan: modeFan,
  };

  const modeAction = modeMap[mode];
  if (modeAction) {
    eraWidget.triggerAction(modeAction.action, null);
  }
}

// Điều khiển quạt
function setFanSpeed(level) {
  eraWidget.triggerAction(fanSpeedControl.action, null, {
    value: level,
  });
}

// ==========================================
// YÊU CẦU DỮ LIỆU LỊCH SỬ
// ==========================================
function requestHistories(timeframe) {
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

  // Gọi API lấy histories
  eraWidget.requestHistories(startTime.getTime(), now.getTime());
}
```

---

## 8. Best Practices

### 8.1 Kiểm tra null trước khi sử dụng

```javascript
// Luôn kiểm tra config/action tồn tại trước khi dùng
if (!configTargetTempAir1 || !configTargetTempAir1.id) {
  console.error("Configuration not available yet");
  return;
}

if (!tempControlAir1 || !tempControlAir1.action) {
  console.error("Action not available yet");
  return;
}
```

### 8.2 Safe access với optional chaining

```javascript
// Sử dụng optional chaining (?.) và nullish coalescing (??)
const value = values[configVariable.id]?.value ?? defaultValue;
```

### 8.3 Expose global cho các module khác

```javascript
// Trong onConfiguration callback
window.eraWidget = eraWidget;
window.tempControlAir1 = tempControlAir1;
// ... các biến khác cần share

// Module khác có thể sử dụng
if (window.eraWidget && window.tempControlAir1) {
  window.eraWidget.triggerAction(window.tempControlAir1.action, null, {
    value: newTemp,
  });
}
```

### 8.4 Error handling

```javascript
try {
  eraWidget.triggerAction(actionVariable.action, null, { value: value });
  console.log("Action triggered successfully");
} catch (error) {
  console.error("Failed to trigger action:", error);
  // Handle error - show notification to user
}
```

### 8.5 Logging để debug

```javascript
// Log configuration khi nhận được
console.log("E-RA Configuration:", {
  configs: configuration.realtime_configs.length,
  actions: configuration.actions.length,
});

// Log values khi nhận được
console.log("E-RA Values:", values);

// Log actions khi trigger
console.log(`Triggering action: ${actionVariable.action} with value: ${value}`);
```

---

## Tổng kết

| Mục đích                       | Syntax                                                                  |
| ------------------------------ | ----------------------------------------------------------------------- |
| **Khởi tạo**                   | `const eraWidget = new EraWidget();`                                    |
| **Init**                       | `eraWidget.init({ needRealtimeConfigs: true, needActions: true, ... })` |
| **Lấy config**                 | `configVar = configuration.realtime_configs[index]`                     |
| **Lấy action**                 | `actionVar = configuration.actions[index]`                              |
| **GET Value**                  | `value = values[configVar.id].value`                                    |
| **Trigger Action (simple)**    | `eraWidget.triggerAction(actionVar.action, null)`                       |
| **Trigger Action (với value)** | `eraWidget.triggerAction(actionVar.action, null, { value: val })`       |
| **Request Histories**          | `eraWidget.requestHistories(startTime, endTime)`                        |

---

**Author**: Smart AC Development Team  
**Version**: 1.0.0  
**Last Updated**: December 2024
