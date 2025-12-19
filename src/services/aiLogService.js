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
