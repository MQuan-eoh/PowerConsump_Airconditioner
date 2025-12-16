import {
  startOfDay,
  startOfWeek,
  startOfMonth,
  format,
  parseISO,
  startOfHour,
} from "date-fns";

export const getDateRange = (period) => {
  const now = new Date();
  let from, to;

  // User requested: "current date and current time" for the check.
  // So 'to' is always 'now'.
  to = now;

  switch (period) {
    case "day":
      // "trong ngày" -> Start of today
      from = startOfDay(now);
      break;
    case "week":
      // "trong tuần" -> Start of this week
      from = startOfWeek(now, { weekStartsOn: 1 }); // Monday start
      break;
    case "month":
      // "trong tháng" -> Start of this month
      from = startOfMonth(now);
      break;
    default:
      from = startOfDay(now);
  }

  // Format for API: YYYY-MM-DDTHH:mm:ss
  const formatStr = "yyyy-MM-dd'T'HH:mm:ss";

  return {
    date_from: format(from, formatStr),
    date_to: format(to, formatStr),
  };
};

export const processConsumptionData = (data, period) => {
  console.log("processConsumptionData input:", {
    dataLength: data?.length,
    period,
  });
  if (!data || !Array.isArray(data) || data.length === 0) {
    return { total: 0, chartData: [] };
  }

  // Sort by date
  const sortedData = [...data].sort((a, b) => {
    const dateA = new Date(a.created_at || a.x);
    const dateB = new Date(b.created_at || b.x);
    return dateA - dateB;
  });

  // Filter valid data
  const validData = sortedData.filter((item) => {
    const val = item.val !== undefined ? item.val : item.y;
    return !isNaN(parseFloat(val));
  });

  if (validData.length === 0) {
    return { total: 0, chartData: [] };
  }

  // Calculate total consumption (max - min)
  const getVal = (item) =>
    parseFloat(item.val !== undefined ? item.val : item.y);
  const firstValue = getVal(validData[0]);
  const lastValue = getVal(validData[validData.length - 1]);
  const total = Math.max(0, lastValue - firstValue);

  // Chart Data
  const groupedData = {};

  validData.forEach((item) => {
    const dateStr = item.created_at || item.x;
    const val = getVal(item);
    const date = parseISO(dateStr);
    let key;
    if (period === "day") {
      // Group by hour: YYYY-MM-DD HH:00
      key = format(startOfHour(date), "yyyy-MM-dd'T'HH:mm:ss");
    } else {
      // Group by day: YYYY-MM-DD
      // For chart display, we might want the full ISO string or just the date part.
      // EnergyChart expects 'date' property.
      key = format(startOfDay(date), "yyyy-MM-dd");
    }

    if (!groupedData[key]) {
      groupedData[key] = {
        min: val,
        max: val,
        date: key,
      };
    } else {
      groupedData[key].min = Math.min(groupedData[key].min, val);
      groupedData[key].max = Math.max(groupedData[key].max, val);
    }
  });

  const chartData = Object.values(groupedData)
    .map((group) => {
      let kwh;
      if (period === "day") {
        // Cumulative consumption from start of day: Current Max - Start Value (00:00)
        kwh = group.max - firstValue;
      } else {
        // Consumption within the period (e.g. per day): Max - Min
        kwh = group.max - group.min;
      }

      return {
        date: group.date,
        kwh: Math.max(0, kwh),
      };
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  return { total, chartData };
};
