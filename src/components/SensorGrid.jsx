import React from "react";
import SensorCard from "./SensorCard";
import "./SensorGrid.css";
import {
  FaTemperatureHigh,
  FaTint,
  FaCloud,
  FaWind,
  FaSmog,
  FaChartBar,
} from "react-icons/fa";

const SensorGrid = () => {
  // Mock data - in a real app, this would come from props or context
  const generateMockData = () => {
    return Array.from({ length: 20 }, (_, i) => ({
      value: Math.floor(Math.random() * 50) + 20,
    }));
  };

  const sensors = [
    {
      id: "temp",
      title: "Temp",
      value: "63",
      unit: "°F",
      icon: <FaTemperatureHigh />,
      color: "#d97706", // Orange/Brown
      data: generateMockData(),
    },
    {
      id: "humid",
      title: "Humid",
      value: "49.2",
      unit: "%",
      icon: <FaTint />,
      color: "#2563eb", // Blue
      data: generateMockData(),
    },
    {
      id: "co2",
      title: "CO₂",
      value: "556",
      unit: "ppm",
      icon: <FaCloud />, // Or a specific CO2 icon if available
      color: "#dc2626", // Red
      data: generateMockData(),
    },
    {
      id: "voc",
      title: "VOC",
      value: "104",
      unit: "ppb",
      icon: <FaWind />,
      color: "#16a34a", // Green
      data: generateMockData(),
    },
    {
      id: "pm25",
      title: "PM <2.5µm",
      value: "1",
      unit: "µg/m³",
      icon: <FaSmog />,
      color: "#9333ea", // Purple
      data: generateMockData(),
    },
    {
      id: "aq_rating",
      title: "AQ Rating",
      value: "Good",
      unit: "",
      icon: <FaChartBar />,
      color: "#3b82f6", // Light Blue
      data: [], // No chart for rating usually, or maybe a flat line
      isRating: true, // Special handling if needed
    },
  ];

  return (
    <div className="sensor-section">
      <h2 className="sensor-section-title">Air Quality</h2>
      <div className="sensor-grid">
        {sensors.map((sensor) => (
          <SensorCard
            key={sensor.id}
            title={sensor.title}
            value={sensor.value}
            unit={sensor.unit}
            icon={sensor.icon}
            color={sensor.color}
            data={sensor.data}
          />
        ))}
      </div>
    </div>
  );
};

export default SensorGrid;
