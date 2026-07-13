import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function PFChart({ data }) {
  return (
    <div
      style={{
        width: "100%",
        height: 350,
        background: "white",
        borderRadius: "12px",
        padding: "20px",
        marginTop: "25px",
        boxShadow: "0px 2px 8px rgba(0,0,0,0.1)",
      }}
    >
      <h3>Power Factor Trend</h3>

      <ResponsiveContainer width="100%" height="90%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis dataKey="time" />

          <YAxis />

          <Tooltip />

          <Line
            type="monotone"
            dataKey="pf"
            stroke="#2563eb"
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default PFChart;
