/**
 * E-RA History Data Test Script (Refined)
 * This script verifies the daily and monthly power consumption milestones.
 * 
 * Usage: 
 * node scripts/test-history.js <CONFIG_ID>
 */

const TOKEN = "a159b7047b33aebfdb2e83f614c5049e5d760d6d";
const BASE_URL = "https://backend.eoh.io/api";

// Helper to format date as yyyy-MM-ddTHH:mm:ss in LOCAL time
function formatLocalISO(date) {
    const pad = (num) => String(num).padStart(2, '0');
    const y = date.getFullYear();
    const m = pad(date.getMonth() + 1);
    const d = pad(date.getDate());
    const h = pad(date.getHours());
    const min = pad(date.getMinutes());
    const s = pad(date.getSeconds());
    return `${y}-${m}-${d}T${h}:${min}:${s}`;
}

async function fetchHistory(configId, from, to) {
    const url = `${BASE_URL}/chip_manager/configs/value_history_v3/?configs=${configId}&date_from=${encodeURIComponent(from)}&date_to=${encodeURIComponent(to)}`;
    
    console.log(`\n[API Query] ${from} -> ${to}`);
    
    try {
        const response = await fetch(url, {
            headers: {
                "Authorization": `Token ${TOKEN}`,
                "Accept": "application/json"
            }
        });

        if (!response.ok) {
            console.error(`Error: ${response.status} ${response.statusText}`);
            return [];
        }

        const data = await response.json();
        
        let history = [];
        if (data.configs && data.configs[0] && data.configs[0].history) {
            history = data.configs[0].history;
        } else if (Array.isArray(data) && data[0] && data[0].history) {
            history = data[0].history;
        } else if (Array.isArray(data)) {
            history = data;
        }
        
        return history;
    } catch (error) {
        console.error("Fetch failed:", error.message);
        return [];
    }
}

async function runTest() {
    const configId = process.argv[2];
    if (!configId) {
        console.error("Please provide a Config ID. Usage: node scripts/test-history.js <CONFIG_ID>");
        process.exit(1);
    }

    console.log(`=== REFINED HISTORY TEST FOR CONFIG ID: ${configId} ===`);

    const now = new Date();
    
    // TODAY BASELINE (00:00 - 00:05)
    console.log("\n--- STEP 1: FETCHING TODAY'S BASELINE (00:00 - 00:05) ---");
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfBaselineWindow = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 5, 0);
    
    const baselineFrom = formatLocalISO(startOfToday);
    const baselineTo = formatLocalISO(endOfBaselineWindow);

    let baselineData = await fetchHistory(configId, baselineFrom, baselineTo);
    let beginPW = null;

    if (baselineData.length > 0) {
        const sorted = baselineData.sort((a, b) => new Date(a.created_at || a.x) - new Date(b.created_at || b.x));
        beginPW = parseFloat(sorted[0].val || sorted[0].y);
        console.log(`✅ Found beginPW in 5-min window: ${beginPW} kWh at ${sorted[0].created_at || sorted[0].x}`);
    } else {
        console.log("⚠️ No data in 00:00-00:05 window. Manual scan needed.");
        // Fallback: search first available record of the day
        const dayTo = formatLocalISO(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59));
        console.log(`Searching first record of the whole day: ${baselineFrom} -> ${dayTo}`);
        const dayData = await fetchHistory(configId, baselineFrom, dayTo);
        if (dayData.length > 0) {
            const sorted = dayData.sort((a, b) => new Date(a.created_at || a.x) - new Date(b.created_at || b.x));
            beginPW = parseFloat(sorted[0].val || sorted[0].y);
            console.log(`✅ Found first available record of day: ${beginPW} kWh at ${sorted[0].created_at || sorted[0].x}`);
        } else {
            console.log("❌ No data found for the entire day.");
        }
    }

    // MONTHLY BASELINE (Day 1: 00:00 - 00:05)
    console.log("\n--- STEP 2: FETCHING MONTHLY BASELINE (Day 1: 00:00 - 00:05) ---");
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    const endOfMonthBaseline = new Date(now.getFullYear(), now.getMonth(), 1, 0, 5, 0);
    
    const mBaselineFrom = formatLocalISO(startOfMonth);
    const mBaselineTo = formatLocalISO(endOfMonthBaseline);

    let mBaselineData = await fetchHistory(configId, mBaselineFrom, mBaselineTo);
    let monthlyBeginPW = null;

    if (mBaselineData.length > 0) {
        const sorted = mBaselineData.sort((a, b) => new Date(a.created_at || a.x) - new Date(b.created_at || b.x));
        monthlyBeginPW = parseFloat(sorted[0].val || sorted[0].y);
        console.log(`✅ Found monthly beginPW in 5-min window: ${monthlyBeginPW} kWh`);
    } else {
        console.log(`⚠️ No data on Day 1 00:00-00:05. Scanning entire first day...`);
        const firstDayEnd = formatLocalISO(new Date(now.getFullYear(), now.getMonth(), 1, 23, 59, 59));
        const firstDayData = await fetchHistory(configId, mBaselineFrom, firstDayEnd);
        if (firstDayData.length > 0) {
            const sorted = firstDayData.sort((a, b) => new Date(a.created_at || a.x) - new Date(b.created_at || b.x));
            monthlyBeginPW = parseFloat(sorted[0].val || sorted[0].y);
            console.log(`✅ Found monthly beginPW on first day: ${monthlyBeginPW} kWh`);
        } else {
            console.log("❌ No data found on the first day of the month.");
        }
    }

    // CURRENT CONSUMPTION CALC
    if (beginPW !== null) {
        console.log("\n--- STEP 3: CALCULATING TODAY'S CONSUMPTION ---");
        // Get the latest value in last 1 hour
        const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        const latestFrom = formatLocalISO(hourAgo);
        const latestTo = formatLocalISO(now);
        const latestData = await fetchHistory(configId, latestFrom, latestTo);
        if (latestData.length > 0) {
            const sorted = latestData.sort((a, b) => new Date(b.created_at || b.x) - new Date(a.created_at || a.x));
            const currentVal = parseFloat(sorted[0].val || sorted[0].y);
            console.log(`Latest Value: ${currentVal} kWh`);
            console.log(`Today's Consumption: (Current - BeginPW) = ${currentVal} - ${beginPW} = ${(currentVal - beginPW).toFixed(2)} kWh`);
            
            if (monthlyBeginPW !== null) {
                console.log(`Monthly Consumption: (Current - MonthlyBeginPW) = ${currentVal} - ${monthlyBeginPW} = ${(currentVal - monthlyBeginPW).toFixed(2)} kWh`);
            }
        } else {
            console.log("Could not find current value in last 1 hour.");
        }
    }
}

runTest();
