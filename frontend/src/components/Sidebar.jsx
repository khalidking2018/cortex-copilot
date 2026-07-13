import { FaChartBar, FaRobot, FaSignOutAlt } from "react-icons/fa";

function Sidebar() {
  return (
    <div className="sidebar">
      <h2>Cortex</h2>

      <ul>
        <li> <FaChartBar /> Dashboard</li>
        <li> <FaRobot /> AI Chat</li>
        <li> <FaSignOutAlt /> Logout</li>
      </ul>
    </div>
  );
}

export default Sidebar;