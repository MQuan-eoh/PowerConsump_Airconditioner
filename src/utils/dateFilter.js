import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  format,
  parseISO,
  startOfHour,
  isSameDay,
  eachDayOfInterval,
  eachHourOfInterval,
} from "date-fns";

export const getDateRange = (period, referenceDate = new Date()) => {
  const now = new Date();
  const refDate = new Date(referenceDate);
  let from, to;

  switch (period) {
    case "day":
      // "trong ngày" -> Start of selected day
      from = startOfDay(refDate);
      // If it's today, end at now (current time), otherwise end of that day
      if (isSameDay(refDate, now)) {
        to = now;
      } else {
        to = endOfDay(refDate);
      }
      break;
    case "week":
      // "trong tuần" -> Start of the week containing referenceDate
      from = startOfWeek(refDate, { weekStartsOn: 1 }); // Monday start
      // End of that week
      to = endOfWeek(refDate, { weekStartsOn: 1 });
      break;
    case "month":
      // "trong tháng" -> Start of the month containing referenceDate
      from = startOfMonth(refDate);
      to = endOfMonth(refDate);
      break;
    default:
      from = startOfDay(refDate);
      to = now;
  }

  // Format for API: YYYY-MM-DDTHH:mm:ss
  const formatStr = "yyyy-MM-dd'T'HH:mm:ss";

  return {
    date_from: format(from, formatStr),
    date_to: format(to, formatStr),
  };
};

export const processConsumptionData = (data, period, dateRange) => {
  console.log("processConsumptionData input:", {
    dataLength: data?.length,
    period,
    dateRange,
  });

  let validData = [];
  let firstValue = 0;
  let total = 0;

  // 1. Process Data if available
  if (data && Array.isArray(data) && data.length > 0) {
    // Sort by date
    const sortedData = [...data].sort((a, b) => {
      const dateA = new Date(a.created_at || a.x);
      const dateB = new Date(b.created_at || b.x);
      return dateA - dateB;
    });

    // Filter valid data
    validData = sortedData.filter((item) => {
      const val = item.val !== undefined ? item.val : item.y;
      return !isNaN(parseFloat(val));
    });

    if (validData.length > 0) {
      const getVal = (item) =>
        parseFloat(item.val !== undefined ? item.val : item.y);
      firstValue = getVal(validData[0]);
      const lastValue = getVal(validData[validData.length - 1]);
      total = Math.max(0, lastValue - firstValue);
    }
  }

  // 2. Group Data
  const groupedData = {};
  const getVal = (item) =>
    parseFloat(item.val !== undefined ? item.val : item.y);

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

  // 3. Generate Full Range Keys
  let fullKeys = [];
  if (dateRange && dateRange.date_from && dateRange.date_to) {
    try {
      const start = parseISO(dateRange.date_from);
      const end = parseISO(dateRange.date_to);

      if (period === "day") {
        const hours = eachHourOfInterval({ start, end });
        fullKeys = hours.map((d) =>
          format(startOfHour(d), "yyyy-MM-dd'T'HH:mm:ss")
        );
      } else {
        const days = eachDayOfInterval({ start, end });
        fullKeys = days.map((d) => format(startOfDay(d), "yyyy-MM-dd"));
      }
    } catch (e) {
      console.error("Error generating date interval:", e);
      // Fallback to keys from data if range generation fails
      fullKeys = Object.keys(groupedData).sort();
    }
  } else {
    fullKeys = Object.keys(groupedData).sort();
  }

  // 4. Map to Chart Data
  const chartData = fullKeys.map((key) => {
    const group = groupedData[key];
    let kwh = 0;

    if (group) {
      if (period === "day") {
        // Cumulative consumption from start of day
        kwh = group.max - firstValue;
      } else {
        // Consumption within the period
        kwh = group.max - group.min;
      }
    }

    return {
      date: key,
      kwh: Math.max(0, kwh),
    };
  });

  return { total, chartData };
};
