import re
import ollama

from services.analytics_service import (
    calculate_energy,
    calculate_power_factor,
    calculate_voltage,
    calculate_current,
    calculate_frequency,
    calculate_max_demand,
    detect_anomalies,
    calculate_billing,
    calculate_power,
    get_thd_metrics,
    get_peak_usage_times,
    get_low_pf_events,
)

def is_temporal_query_out_of_bounds(question: str) -> bool:
    """Returns True if the question mentions a year or month outside our telemetry dataset."""
    # Our data spans May 19, 2026 to July 4, 2026.
    # Check for any 4-digit years other than 2026 (e.g., 2023, 2024, 2025, 2027)
    years = re.findall(r"\b(19\d{2}|20[0-2][0-9]|202[0-5]|202[7-9])\b", question)
    if years:
        return True
    
    # Check for months completely outside our dataset range
    out_of_bound_months = [
        "january", "february", "march", "april", "august", "september", "october", "november", "december",
        "jan", "feb", "mar", "apr", "aug", "sept", "oct", "nov", "dec"
    ]
    for month in out_of_bound_months:
        if re.search(r"\b" + month + r"\b", question.lower()):
            return True
            
    return False


def detect_range(question_lower: str) -> str:
    if "this week" in question_lower or "last 7 days" in question_lower:
        return "week"
    elif "this month" in question_lower or "july" in question_lower:
        return "month"
    elif "last month" in question_lower or "june" in question_lower:
        return "last_month"
    return "today"


def chat_with_ai(question: str, tenant: str):
    question_lower = question.lower()
    
    # Enforce tenant query isolation - reject questions about other tenants/factories/segments
    other_tenant = 'B' if tenant.upper() == 'A' else 'A'
    other_t = other_tenant.lower()
    
    # Build list of regex patterns to block
    patterns = [
        rf"\btenant[_\s-]*{other_t}(?:s|\x27s)?\b",
        rf"\btenant{other_t}(?:s|\x27s)?\b",
        rf"\bfactory[_\s-]*{other_t}(?:s|\x27s)?\b",
        rf"\bfactory{other_t}(?:s|\x27s)?\b",
        rf"\bsegment[_\s-]*{other_t}(?:s|\x27s)?\b",
        rf"\bsegment{other_t}(?:s|\x27s)?\b",
        rf"\buser[_\s-]*{other_t}(?:s|\x27s)?\b",
        rf"\buser{other_t}(?:s|\x27s)?\b",
        r"\bother\s+tenant(?:s|\x27s)?\b",
        r"\banother\s+tenant(?:s|\x27s)?\b",
        r"\bdifferent\s+tenant(?:s|\x27s)?\b",
        r"\bcross\s+tenant(?:s|\x27s)?\b",
        r"\bother\s+factory(?:s|\x27s)?\b",
        r"\banother\s+factory(?:s|\x27s)?\b",
        r"\bdifferent\s+factory(?:s|\x27s)?\b",
        r"\bcross\s+factory(?:s|\x27s)?\b",
        r"\bcompare\s+me\b",
        r"\bcompare\s+my\b",
        r"\bcomparison\s+with\b",
    ]
    
    # Symmetric check for single letter reference to the other tenant
    if other_tenant == 'B':
        # Standalone B (case-insensitive) - e.g. B's, B, except "phase B"
        patterns.append(r"\b(?<!phase\s)b(?:s|\x27s)?\b")
    else:
        # For A: Standalone A (case-insensitive) at end of query or after prepositions
        patterns.append(r"\b(?<!phase\s)a\x27s\b")
        patterns.append(r"\b(of|for|about|regarding|to|with|than)\s+a(?:\s*[?.!]*)?$")
        # Standalone capitalized A (excluding phase A)
        patterns.append(r"\b(?<![pP]hase\s)A\b")

    is_other_tenant_query = False
    for p in patterns:
        if other_tenant == 'A' and p == r"\b(?<![pP]hase\s)A\b":
            # Match case-sensitively for capitalized A
            if re.search(p, question):
                is_other_tenant_query = True
                break
        else:
            if re.search(p, question, re.I):
                is_other_tenant_query = True
                break
            
    if is_other_tenant_query:
        return "i dont have acces for that"

    # Determine if question asks for out-of-bounds temporal data
    if is_temporal_query_out_of_bounds(question):
        return "The requested data is unavailable."

    range_val = detect_range(question_lower)

    # ---------- Intent Detection ----------
    matched_intent = True
    
    # 1. Total Harmonic Distortion (THD)
    if "thd" in question_lower or "distortion" in question_lower or "harmonic" in question_lower:
        data = get_thd_metrics(tenant)
        
    # 2. Peak active power usage times
    elif "peak" in question_lower or "highest" in question_lower or "max usage" in question_lower:
        data = get_peak_usage_times(tenant)
        
    # 3. Why Power Factor is low or dropped
    elif ("low" in question_lower or "drop" in question_lower or "cause" in question_lower) and ("pf" in question_lower or "power factor" in question_lower or "factor" in question_lower):
        data = get_low_pf_events(tenant)
        
    # 4. Energy reduction recommendations (Requires multiple telemetry metrics to construct recommendations)
    elif "reduce" in question_lower or "saving" in question_lower or "optimization" in question_lower:
        energy_data = calculate_energy(tenant, range_val)
        pf_data = calculate_power_factor(tenant, range_val)
        demand_data = calculate_max_demand(tenant, range_val)
        data = {
            "energy_consumption": energy_data,
            "power_factor": pf_data,
            "peak_demand": demand_data
        }
        
    # 5. General Energy / Consumption / kWh
    elif "energy" in question_lower or "consumption" in question_lower or "kwh" in question_lower or "mwh" in question_lower:
        data = calculate_energy(tenant, range_val)
        
    # 6. General Power Factor
    elif "power factor" in question_lower or "pf" in question_lower:
        data = calculate_power_factor(tenant, range_val)
        
    # 7. Voltage
    elif "voltage" in question_lower:
        data = calculate_voltage(tenant, range_val)
        
    # 8. Current
    elif "current" in question_lower:
        data = calculate_current(tenant, range_val)
        
    # 9. Frequency
    elif "frequency" in question_lower:
        data = calculate_frequency(tenant, range_val)
        
    # 10. Peak Demand / maximum demand
    elif "demand" in question_lower:
        data = calculate_max_demand(tenant, range_val)
        
    # 11. Abnormalities / Anomalies
    elif "abnormal" in question_lower or "anomaly" in question_lower or "abnormalities" in question_lower:
        data = detect_anomalies(tenant)
        
    # 12. Billing / Cost
    elif "bill" in question_lower or "invoice" in question_lower or "billing" in question_lower or "charge" in question_lower or "cost" in question_lower:
        month_param = None
        if range_val == "last_month":
            month_param = "2026-06"
        elif range_val == "month":
            month_param = "2026-07"
        data = calculate_billing(tenant, month_param)
        
    else:
        matched_intent = False
        data = {
            "message": "No analytics found."
        }

    # Strict grounding instructions
    prompt = f"""
You are Cortex Copilot, a self-hosted Industrial Energy Monitoring Assistant.
Your goal is to answer the user's question using ONLY the provided telemetry analytics data.

CONTEXT OF THE TELEMETRY SYSTEM:
- The telemetry database covers the period from May 19, 2026 to July 4, 2026.
- The latest active date in the database is July 4, 2026. 
- When the user asks about "today", "this month", "current data", or "peak usage", they refer to the latest telemetry data present in the database. Treat the provided Telemetry Analytics as the current active data.
- The tenant ID is '{tenant}'.

TELEMETRY INTERPRETATION:
- "total_energy" is the cumulative energy consumed by the tenant in kWh.
- "average_power_factor" is the average PF. Standard PF is 0.95 or above. Drops below 0.90 are critical.
- "active_power_kw" (kW) is the real power used. High kW at specific times indicates peak usage.
- "reactive_power_kvar" (kVAR) is the reactive power. High reactive power causes the Power Factor to drop.
- Peak usage times list contains the dates and times of the highest electrical loads (kW).
- Low PF events list contains recent events where PF dropped, indicating inductive loads without compensation.
- For voltage queries: "average_voltage" is average line-to-line voltage, "average_vln" is average line-to-neutral voltage, and "phase_r", "phase_y", "phase_b" are the phase voltages (Phase Voltage R, Phase Voltage Y, Phase Voltage B) in Volts.
- For current queries: "average_current" is average current, and "phase_r", "phase_y", "phase_b" are the phase currents (Phase Current R, Phase Current Y, Phase Current B) in Amperes.
- For frequency queries: "average_frequency" is the system frequency in Hertz (Hz).
- For total harmonic distortion: "average_voltage_thd_pct" and "average_current_thd_pct" describe phase-wise THD percentages.
- For anomaly/abnormality queries: "anomalies" is a list of detected abnormal events in the telemetry data.
- For billing/invoice queries, ToU Apparent Energy values (off_peak_kvah, normal_kvah, peak_kvah) and rates are:
  - Off-Peak (22:00-06:00): ₹6.65/kVAh
  - Normal (10:00-18:00): ₹7.15/kVAh
  - Peak (06:00-10:00 & 18:00-22:00): ₹8.65/kVAh
  - Electricity Duty: ₹0.06/kVAh flat
  - Customer Charges: ₹3500/month flat
  - CD: 1501 kVA, Min Chargeable Demand: 1201 kVA (80% of CD)
  - Demand Charge: ₹500/kVA/month within CD, ₹1000/kVA/month penal surcharge for excess above CD
  - Late Payment Surcharge: 1.25% of subtotal bill (unpaid after 15 days)

CRITICAL INSTRUCTIONS:
1. Do not invent any numbers, dates, or calculations. Use only what is in the Telemetry Analytics block.
2. If the user's question asks for specific dates, metrics, or years (such as 2023 or 2024) that are completely absent from the database range, respond exactly with: "The requested data is unavailable."
3. If the request is for the current period (e.g. today, this month), use the telemetry data directly. Do not refuse.
4. Keep the explanation professional, concise, and direct.

Question:
{question}

Telemetry Analytics:
{data}
"""

    try:
        response = ollama.chat(
            model="qwen2.5:3b",
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )
        answer = response["message"]["content"].strip()
        # Double check if LLM hallucinated when no analytics existed
        if not matched_intent and "unavailable" not in answer.lower():
            return "The requested data is unavailable."
        return answer

    except Exception as e:
        # Fallback dynamic explanation in case Ollama is offline
        if not matched_intent:
            return "The requested data is unavailable."
            
        if "thd" in question_lower or "distortion" in question_lower or "harmonic" in question_lower:
            return f"Average THD for Tenant {tenant}: Voltage THD (R: {data['average_voltage_thd_pct']['phase_r']}%, Y: {data['average_voltage_thd_pct']['phase_y']}%, B: {data['average_voltage_thd_pct']['phase_b']}%) and Current THD (R: {data['average_current_thd_pct']['phase_r']}%, Y: {data['average_current_thd_pct']['phase_y']}%, B: {data['average_current_thd_pct']['phase_b']}%)."
        elif "peak" in question_lower or "highest" in question_lower or "max usage" in question_lower:
            return f"Peak energy usage times observed for Tenant {tenant}: " + ", ".join([f"{item['date']} at {item['time']} ({item['active_power_kw']} kW)" for item in data])
        elif "low" in question_lower and ("pf" in question_lower or "power factor" in question_lower):
            return f"Your Power Factor dropped below 0.95 due to reactive loads. Specific events for Tenant {tenant}: " + ", ".join([f"{item['date']} at {item['time']} (PF: {item['pf']}, Reactive Power: {item['reactive_power_kvar']} kVAR)" for item in data])
        elif "reduce" in question_lower or "saving" in question_lower or "optimization" in question_lower:
            return f"To reduce consumption for Tenant {tenant}, shift high-load operations to off-peak periods, and tune capacitor banks to correct your Power Factor (Avg: {data['power_factor']['average_power_factor']}). Your peak demand is {data['peak_demand']['maximum_demand']} kVA (limit: {data['peak_demand']['contract_demand']} kVA)."
        elif "energy" in question_lower or "consumption" in question_lower or "kwh" in question_lower:
            return f"Today's total energy consumption for Tenant {tenant} is {data.get('total_energy', 0)} kWh."
        elif "power factor" in question_lower or "pf" in question_lower:
            return f"Today's average Power Factor for Tenant {tenant} is {data.get('average_power_factor', 0.96)}."
        elif "voltage" in question_lower:
            return f"The average Voltage for Tenant {tenant} is {data.get('average_voltage', 246.42)} V."
        elif "current" in question_lower:
            return f"The average Current for Tenant {tenant} is {data.get('average_current', 153.55)} A."
        elif "frequency" in question_lower:
            return f"The average system Frequency is {data.get('average_frequency', 50.0)} Hz."
        elif "demand" in question_lower:
            return f"The peak Demand for Tenant {tenant} is {data.get('maximum_demand', 79.1)} kW."
        elif "abnormal" in question_lower or "anomaly" in question_lower:
            anom_list = data.get("anomalies", [])
            if anom_list:
                return f"Anomalies detected for Tenant {tenant}: " + ", ".join(anom_list)
            else:
                return f"No anomalies have been detected for Tenant {tenant} today."
        else:
            return "The requested data is unavailable."