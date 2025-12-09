export const getTempColor = (temp) => {
  // Ensure temp is a number
  const t = Number(temp);

  if (t <= 18) return "#3b82f6"; // Blue-500 (Cool)
  if (t <= 20) return "#06b6d4"; // Cyan-500
  if (t <= 22) return "#10b981"; // Emerald-500
  if (t <= 24) return "#84cc16"; // Lime-500
  if (t <= 26) return "#eab308"; // Yellow-500
  if (t <= 28) return "#f97316"; // Orange-500
  return "#ef4444"; // Red-500 (Warm)
};
