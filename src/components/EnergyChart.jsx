import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";
import { format, parseISO } from "date-fns";
import { useLanguage } from "../contexts/LanguageContext";
import "./EnergyChart.css";

const CustomBar = (props) => {
  const { x, y, width, height, fill } = props;
  const depth = 8;

  return (
    <g>
      <defs>
        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
        <linearGradient id="barSide" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
        <linearGradient id="barTop" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
      </defs>

      <path
        d={`M ${x},${y + height} L ${x},${y} L ${x + width},${y} L ${
          x + width
        },${y + height} Z`}
        fill="url(#barGradient)"
      />

      <path
        d={`M ${x + width},${y} L ${x + width + depth},${y - depth} L ${
          x + width + depth
        },${y + height - depth} L ${x + width},${y + height} Z`}
        fill="url(#barSide)"
      />

      <path
        d={`M ${x},${y} L ${x + depth},${y - depth} L ${x + width + depth},${
          y - depth
        } L ${x + width},${y} Z`}
        fill="url(#barTop)"
      />
    </g>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p className="tooltip-label">{label}</p>
        <p className="tooltip-value">
          <span className="value">{payload[0].value.toFixed(2)}</span>
          <span className="unit">kWh</span>
        </p>
      </div>
    );
  }
  return null;
};

const CustomLabel = (props) => {
  const { x, y, width, value } = props;
  if (value === 0) return null;

  return (
    <g>
      <polygon
        points={`${x + width / 2},${y - 30} ${x + width / 2 - 8},${y - 15} ${
          x + width / 2 + 8
        },${y - 15}`}
        fill="var(--accent-yellow)"
      />
      <text
        x={x + width / 2}
        y={y - 40}
        fill="var(--text-primary)"
        textAnchor="middle"
        fontSize={11}
        fontWeight={600}
      >
        {value.toFixed(2)}
      </text>
    </g>
  );
};

const EnergyChart = ({ data, period }) => {
  const { t } = useLanguage();
  const formattedData = useMemo(() => {
    return data.map((item) => {
      let label = item.date;
      try {
        const date = parseISO(item.date);
        if (period === "day") {
          label = format(date, "dd/MM");
        } else if (period === "week") {
          label = format(date, "dd/MM");
        } else {
          label = format(date, "dd");
        }
      } catch (e) {
        label = item.date;
      }
      return {
        ...item,
        label,
      };
    });
  }, [data, period]);

  if (!data || data.length === 0) {
    return (
      <div className="chart-empty">
        <p>{t("noData")}</p>
      </div>
    );
  }

  return (
    <div className="energy-chart">
      <ResponsiveContainer width="100%" height={350}>
        <BarChart
          data={formattedData}
          margin={{ top: 60, right: 30, left: 0, bottom: 20 }}
          barSize={40}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.1)"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
            tickFormatter={(value) => `${value}`}
          />
          <Tooltip content={<CustomTooltip />} cursor={false} />
          <Bar
            dataKey="kwh"
            shape={<CustomBar />}
            isAnimationActive={true}
            animationDuration={1000}
          >
            <LabelList dataKey="kwh" content={<CustomLabel />} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default EnergyChart;
