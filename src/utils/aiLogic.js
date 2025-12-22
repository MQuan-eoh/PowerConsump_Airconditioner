/**
 * AI Logic for HVAC Control
 * Based on Simplified PMV (Predicted Mean Vote) and Heat Index
 */

/**
 * Calculate optimal AC settings based on environment and room conditions
 * @param {Object} params
 * @param {number} params.currentTemp - Current room temperature (°C)
 * @param {number} params.currentHumidity - Current room humidity (%)
 * @param {number} params.roomArea - Room area (m2)
 * @param {string} params.acType - 'inverter' | 'non-inverter'
 * @param {Object} params.weather - Outdoor weather data (optional)
 * @param {number} params.userOffset - Learned user preference offset (default 0)
 * @returns {Object} { temp: number, fan: string, mode: string, reason: string }
 */
export const calculateOptimalSettings = ({
  currentTemp,
  currentHumidity,
  roomArea,
  acType,
  weather,
  userOffset = 0,
}) => {
  let targetTemp = 26; // Base comfort temperature (Standard: 25-26°C)
  let fanMode = "auto";
  let operationMode = "cool";
  let reasons = [];

  // 0. Apply User Preference (Reinforcement Learning)
  if (userOffset !== 0) {
    targetTemp += userOffset;
    reasons.push(
      `Learned User Preference: ${userOffset > 0 ? "+" : ""}${userOffset}°C`
    );
  }

  // 1. Heat Index Adjustment (Cảm giác nhiệt)
  // Nếu độ ẩm cao, người dùng cảm thấy nóng hơn -> Giảm nhiệt độ
  if (currentHumidity > 70) {
    targetTemp -= 1;
    reasons.push(`High humidity (${currentHumidity}%) -> Decrease temp by 1°C`);

    // Nếu quá ẩm, ưu tiên chế độ Dry
    if (currentHumidity > 80) {
      operationMode = "dry";
      reasons.push(`Humidity > 80% -> Switch to Dry mode`);
    }
  } else if (currentHumidity < 40) {
    targetTemp += 1;
    reasons.push(`Low humidity (${currentHumidity}%) -> Increase temp by 1°C`);
  }

  // 2. Room Area Adjustment (Diện tích phòng)
  // Nếu phòng lớn (>30m2), cần tăng gió để lưu thông khí tốt hơn
  if (roomArea > 30) {
    fanMode = "high";
    reasons.push(`Large room (${roomArea}m2) -> Set Fan to High`);
  } else if (roomArea < 15) {
    fanMode = "low";
    reasons.push(`Small room (${roomArea}m2) -> Set Fan to Low`);
  }

  // 3. Weather Adjustment (Thời tiết bên ngoài - nếu có)
  if (weather) {
    const outdoorTemp = weather.temp;
    // Nếu chênh lệch nhiệt độ trong/ngoài quá lớn (>10 độ), không nên set quá thấp để tránh sốc nhiệt & tốn điện
    if (outdoorTemp > 35 && targetTemp < 25) {
      targetTemp = 25;
      reasons.push(
        `Outdoor very hot (${outdoorTemp}°C) -> Limit min temp to 25°C to save energy`
      );
    }
  }

  // 4. Energy Saving for Non-Inverter
  // Máy Non-Inverter nên set nhiệt độ cao hơn chút để tránh đóng ngắt liên tục
  if (acType === "non-inverter") {
    // Giữ nguyên hoặc tăng nhẹ nếu đang set thấp
    if (targetTemp < 25) {
      targetTemp = 25;
      reasons.push(`Non-Inverter AC -> Limit min temp to 25°C for efficiency`);
    }
  }

  // Clamp temperature (16 - 30)
  targetTemp = Math.max(16, Math.min(30, targetTemp));

  return {
    temp: Math.round(targetTemp),
    fan: fanMode,
    mode: operationMode,
    reason: reasons.join(". "),
  };
};
