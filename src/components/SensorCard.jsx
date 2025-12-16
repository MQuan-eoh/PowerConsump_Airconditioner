import React from "react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import "./SensorCard.css";

const SensorCard = ({ title, value, unit, icon, color, data }) => {
  // Create a valid ID for the gradient by replacing spaces with hyphens
  const gradientId = `color-${title.replace(/\s+/g, "-")}`;

  return (
    <div className="sensor-card">
      <div className="sensor-header">
        <span className="sensor-title">{title}</span>
        {icon && (
          <span className="sensor-icon" style={{ color: color }}>
            {icon}
          </span>
        )}
      </div>
      <div className="sensor-value-container">
        <span className="sensor-value">{value}</span>
        <span className="sensor-unit">{unit}</span>
      </div>
      <div className="sensor-chart">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              fillOpacity={1}
              fill={`url(#${gradientId})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SensorCard;
