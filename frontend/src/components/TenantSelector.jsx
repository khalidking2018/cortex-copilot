import React from "react";
import { FaBuilding } from "react-icons/fa";

function TenantSelector({ tenant, setTenant }) {
  return (
    <div className="tenant-selector-container">
      <FaBuilding className="tenant-icon" />
      <select
        value={tenant}
        onChange={(e) => setTenant(e.target.value)}
        className="tenant-select"
      >
        <option value="A">Tenant A (Commercial)</option>
        <option value="B">Tenant B (Industrial)</option>
      </select>
    </div>
  );
}

export default TenantSelector;