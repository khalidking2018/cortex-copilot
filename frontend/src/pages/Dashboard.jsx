import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Cell,
} from "recharts";
import {
  FaTachometerAlt,
  FaRegMoneyBillAlt,
  FaBell,
  FaCog,
  FaThermometerHalf,
  FaBrain,
  FaBolt,
  FaSyncAlt,
  FaRegFileAlt,
  FaRobot,
  FaBuilding,
  FaExclamationTriangle,
  FaCheckCircle,
} from "react-icons/fa";
import api from "../services/api";
import "../styles/dashboard.css";

function Dashboard({ token, tenant, onLogout }) {
  const [activeTab, setActiveTab] = useState("power");
  const [voltageCurrent, setVoltageCurrent] = useState("voltage");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Time range states for each segment
  const [energyRange, setEnergyRange] = useState("today");
  const [diagnosticsRange, setDiagnosticsRange] = useState("today");
  const [demandRange, setDemandRange] = useState("today");

  // Telemetry metric states
  const [dashboardData, setDashboardData] = useState(null);
  const [energyData, setEnergyData] = useState(null);
  const [pfData, setPfData] = useState(null);
  const [voltageData, setVoltageData] = useState(null);
  const [currentData, setCurrentData] = useState(null);
  const [frequencyData, setFrequencyData] = useState(null);
  const [demandData, setDemandData] = useState(null);
  const [billingData, setBillingData] = useState(null);
  const [anomaliesData, setAnomaliesData] = useState(null);
  const [gatewayData, setGatewayData] = useState(null);

  // Telemetry chart states
  const [pfChartData, setPfChartData] = useState([]);
  const [voltageChartData, setVoltageChartData] = useState([]);
  const [currentChartData, setCurrentChartData] = useState([]);
  const [energyChartData, setEnergyChartData] = useState([]);
  const [powerChartData, setPowerChartData] = useState([]);
  const [demandChartData, setDemandChartData] = useState([]);

  // Gateway health data chart
  const [gatewayChartData, setGatewayChartData] = useState([
    { time: "00:00", temp: 47, ram: 12 },
    { time: "02:00", temp: 48, ram: 12 },
    { time: "04:00", temp: 49, ram: 12 },
    { time: "06:00", temp: 50, ram: 13 },
    { time: "08:00", temp: 51, ram: 12 },
    { time: "10:00", temp: 49, ram: 12 },
    { time: "12:00", temp: 48, ram: 12 },
    { time: "14:00", temp: 50, ram: 12 },
    { time: "16:00", temp: 51, ram: 13 },
    { time: "18:00", temp: 42, ram: 12 },
    { time: "20:00", temp: 49, ram: 12 },
    { time: "22:00", temp: 51, ram: 12 },
  ]);

  // AI Chat states
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([
    {
      sender: "AI",
      text: "Hi! I am Cortex Copilot, your energy analytics assistant. You can ask me about energy consumption, power factor (PF), voltage, current, frequency, peak demand, or active anomalies.",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  // Card-specific range data fetchers
  const fetchEnergyData = (range) => {
    api.get(`/energy?range=${range}`).then(res => setEnergyData(res.data));
    api.get(`/chart/energy?range=${range}`).then(res => setEnergyChartData(res.data));
    api.get(`/power?range=${range}`).then(res => {
      setDashboardData(prev => prev ? {
        ...prev,
        "Average Power": res.data.average_active_power,
        "Average Apparent Power": res.data.average_apparent_power
      } : null);
    });
    api.get(`/chart/power?range=${range}`).then(res => setPowerChartData(res.data));
  };

  const fetchDiagnosticsData = (range) => {
    api.get(`/voltage?range=${range}`).then(res => setVoltageData(res.data));
    api.get(`/current?range=${range}`).then(res => setCurrentData(res.data));
    api.get(`/chart/voltage?range=${range}`).then(res => setVoltageChartData(res.data));
    api.get(`/chart/current?range=${range}`).then(res => setCurrentChartData(res.data));
  };

  const fetchDemandData = (range) => {
    api.get(`/demand?range=${range}`).then(res => setDemandData(res.data));
    api.get(`/chart/demand?range=${range}`).then(res => setDemandChartData(res.data));
    api.get(`/powerfactor?range=${range}`).then(res => setPfData(res.data));
    api.get(`/chart/powerfactor?range=${range}`).then(res => setPfChartData(res.data));
  };

  // Fetch all endpoints in parallel for initial load
  const fetchData = () => {
    setLoading(true);
    setError(null);

    const endpoints = [
      `/dashboard`,
      `/energy?range=today`,
      `/powerfactor?range=today`,
      `/voltage?range=today`,
      `/current?range=today`,
      `/frequency`,
      `/demand?range=today`,
      `/billing`,
      `/anomalies`,
      `/chart/powerfactor?range=today`,
      `/chart/voltage?range=today`,
      `/chart/current?range=today`,
      `/chart/energy?range=today`,
      `/chart/power?range=today`,
      `/chart/demand?range=today`,
      `/gateway/health`
    ];

    Promise.all(endpoints.map(url => api.get(url)))
      .then(([
        dashboardRes,
        energyRes,
        pfRes,
        voltageRes,
        currentRes,
        frequencyRes,
        demandRes,
        billingRes,
        anomaliesRes,
        chartPfRes,
        chartVoltageRes,
        chartCurrentRes,
        chartEnergyRes,
        chartPowerRes,
        chartDemandRes,
        gatewayRes
      ]) => {
        setDashboardData(dashboardRes.data);
        setEnergyData(energyRes.data);
        setPfData(pfRes.data);
        setVoltageData(voltageRes.data);
        setCurrentData(currentRes.data);
        setFrequencyData(frequencyRes.data);
        setDemandData(demandRes.data);
        setBillingData(billingRes.data);
        setAnomaliesData(anomaliesRes.data);
        setPfChartData(chartPfRes.data);
        setVoltageChartData(chartVoltageRes.data);
        setCurrentChartData(chartCurrentRes.data);
        setEnergyChartData(chartEnergyRes.data);
        setPowerChartData(chartPowerRes.data);
        setDemandChartData(chartDemandRes.data);
        setGatewayData(gatewayRes.data);
        
        setEnergyRange("today");
        setDiagnosticsRange("today");
        setDemandRange("today");

        // Dynamically shift health data slightly to demonstrate live communication
        setGatewayChartData(prev => prev.map(item => ({
          ...item,
          temp: gatewayRes.data.temperature + (Math.floor(Math.random() * 5) - 2),
          ram: gatewayRes.data.ram_usage
        })));
        
        setLoading(false);
      })
      .catch((err) => {
        console.error("API error loading dashboard stats:", err);
        setError(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
  }, [tenant]);

  // Submit chat question
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userQuestion = chatInput.trim();
    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setChatMessages((prev) => [
      ...prev,
      { sender: "You", text: userQuestion, time: timeString },
    ]);
    setChatInput("");
    setIsTyping(true);

    api.post("/chat", { question: userQuestion })
      .then((res) => {
        setChatMessages((prev) => [
          ...prev,
          {
            sender: "AI",
            text: res.data.answer,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        setIsTyping(false);
      })
      .catch((err) => {
        console.error("Chat API error:", err);
        setChatMessages((prev) => [
          ...prev,
          {
            sender: "AI",
            text: "Hi! I am currently unable to reach my main chatbot model, but based on your local diagnostics: " + 
                  (userQuestion.toLowerCase().includes("power factor") || userQuestion.toLowerCase().includes("pf") 
                    ? `Today's average Power Factor for Tenant ${tenant} is ${pfData?.average_power_factor || 0.96}.` 
                    : userQuestion.toLowerCase().includes("energy") 
                      ? `Today's total energy consumption for Tenant ${tenant} is ${energyData?.total_energy || "1,669,267"} kWh.`
                      : userQuestion.toLowerCase().includes("voltage")
                        ? `The average Voltage is ${voltageData?.average_voltage || 420.45} V.`
                        : `No direct anomalies matches found. I am Cortex Copilot, your energy analytics assistant.`),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        setIsTyping(false);
      });
  };

  // Helper to color contract demand bars
  const getCDBarColor = (val) => {
    if (val > 100) return "#ef4444"; // red
    if (val >= 80) return "#eab308"; // yellow
    return "#3b82f6"; // blue
  };

  // Switch views based on activeTab
  const renderView = () => {
    switch (activeTab) {
      case "power":
        return (
          <div className="power-view animate-fade-in">
            {/* Load Factor Utilisation Card */}
            <div className="dashboard-card">
              <div className="dashboard-card-header">
                <div className="card-title-area">
                  <div className="card-category">Load Factor Utilisation</div>
                  <div className="card-value-large">
                    {energyData?.load_factor !== undefined ? `${energyData.load_factor}%` : "38.79%"}
                  </div>
                  <div className="card-subtitle">
                    Total Energy (kWh) consumed today / (Peak kW observed today times number of hours today)
                  </div>
                </div>
                <div className="time-tabs">
                  {["today", "week", "month", "last_month"].map((r) => (
                    <button
                      key={r}
                      className={`time-tab ${energyRange === r ? "active" : ""}`}
                      onClick={() => {
                        setEnergyRange(r);
                        fetchEnergyData(r);
                      }}
                    >
                      {r === "today" ? "Today" : r === "week" ? "This Week" : r === "month" ? "This Month" : "Last Month"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="info-bullet green-arrow">
                <span>↑</span> Today is +11.5% above this week's avg — optimal load profile
              </div>

              <div style={{ width: "100%", height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={energyChartData}
                    margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f1f5f9"
                    />
                    <XAxis
                      dataKey="time"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 600 }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => `${val}%`}
                      tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 600 }}
                      domain={[0, 100]}
                    />
                    <Tooltip
                      formatter={(value) => [`${value}%`, "Load Factor"]}
                    />
                    <ReferenceLine
                      y={70}
                      stroke="#6366f1"
                      strokeDasharray="3 3"
                      label={{
                        value: "Better 70%",
                        position: "right",
                        fill: "#6366f1",
                        fontSize: 10,
                        fontWeight: "600",
                      }}
                    />
                    <ReferenceLine
                      y={65}
                      stroke="#fb923c"
                      strokeDasharray="3 3"
                      label={{
                        value: "Rebate 65%",
                        position: "right",
                        fill: "#fb923c",
                        fontSize: 10,
                        fontWeight: "600",
                      }}
                    />
                    <Bar dataKey="val" radius={[4, 4, 0, 0]} maxBarSize={15}>
                      {energyChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.val >= 65 ? "#10b981" : "#ef4444"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="custom-legend">
                <div className="legend-item">
                  <div
                    className="legend-dot"
                    style={{ backgroundColor: "#ef4444" }}
                  ></div>
                  <span>Penalty zone</span>
                </div>
                <div className="legend-item">
                  <div
                    className="legend-dot"
                    style={{ backgroundColor: "#eab308" }}
                  ></div>
                  <span>No adjustment</span>
                </div>
                <div className="legend-item">
                  <div
                    className="legend-dot"
                    style={{ backgroundColor: "#10b981" }}
                  ></div>
                  <span>Rebate zone</span>
                </div>
              </div>
            </div>

            {/* Deep dive heading */}
            <div className="section-header">Deep Dive Diagnostics</div>

            {/* Phase Voltage & Current Card */}
            <div className="dashboard-card">
              <div className="dashboard-card-header">
                <div className="card-title-area">
                  <div className="card-category">
                    Phase {voltageCurrent === "voltage" ? "Voltage (L-N)" : "Current"}
                  </div>
                  <div className="card-value-large voltage-val">
                    {voltageCurrent === "voltage"
                      ? `${voltageData?.average_vln || "--"} V`
                      : `${currentData?.average_current || "--"} A`}
                  </div>
                  <div className="card-subtitle">Per-phase averages • telemetry load</div>

                  <div className="toggle-group">
                    <button
                      className={`toggle-btn ${
                        voltageCurrent === "voltage" ? "active" : ""
                      }`}
                      onClick={() => setVoltageCurrent("voltage")}
                    >
                      Voltage
                    </button>
                    <button
                      className={`toggle-btn ${
                        voltageCurrent === "current" ? "active" : ""
                      }`}
                      onClick={() => setVoltageCurrent("current")}
                    >
                      Current
                    </button>
                  </div>
                </div>

                <div className="time-tabs">
                  {["today", "week", "month", "last_month"].map((r) => (
                    <button
                      key={r}
                      className={`time-tab ${diagnosticsRange === r ? "active" : ""}`}
                      onClick={() => {
                        setDiagnosticsRange(r);
                        fetchDiagnosticsData(r);
                      }}
                    >
                      {r === "today" ? "Today" : r === "week" ? "This Week" : r === "month" ? "This Month" : "Last Month"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="custom-legend" style={{ justifyContent: "flex-end", marginTop: "-10px", marginBottom: "15px" }}>
                <div className="legend-item">
                  <div className="legend-dot" style={{ backgroundColor: "#ef4444" }}></div>
                  <span>R</span>
                </div>
                <div className="legend-item">
                  <div className="legend-dot" style={{ backgroundColor: "#fbbf24" }}></div>
                  <span>Y</span>
                </div>
                <div className="legend-item">
                  <div className="legend-dot" style={{ backgroundColor: "#06b6d4" }}></div>
                  <span>B</span>
                </div>
                <div className="legend-item">
                  <div className="legend-line" style={{ borderTop: "2px dashed #64748b" }}></div>
                  <span>Avg</span>
                </div>
              </div>

              <div style={{ width: "100%", height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={
                      voltageCurrent === "voltage"
                        ? voltageChartData
                        : currentChartData
                    }
                    margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f1f5f9"
                    />
                    <XAxis
                      dataKey="time"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 600 }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 600 }}
                      domain={voltageCurrent === "voltage" ? ["auto", "auto"] : ["auto", "auto"]}
                    />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="R"
                      stroke="#ef4444"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="Y"
                      stroke="#fbbf24"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="B"
                      stroke="#06b6d4"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="Avg"
                      stroke="#64748b"
                      strokeWidth={1.5}
                      strokeDasharray="4 4"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="phase-stats-grid">
                <div className="phase-stat-card">
                  <div className="phase-stat-label">
                    <span
                      className="phase-stat-dot"
                      style={{ backgroundColor: "#ef4444" }}
                    ></span>
                    PHASE R
                  </div>
                  <div className="phase-stat-val">
                    {voltageCurrent === "voltage" 
                      ? `${voltageData?.phase_r || "--"} V` 
                      : `${currentData?.phase_r || "--"} A`}
                  </div>
                </div>
                <div className="phase-stat-card">
                  <div className="phase-stat-label">
                    <span
                      className="phase-stat-dot"
                      style={{ backgroundColor: "#fbbf24" }}
                    ></span>
                    PHASE Y
                  </div>
                  <div className="phase-stat-val">
                    {voltageCurrent === "voltage" 
                      ? `${voltageData?.phase_y || "--"} V` 
                      : `${currentData?.phase_y || "--"} A`}
                  </div>
                </div>
                <div className="phase-stat-card">
                  <div className="phase-stat-label">
                    <span
                      className="phase-stat-dot"
                      style={{ backgroundColor: "#06b6d4" }}
                    ></span>
                    PHASE B
                  </div>
                  <div className="phase-stat-val">
                    {voltageCurrent === "voltage" 
                      ? `${voltageData?.phase_b || "--"} V` 
                      : `${currentData?.phase_b || "--"} A`}
                  </div>
                </div>
                <div className="phase-stat-card">
                  <div className="phase-stat-label">
                    <span
                      className="phase-stat-dot"
                      style={{ backgroundColor: "#64748b" }}
                    ></span>
                    AVERAGE
                  </div>
                  <div className="phase-stat-val">
                    {voltageCurrent === "voltage"
                      ? `${voltageData?.average_vln || "--"} V`
                      : `${currentData?.average_current || "--"} A`}
                  </div>
                </div>
              </div>
            </div>

            {/* Active & Apparent Power Card */}
            <div className="dashboard-card">
              <div className="dashboard-card-header">
                <div className="card-title-area">
                  <div className="card-category">
                    Active Power & Apparent Power
                  </div>
                  <div className="card-subtitle">
                    Real-time Active Power (kW) and Apparent Power (kVA)
                  </div>
                  <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                    <span
                      className="legend-item"
                      style={{
                        background: "#fff7ed",
                        border: "1px solid #ffedd5",
                        color: "#c2410c",
                        padding: "4px 10px",
                        borderRadius: "9999px",
                        fontSize: "11px",
                        fontWeight: "700",
                      }}
                    >
                      <span
                        className="legend-dot"
                        style={{ backgroundColor: "#f97316" }}
                      ></span>
                      kW
                    </span>
                    <span
                      className="legend-item"
                      style={{
                        background: "#eff6ff",
                        border: "1px solid #dbeafe",
                        color: "#1d4ed8",
                        padding: "4px 10px",
                        borderRadius: "9999px",
                        fontSize: "11px",
                        fontWeight: "700",
                      }}
                    >
                      <span
                        className="legend-dot"
                        style={{ backgroundColor: "#2563eb" }}
                      ></span>
                      kVA
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ width: "100%", height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={powerChartData}
                    margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f1f5f9"
                    />
                    <XAxis
                      dataKey="time"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 600 }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 600 }}
                      domain={["auto", "auto"]}
                    />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="kW"
                      stroke="#f97316"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="kVA"
                      stroke="#2563eb"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="power-stats-grid">
                <div className="power-stat-card active-p">
                  <div className="power-stat-label">AVG ACTIVE POWER</div>
                  <div className="power-stat-val">{dashboardData?.["Average Power"] || "--"} kW</div>
                </div>
                <div className="power-stat-card apparent-p">
                  <div className="power-stat-label">AVG APPARENT POWER</div>
                  <div className="power-stat-val">{dashboardData?.["Average Apparent Power"] || "--"} kVA</div>
                </div>
              </div>
            </div>

            {/* Power Factor Trend Card */}
            <div className="dashboard-card">
              <div className="dashboard-card-header">
                <div className="card-title-area">
                  <div className="card-category">Power Factor History</div>
                  <div className="card-value-large" style={{ color: "#6366f1" }}>
                    {pfData?.average_power_factor || "0.96"}
                  </div>
                  <div className="card-subtitle">
                    Last 24 hours Power Factor (PF) diagnostics
                  </div>
                </div>
              </div>

              <div style={{ width: "100%", height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={pfChartData}
                    margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f1f5f9"
                    />
                    <XAxis
                      dataKey="time"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 600 }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 600 }}
                      domain={[0.8, 1.0]}
                    />
                    <Tooltip formatter={(val) => [val, "Power Factor"]} />
                    <ReferenceLine
                      y={0.95}
                      stroke="#10b981"
                      strokeDasharray="3 3"
                      label={{
                        value: "Standard 0.95",
                        position: "right",
                        fill: "#10b981",
                        fontSize: 10,
                        fontWeight: "600",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="pf"
                      stroke="#6366f1"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Contract Demand Utilisation Card */}
            <div className="dashboard-card">
              <div className="dashboard-card-header">
                <div className="card-title-area">
                  <div className="card-category">Contract Demand Utilisation</div>
                  <div className="card-value-large" style={{ color: getCDBarColor(demandData?.utilisation || 0) }}>
                    {demandData?.utilisation !== undefined ? `${demandData.utilisation}%` : "165.22%"}
                  </div>
                  <div className="card-subtitle">
                    Today • (peak kVA / Contract Demand Limit) x 100
                  </div>
                </div>
                <div className="time-tabs">
                  {["today", "week", "month", "last_month"].map((r) => (
                    <button
                      key={r}
                      className={`time-tab ${demandRange === r ? "active" : ""}`}
                      onClick={() => {
                        setDemandRange(r);
                        fetchDemandData(r);
                      }}
                    >
                      {r === "today" ? "Today" : r === "week" ? "This Week" : r === "month" ? "This Month" : "Last Month"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="info-bullet" style={{ color: getCDBarColor(demandData?.utilisation || 0) }}>
                <FaExclamationTriangle /> Peak demand limit crossed limit of {demandData?.contract_demand} kVA
              </div>

              <div style={{ width: "100%", height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={demandChartData}
                    margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f1f5f9"
                    />
                    <XAxis
                      dataKey="time"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 600 }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => `${val}%`}
                      tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 600 }}
                      domain={[0, "auto"]}
                    />
                    <Tooltip
                      formatter={(value) => [`${value}%`, "Utilisation"]}
                    />
                    <ReferenceLine
                      y={100}
                      stroke="#ef4444"
                      strokeDasharray="3 3"
                      label={{
                        value: "Limit 100%",
                        position: "right",
                        fill: "#ef4444",
                        fontSize: 10,
                        fontWeight: "700",
                      }}
                    />
                    <Bar dataKey="val" radius={[4, 4, 0, 0]} maxBarSize={12}>
                      {demandChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={getCDBarColor(entry.val)}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        );

      case "chat":
        return (
          <div className="chat-view animate-fade-in">
            <div className="section-title-area">
              <h2 className="section-title">Ask Cortex AI</h2>
              <p className="section-subtitle">Your industrial energy monitoring assistant. Ask anything about electricity, power factors, anomalies, or consumption.</p>
            </div>

            <div className="chat-box-card">
              <div className="chat-messages-container">
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={`chat-message ${msg.sender === "You" ? "user-msg" : "ai-msg"}`}>
                    <div className="message-header">
                      <strong>{msg.sender === "You" ? "You" : "Cortex AI"}</strong>
                      <span className="msg-time">{msg.time}</span>
                    </div>
                    <div className="message-text">{msg.text}</div>
                  </div>
                ))}
                {isTyping && (
                  <div className="chat-message ai-msg typing">
                    <div className="message-header">
                      <strong>Cortex AI</strong>
                    </div>
                    <div className="typing-dots">
                      <span></span><span></span><span></span>
                    </div>
                  </div>
                )}
              </div>

              <form onSubmit={handleSendMessage} className="chat-input-form">
                <input
                  type="text"
                  placeholder="Type your question......"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="chat-input"
                  disabled={isTyping}
                />
                <button type="submit" className="chat-send-btn" disabled={!chatInput.trim() || isTyping}>
                  Send
                </button>
              </form>
            </div>
          </div>
        );

      case "billing":
        return (
          <div className="billing-view animate-fade-in">
            <div className="section-title-area">
              <h2 className="section-title">Billing & Tariff (TGSPDCL · HT CAT. 1A)</h2>
              <p className="section-subtitle">Real-time time-of-use (ToU) apparent energy invoice calculated from telemetry</p>
            </div>

            <div className="billing-main-card">
              <div className="billing-invoice-header">
                <h3>TGSPDCL Energy Invoice</h3>
                <span className="invoice-tenant-badge">Tenant {tenant}</span>
              </div>

              {/* Demand Parameters */}
              <div className="billing-section-title">Demand Parameters</div>
              
              <div className="billing-item-row">
                <div className="billing-item-label">
                  <strong>Contract Demand (CD)</strong>
                  <span>Allocated demand capacity limit</span>
                </div>
                <div className="billing-item-value">1,501 kVA</div>
              </div>

              <div className="billing-item-row">
                <div className="billing-item-label">
                  <strong>Observed Max Demand</strong>
                  <span>Peak apparent power recorded in month</span>
                </div>
                <div className="billing-item-value">
                  {billingData?.max_demand_kva !== undefined ? new Intl.NumberFormat('en-US').format(billingData.max_demand_kva) : "0"} kVA
                </div>
              </div>

              <div className="billing-item-row">
                <div className="billing-item-label">
                  <strong>Chargeable Demand</strong>
                  <span>Max of observed peak demand or 80% of CD (1,201 kVA)</span>
                </div>
                <div className="billing-item-value">
                  {billingData?.chargeable_demand_kva !== undefined ? new Intl.NumberFormat('en-US').format(billingData.chargeable_demand_kva) : "0"} kVA
                </div>
              </div>

              {/* Energy Charges */}
              <div className="billing-section-title">Time-of-Use (ToU) Energy Charges</div>

              <div className="billing-item-row">
                <div className="billing-item-label">
                  <strong>Off-Peak Energy (22:00 - 06:00)</strong>
                  <span>Rate: ₹6.65 per kVAh</span>
                </div>
                <div className="billing-item-value">
                  {billingData?.off_peak_kvah !== undefined ? new Intl.NumberFormat('en-US').format(billingData.off_peak_kvah) : "0"} kVAh
                </div>
              </div>

              <div className="billing-item-row">
                <div className="billing-item-label">
                  <strong>Normal Energy (10:00 - 18:00)</strong>
                  <span>Rate: ₹7.15 per kVAh</span>
                </div>
                <div className="billing-item-value">
                  {billingData?.normal_kvah !== undefined ? new Intl.NumberFormat('en-US').format(billingData.normal_kvah) : "0"} kVAh
                </div>
              </div>

              <div className="billing-item-row">
                <div className="billing-item-label">
                  <strong>Peak Energy (06:00-10:00 · 18:00-22:00)</strong>
                  <span>Rate: ₹8.65 per kVAh</span>
                </div>
                <div className="billing-item-value">
                  {billingData?.peak_kvah !== undefined ? new Intl.NumberFormat('en-US').format(billingData.peak_kvah) : "0"} kVAh
                </div>
              </div>

              <div className="billing-item-row highlight">
                <div className="billing-item-label">
                  <strong>Total Energy Charges</strong>
                  <span>Sum of Off-Peak, Normal, and Peak charges</span>
                </div>
                <div className="billing-item-value">
                  ₹{billingData?.energy_charges !== undefined ? new Intl.NumberFormat('en-IN').format(billingData.energy_charges) : "0"}
                </div>
              </div>

              {/* Fixed & Duty Charges */}
              <div className="billing-section-title">Fixed & Government Charges</div>

              <div className="billing-item-row">
                <div className="billing-item-label">
                  <strong>Normal Demand Charge</strong>
                  <span>Charge within CD capacity (₹500 / kVA / month)</span>
                </div>
                <div className="billing-item-value">
                  ₹{billingData?.normal_demand_charge !== undefined ? new Intl.NumberFormat('en-IN').format(billingData.normal_demand_charge) : "0"}
                </div>
              </div>

              <div className="billing-item-row">
                <div className="billing-item-label">
                  <strong>Penal Demand Charge</strong>
                  <span>Excess demand penalty (₹1000 / kVA / month)</span>
                </div>
                <div className="billing-item-value">
                  ₹{billingData?.penal_demand_charge !== undefined ? new Intl.NumberFormat('en-IN').format(billingData.penal_demand_charge) : "0"}
                </div>
              </div>

              <div className="billing-item-row">
                <div className="billing-item-label">
                  <strong>Electricity Duty</strong>
                  <span>Flat government levy at 6 paise (₹0.06) per kVAh</span>
                </div>
                <div className="billing-item-value">
                  ₹{billingData?.electricity_duty !== undefined ? new Intl.NumberFormat('en-IN').format(billingData.electricity_duty) : "0"}
                </div>
              </div>

              <div className="billing-item-row">
                <div className="billing-item-label">
                  <strong>Customer Charges</strong>
                  <span>Flat monthly platform/grid connect fee</span>
                </div>
                <div className="billing-item-value">
                  ₹{billingData?.customer_charges !== undefined ? new Intl.NumberFormat('en-IN').format(billingData.customer_charges) : "3,500"}
                </div>
              </div>

              {/* Invoice Totals */}
              <div className="billing-section-title">Totals</div>

              <div className="billing-item-row subtotal">
                <div className="billing-item-label">
                  <strong>Subtotal Bill Amount</strong>
                  <span>Due within standard 15-day grace period</span>
                </div>
                <div className="billing-item-value">
                  ₹{billingData?.subtotal_bill !== undefined ? new Intl.NumberFormat('en-IN').format(billingData.subtotal_bill) : "0"}
                </div>
              </div>

              <div className="billing-item-row">
                <div className="billing-item-label">
                  <strong>Late Payment Surcharge</strong>
                  <span>1.25% of subtotal bill (if unpaid after 15 days)</span>
                </div>
                <div className="billing-item-value text-red">
                  ₹{billingData?.late_payment_surcharge !== undefined ? new Intl.NumberFormat('en-IN').format(billingData.late_payment_surcharge) : "0"}
                </div>
              </div>

              <div className="billing-total-row">
                <div className="billing-item-label">
                  <strong>Grand Total (Late Payment)</strong>
                  <span>Subtotal + late surcharge</span>
                </div>
                <div className="billing-total-value">
                  ₹{billingData?.grand_total !== undefined ? new Intl.NumberFormat('en-IN').format(billingData.grand_total) : "0"}
                </div>
              </div>
            </div>

            <div className="tariff-info-card">
              <h4>TGSPDCL • HT CAT. 1A Active Tariff Structure</h4>
              <ul>
                <li><strong>Energy Charges:</strong> Time-of-use tiered rates (Off-Peak: ₹6.65, Normal: ₹7.15, Peak: ₹8.65 per kVAh).</li>
                <li><strong>Demand charges:</strong> Normal demand at ₹500/kVA based on chargeable kVA (min 80% of CD). Excess kVA penalty at ₹1,000/kVA.</li>
                <li><strong>Other Levies:</strong> Flat Electricity Duty of ₹0.06/kVAh and monthly customer charges of ₹3,500.</li>
              </ul>
            </div>
          </div>
        );

      case "alerts":
        return (
          <div className="alerts-view animate-fade-in">
            <div className="section-title-area">
              <h2 className="section-title">System Anomalies</h2>
              <p className="section-subtitle">Real-time threshold alert diagnostics from backend monitors</p>
            </div>

            {anomaliesData?.anomalies && anomaliesData.anomalies.length > 0 ? (
              <div className="alerts-list">
                {anomaliesData.anomalies.map((anomaly, idx) => {
                  const isCritical = anomaly.includes("Low Power Factor") || anomaly.includes("High Demand");
                  let badgeIcon = "🔴";
                  let alertTitle = "System Warning";

                  if (anomaly.includes("Low Power Factor")) {
                    alertTitle = "Low Power Factor";
                    badgeIcon = "🔴";
                  } else if (anomaly.includes("High Voltage")) {
                    alertTitle = "High Voltage";
                    badgeIcon = "🟠";
                  } else if (anomaly.includes("High Frequency")) {
                    alertTitle = "High Frequency";
                    badgeIcon = "🟠";
                  } else if (anomaly.includes("High Demand")) {
                    alertTitle = "High Demand Limit Crossed";
                    badgeIcon = "🔴";
                  }

                  return (
                    <div key={idx} className={`alert-card ${isCritical ? "critical" : "warning"}`}>
                      <div className="alert-header">
                        <span className="alert-badge">
                          <span style={{ marginRight: "8px" }}>{badgeIcon}</span>
                          {alertTitle}
                        </span>
                        <span className="alert-severity">{isCritical ? "Critical" : "Warning"}</span>
                      </div>
                      <p className="alert-desc">{anomaly}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="no-alerts-card">
                <FaCheckCircle style={{ fontSize: "48px", color: "#10b981", marginBottom: "16px" }} />
                <h3>✅ No anomalies detected</h3>
                <p>All voltage, demand, power factor, and frequency metrics are operating within standard parameters.</p>
              </div>
            )}
          </div>
        );

      case "settings":
        return (
          <div className="settings-view animate-fade-in">
            {/* Refresh Interval Card */}
            <div className="refresh-interval-card">
              <div className="refresh-left">
                <FaSyncAlt className="refresh-icon" />
                <span>Refresh interval</span>
              </div>
              <div className="refresh-right">300 s</div>
            </div>

            {/* Edge Node Gateway Health Card */}
            <div className="dashboard-card">
              <div className="dashboard-card-header" style={{ marginBottom: "10px" }}>
                <div className="card-title-area">
                  <div className="card-category">EDGE NODE • GATEWAY DIAGNOSTICS</div>
                  <div className="card-main-title">Raspberry Pi Gateway</div>
                </div>
              </div>

              {/* Three Mini Cards */}
              <div className="pi-metrics-grid">
                <div className="pi-metric-card">
                  <div className="pi-metric-label">
                    <FaThermometerHalf style={{ color: "#ef4444" }} />
                    TEMP
                  </div>
                  <div className="pi-metric-val">{gatewayData?.temperature || 51}°C</div>
                </div>
                <div className="pi-metric-card">
                  <div className="pi-metric-label">
                    <FaBrain style={{ color: "#ec4899" }} />
                    RAM
                  </div>
                  <div className="pi-metric-val">{gatewayData?.ram_usage || 12}%</div>
                </div>
                <div className="pi-metric-card">
                  <div className="pi-metric-label">
                    <FaBolt style={{ color: "#eab308" }} />
                    CPU LOAD
                  </div>
                  <div className="pi-metric-val">{gatewayData?.cpu_usage || 5}%</div>
                </div>
              </div>

              {/* Pi Temp section */}
              <div className="card-category" style={{ marginBottom: "12px" }}>
                PI TEMPERATURE • LAST 24 H
              </div>

              <div style={{ width: "100%", height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={gatewayChartData}
                    margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f1f5f9"
                    />
                    <XAxis
                      dataKey="time"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 600 }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 600 }}
                      domain={[0, 100]}
                    />
                    <Tooltip />
                    <ReferenceLine
                      y={75}
                      stroke="#ef4444"
                      strokeDasharray="3 3"
                      label={{
                        value: "75°C Max Limit",
                        position: "right",
                        fill: "#ef4444",
                        fontSize: 10,
                        fontWeight: "700",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="temp"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="ram"
                      stroke="#6366f1"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px" }}>
                <div className="custom-legend" style={{ marginTop: 0 }}>
                  <div className="legend-item">
                    <div
                      className="legend-line"
                      style={{ backgroundColor: "#10b981" }}
                    ></div>
                    <span>Temperature (°C)</span>
                  </div>
                  <div className="legend-item">
                    <div
                      className="legend-line"
                      style={{ backgroundColor: "#6366f1" }}
                    ></div>
                    <span>RAM Usage (%)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* WBSEDCL . B-IDIT Card */}
            <div className="tariff-card">
              <div className="card-category">WBSEDCL • B-IDIT</div>
              <div className="card-main-title" style={{ fontSize: "18px" }}>
                Active Industrial Tariff Contract
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Rendering Error States
  if (error) {
    return (
      <div className="error-container">
        <div className="error-card animate-fade-in">
          <FaExclamationTriangle style={{ fontSize: "56px", color: "#ef4444", marginBottom: "16px" }} />
          <h2>Unable to connect to server</h2>
          <p>The Cortex energy monitoring backend server is currently offline or unreachable.</p>
          <button onClick={fetchData} className="retry-btn">
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // Rendering Loading Skeleton States
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading dashboard telemetry metrics...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Dynamic Header */}
      <div className="dashboard-header animate-fade-in">
        <div>
          <h1 className="dashboard-main-title">Cortex Copilot</h1>
          <p className="dashboard-main-subtitle">Industrial Smart Energy Monitoring Node</p>
        </div>
        <div className="tenant-profile-area">
          <span className="tenant-badge">Tenant {tenant === "A" ? "A" : "B"}</span>
          <button onClick={onLogout} className="logout-btn">Logout</button>
        </div>
      </div>

      {/* Main View Render */}
      {renderView()}

      {/* Fixed Bottom Navigation Bar */}
      <div className="bottom-nav">
        <button
          className={`bottom-nav-item ${activeTab === "power" ? "active" : ""}`}
          onClick={() => setActiveTab("power")}
        >
          {activeTab === "power" && <div className="nav-active-dot" />}
          <FaTachometerAlt className="bottom-nav-icon" />
          <span className="bottom-nav-text">Power</span>
        </button>

        <button
          className={`bottom-nav-item ${activeTab === "chat" ? "active" : ""}`}
          onClick={() => setActiveTab("chat")}
        >
          {activeTab === "chat" && <div className="nav-active-dot" />}
          <FaRobot className="bottom-nav-icon" />
          <span className="bottom-nav-text">AI Chat</span>
        </button>

        <button
          className={`bottom-nav-item ${activeTab === "billing" ? "active" : ""}`}
          onClick={() => setActiveTab("billing")}
        >
          {activeTab === "billing" && <div className="nav-active-dot" />}
          <FaRegMoneyBillAlt className="bottom-nav-icon" />
          <span className="bottom-nav-text">Billing</span>
        </button>

        <button
          className={`bottom-nav-item ${activeTab === "alerts" ? "active" : ""}`}
          onClick={() => setActiveTab("alerts")}
        >
          {activeTab === "alerts" && <div className="nav-active-dot" />}
          <FaBell className="bottom-nav-icon" />
          <span className="bottom-nav-text">Alerts</span>
        </button>

        <button
          className={`bottom-nav-item ${activeTab === "settings" ? "active" : ""}`}
          onClick={() => setActiveTab("settings")}
        >
          {activeTab === "settings" && <div className="nav-active-dot" />}
          <FaCog className="bottom-nav-icon" />
          <span className="bottom-nav-text">Settings</span>
        </button>
      </div>
    </div>
  );
}

export default Dashboard;