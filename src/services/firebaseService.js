import {
  database,
  ref,
  set,
  get,
  onValue,
  push,
  update,
  remove,
} from "../config/firebase";
import {
  format,
  startOfDay,
  endOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from "date-fns";

// ============ AC UNITS MANAGEMENT ============

export const createACUnit = async (acData) => {
  const acRef = push(ref(database, "ac_units"));
  const acId = acRef.key;

  const newAC = {
    id: acId,
    name: acData.name || `AC ${acId.slice(-4)}`,
    roomName: acData.roomName || "Unknown Room",
    roomArea: acData.roomArea || 0, // m2
    acType: acData.acType || "inverter", // inverter | non-inverter
    capacity: acData.capacity || 9000, // BTU
    power: acData.power || 1000, // Watt
    brand: acData.brand || "",
    model: acData.model || "",

    // Integration
    isEraLinked: false, // Default to false for new units

    // Current state
    isOnline: true,
    isOn: false,
    temperature: 26,
    fanMode: "auto", // auto | low | medium | high
    operationMode: "manual", // manual | ai
    swingMode: "auto", // auto | fixed

    // Energy tracking
    currentKwh: 0, // Current meter reading
    startOfDayKwh: 0, // Reading at start of day
    todayKwh: 0, // Today's consumption
    monthlyKwh: 0, // This month's consumption

    // Timestamps
    createdAt: Date.now(),
    updatedAt: Date.now(),
    lastOnlineAt: Date.now(),
  };

  await set(acRef, newAC);
  return newAC;
};

export const updateACUnit = async (acId, updates) => {
  const acRef = ref(database, `ac_units/${acId}`);
  await update(acRef, {
    ...updates,
    updatedAt: Date.now(),
  });
};

export const deleteACUnit = async (acId) => {
  await remove(ref(database, `ac_units/${acId}`));
};

export const getACUnits = async () => {
  const snapshot = await get(ref(database, "ac_units"));
  if (snapshot.exists()) {
    return Object.values(snapshot.val());
  }
  return [];
};

export const subscribeToACUnits = (callback) => {
  const acRef = ref(database, "ac_units");
  return onValue(acRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(Object.values(snapshot.val()));
    } else {
      callback([]);
    }
  });
};

export const subscribeToACUnit = (acId, callback) => {
  const acRef = ref(database, `ac_units/${acId}`);
  return onValue(acRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    } else {
      callback(null);
    }
  });
};

// ============ ENERGY READINGS ============

export const recordEnergyReading = async (acId, kwhValue) => {
  const now = new Date();
  const dateKey = format(now, "yyyy-MM-dd");
  const hourKey = format(now, "HH");

  const readingRef = ref(
    database,
    `energy_readings/${acId}/${dateKey}/${hourKey}`
  );
  await set(readingRef, {
    kwh: kwhValue,
    timestamp: Date.now(),
  });

  // Update AC unit's current kwh
  await updateACUnit(acId, { currentKwh: kwhValue });
};

// Record start of day reading for accurate daily calculation
export const recordStartOfDayReading = async (acId, kwhValue) => {
  const dateKey = format(new Date(), "yyyy-MM-dd");
  const readingRef = ref(database, `daily_start_readings/${acId}/${dateKey}`);
  await set(readingRef, {
    kwh: kwhValue,
    timestamp: Date.now(),
  });

  await updateACUnit(acId, { startOfDayKwh: kwhValue });
};

export const getStartOfDayReading = async (acId, date = new Date()) => {
  const dateKey = format(date, "yyyy-MM-dd");
  const snapshot = await get(
    ref(database, `daily_start_readings/${acId}/${dateKey}`)
  );
  if (snapshot.exists()) {
    return snapshot.val().kwh;
  }
  return null;
};

export const getDailyEnergyData = async (acId, date = new Date()) => {
  const dateKey = format(date, "yyyy-MM-dd");
  const snapshot = await get(
    ref(database, `energy_readings/${acId}/${dateKey}`)
  );
  if (snapshot.exists()) {
    return snapshot.val();
  }
  return {};
};

export const getEnergyHistory = async (acId, days = 7) => {
  const history = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateKey = format(date, "yyyy-MM-dd");

    const snapshot = await get(
      ref(database, `daily_consumption/${acId}/${dateKey}`)
    );
    history.push({
      date: dateKey,
      kwh: snapshot.exists() ? snapshot.val().totalKwh : 0,
    });
  }

  return history;
};

// Record final daily consumption
export const recordDailyConsumption = async (acId, date, totalKwh) => {
  const dateKey = format(date, "yyyy-MM-dd");
  const monthKey = format(date, "yyyy-MM");
  const yearKey = format(date, "yyyy");

  // Record daily
  await set(ref(database, `daily_consumption/${acId}/${dateKey}`), {
    totalKwh,
    timestamp: Date.now(),
  });

  // Update monthly aggregation
  const monthlyRef = ref(database, `monthly_consumption/${acId}/${monthKey}`);
  const monthlySnapshot = await get(monthlyRef);
  const currentMonthly = monthlySnapshot.exists()
    ? monthlySnapshot.val().totalKwh
    : 0;
  await set(monthlyRef, {
    totalKwh: currentMonthly + totalKwh,
    updatedAt: Date.now(),
  });

  // Update yearly aggregation
  const yearlyRef = ref(database, `yearly_consumption/${acId}/${yearKey}`);
  const yearlySnapshot = await get(yearlyRef);
  const currentYearly = yearlySnapshot.exists()
    ? yearlySnapshot.val().totalKwh
    : 0;
  await set(yearlyRef, {
    totalKwh: currentYearly + totalKwh,
    updatedAt: Date.now(),
  });
};

export const getMonthlyConsumption = async (acId, month = new Date()) => {
  const monthKey = format(month, "yyyy-MM");
  const snapshot = await get(
    ref(database, `monthly_consumption/${acId}/${monthKey}`)
  );
  return snapshot.exists() ? snapshot.val().totalKwh : 0;
};

export const getYearlyConsumption = async (acId, year = new Date()) => {
  const yearKey = format(year, "yyyy");
  const snapshot = await get(
    ref(database, `yearly_consumption/${acId}/${yearKey}`)
  );
  return snapshot.exists() ? snapshot.val().totalKwh : 0;
};

// ============ ELECTRICITY BILLS ============

export const addElectricityBill = async (billData) => {
  const billRef = push(ref(database, "electricity_bills"));
  const billId = billRef.key;

  const newBill = {
    id: billId,
    month: billData.month, // "yyyy-MM" format
    kwh: billData.kwh,
    amount: billData.amount, // VND
    isBefore: billData.isBefore || true, // true = before solution, false = after
    createdAt: Date.now(),
  };

  await set(billRef, newBill);
  return newBill;
};

export const getElectricityBills = async () => {
  const snapshot = await get(ref(database, "electricity_bills"));
  if (snapshot.exists()) {
    return Object.values(snapshot.val()).sort((a, b) =>
      a.month.localeCompare(b.month)
    );
  }
  return [];
};

export const deleteElectricityBill = async (billId) => {
  await remove(ref(database, `electricity_bills/${billId}`));
};

export const subscribeToElectricityBills = (callback) => {
  const billsRef = ref(database, "electricity_bills");
  return onValue(billsRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(
        Object.values(snapshot.val()).sort((a, b) =>
          a.month.localeCompare(b.month)
        )
      );
    } else {
      callback([]);
    }
  });
};

// ============ USAGE TIME TRACKING ============

export const recordUsageTime = async (acId, date, minutes) => {
  const dateKey = format(date, "yyyy-MM-dd");
  const usageRef = ref(database, `usage_time/${acId}/${dateKey}`);
  await set(usageRef, {
    minutes,
    timestamp: Date.now(),
  });
};

export const getDailyUsageTime = async (acId, date = new Date()) => {
  const dateKey = format(date, "yyyy-MM-dd");
  const snapshot = await get(ref(database, `usage_time/${acId}/${dateKey}`));
  return snapshot.exists() ? snapshot.val().minutes : 0;
};

// ============ CARBON CREDIT CALCULATION ============

// 1 kWh = 0.7 kg CO2 (Vietnam grid emission factor)
// 1 ton CO2 = 1 carbon credit
export const calculateCarbonCredit = (kwhSaved) => {
  const co2Kg = kwhSaved * 0.7;
  const carbonCredits = co2Kg / 1000; // Convert to tons
  return {
    co2Kg,
    carbonCredits,
  };
};

// ============ SAVINGS CALCULATION ============

export const calculateSavings = (beforeKwh, afterKwh, pricePerKwh = 3000) => {
  const kwhSaved = beforeKwh - afterKwh;
  const moneySaved = kwhSaved * pricePerKwh;
  const percentSaved =
    beforeKwh > 0 ? ((kwhSaved / beforeKwh) * 100).toFixed(1) : 0;
  const carbon = calculateCarbonCredit(kwhSaved);

  return {
    kwhSaved,
    moneySaved,
    percentSaved,
    ...carbon,
  };
};

// ============ MONTHLY KWH CALCULATION FOR CURRENT MONTH ============

export const getCurrentMonthKwh = async (acId) => {
  const now = new Date();
  const monthKey = format(now, "yyyy-MM");
  const startDate = startOfMonth(now);

  let totalKwh = 0;

  // Get all daily consumptions for current month
  const snapshot = await get(ref(database, `daily_consumption/${acId}`));
  if (snapshot.exists()) {
    const dailyData = snapshot.val();
    Object.keys(dailyData).forEach((dateKey) => {
      if (dateKey.startsWith(monthKey)) {
        totalKwh += dailyData[dateKey].totalKwh || 0;
      }
    });
  }

  return totalKwh;
};

// Subscribe to daily consumption for real-time updates
export const subscribeToDailyConsumption = (acId, callback) => {
  const consumptionRef = ref(database, `daily_consumption/${acId}`);
  return onValue(consumptionRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    } else {
      callback({});
    }
  });
};
