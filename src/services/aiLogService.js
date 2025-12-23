/**
 * AI Logging Service
 * Handles recording of AI actions, rewards, and penalties.
 * Stores logs in localStorage and allows exporting to .txt file.
 */

const LOG_KEY = "ai_training_logs";

export const logAIAction = (action) => {
  const logs = getLogs();
  const newLog = {
    timestamp: new Date().toISOString(),
    type: "ACTION",
    ...action,
  };
  saveLog(newLog);
};

export const logReward = (reward, reason) => {
  const logs = getLogs();
  const newLog = {
    timestamp: new Date().toISOString(),
    type: "REWARD",
    value: reward,
    reason: reason,
  };
  saveLog(newLog);
};

export const getLearnedUserPreference = () => {
  const logs = getLogs();
  const now = new Date();
  const currentHour = now.getHours();

  // Filter for USER_OVERRIDE actions in the last 7 days
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const overrides = logs.filter((log) => {
    if (log.type !== "ACTION" || log.action !== "USER_OVERRIDE") return false;

    const logTime = new Date(log.timestamp);
    if (logTime <= oneWeekAgo) return false;

    // Context-aware filtering: Time of Day
    // Only consider overrides that happened within ±3 hours of current time
    const logHour = logTime.getHours();
    let diff = Math.abs(logHour - currentHour);
    if (diff > 12) diff = 24 - diff; // Handle midnight wrap (e.g. 23h vs 1h)

    return diff <= 3;
  });

  if (overrides.length === 0) return 0;

  // Calculate average deviation from 26 (base temp)
  // Or better: Calculate the average of the 'newTemp' set by user
  // But 'newTemp' depends on context.
  // Let's use the average of (newTemp - 26).
  // If user sets 24, diff is -2. If user sets 28, diff is +2.

  const totalDiff = overrides.reduce((sum, log) => {
    // Assuming base temp is roughly 26.
    // We want to know "How much does the user deviate from standard?"
    // log.newTemp is the value user chose.
    return sum + (log.newTemp - 26);
  }, 0);

  const avgDiff = totalDiff / overrides.length;

  // Round to nearest 0.5
  return Math.round(avgDiff * 2) / 2;
};

const getLogs = () => {
  try {
    const stored = localStorage.getItem(LOG_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error("Failed to parse logs", e);
    return [];
  }
};

const saveLog = (logItem) => {
  try {
    const logs = getLogs();
    // Keep last 1000 logs
    const updatedLogs = [...logs, logItem].slice(-1000);
    localStorage.setItem(LOG_KEY, JSON.stringify(updatedLogs));
    console.log(`[AI Log] ${logItem.type}:`, logItem);
  } catch (e) {
    console.error("Failed to save log", e);
  }
};

export const downloadLogs = () => {
  const logs = getLogs();
  if (logs.length === 0) {
    alert("No logs to download");
    return;
  }

  let content = "TIMESTAMP | TYPE | DETAILS\n";
  content += "----------------------------------------\n";

  logs.forEach((log) => {
    const time = new Date(log.timestamp).toLocaleString();
    let details = "";

    if (log.type === "ACTION") {
      details = `Set Temp: ${log.temp}°C, Fan: ${log.fan}, Mode: ${log.mode}. Reason: ${log.reason}`;
    } else if (log.type === "REWARD") {
      details = `Value: ${log.value}. Reason: ${log.reason}`;
    }

    content += `${time} | ${log.type} | ${details}\n`;
  });

  // Create blob and download
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ai_training_log_${new Date().toISOString().slice(0, 10)}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const clearLogs = () => {
  localStorage.removeItem(LOG_KEY);
};
