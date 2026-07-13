from database.db import get_connection


def get_range_sql(range_val):
    # May 19, 2026 to July 4, 2026.
    # Today = July 4, 2026.
    if range_val == "week":
        return "Date >= '2026-06-28'", 7
    elif range_val == "month":
        return "Date LIKE '2026-07-%'", 4
    elif range_val == "last_month":
        return "Date LIKE '2026-06-%'", 30
    else:
        return "Date = '2026-07-04'", 1


def calculate_energy(tenant_id, range_val="today"):
    conn = get_connection()
    cursor = conn.cursor()
    date_cond, num_days = get_range_sql(range_val)
    cursor.execute(f"""
        SELECT SUM(Wh_Received), AVG(Watts_Total), MAX(Watts_Total)
        FROM telemetry
        WHERE tenant_id=? AND {date_cond}
    """, (tenant_id,))

    result = cursor.fetchone()
    conn.close()

    sum_wh = result[0] or 0
    avg_watts = result[1] or 0
    max_watts = result[2] or 0

    total_energy_kwh = round(sum_wh / 1000000.0, 2)
    load_factor = round((avg_watts / max_watts) * 100.0, 2) if max_watts > 0 else 0.0

    return {
        "tenant": tenant_id,
        "total_energy": total_energy_kwh,
        "load_factor": load_factor
    }


def calculate_power_factor(tenant_id, range_val="today"):
    conn = get_connection()
    cursor = conn.cursor()
    date_cond, _ = get_range_sql(range_val)
    cursor.execute(f"""
        SELECT AVG(ABS(True_PF_Avg))
        FROM telemetry
        WHERE tenant_id=? AND {date_cond}
    """, (tenant_id,))

    result = cursor.fetchone()
    conn.close()

    return {
        "tenant": tenant_id,
        "average_power_factor": round(result[0] or 0, 2)
    }


def calculate_voltage(tenant_id, range_val="today"):
    conn = get_connection()
    cursor = conn.cursor()
    date_cond, _ = get_range_sql(range_val)
    cursor.execute(f"""
        SELECT AVG(VLL_Avg), AVG(VLN_Avg), AVG(V_R), AVG(V_Y), AVG(V_B)
        FROM telemetry
        WHERE tenant_id=? AND {date_cond}
    """, (tenant_id,))

    result = cursor.fetchone()
    conn.close()

    return {
        "tenant": tenant_id,
        "average_voltage": round(result[0] or 0, 2),
        "average_vln": round(result[1] or 0, 2),
        "phase_r": round(result[2] or 0, 2),
        "phase_y": round(result[3] or 0, 2),
        "phase_b": round(result[4] or 0, 2)
    }


def calculate_current(tenant_id, range_val="today"):
    conn = get_connection()
    cursor = conn.cursor()
    date_cond, _ = get_range_sql(range_val)
    cursor.execute(f"""
        SELECT AVG(I_Total), AVG(I_R), AVG(I_Y), AVG(I_B)
        FROM telemetry
        WHERE tenant_id=? AND {date_cond}
    """, (tenant_id,))

    result = cursor.fetchone()
    conn.close()

    return {
        "tenant": tenant_id,
        "average_current": round(result[0] or 0, 2),
        "phase_r": round(result[1] or 0, 2),
        "phase_y": round(result[2] or 0, 2),
        "phase_b": round(result[3] or 0, 2)
    }


def calculate_frequency(tenant_id, range_val="today"):
    conn = get_connection()
    cursor = conn.cursor()
    date_cond, _ = get_range_sql(range_val)
    cursor.execute(f"""
        SELECT AVG(Frequency_Hz)
        FROM telemetry
        WHERE tenant_id=? AND {date_cond}
    """, (tenant_id,))

    result = cursor.fetchone()
    conn.close()

    return {
        "tenant": tenant_id,
        "average_frequency": round(result[0] or 0, 2)
    }


def calculate_max_demand(tenant_id, range_val="today"):
    conn = get_connection()
    cursor = conn.cursor()
    date_cond, _ = get_range_sql(range_val)
    cursor.execute(f"""
        SELECT MAX(VA_Total)
        FROM telemetry
        WHERE tenant_id=? AND {date_cond}
    """, (tenant_id,))

    result = cursor.fetchone()
    conn.close()

    peak_kva = round((result[0] or 0) / 1000.0, 2)
    cd = 1501.0
    utilisation = round((peak_kva / cd) * 100.0, 2)

    return {
        "tenant": tenant_id,
        "peak_demand_kva": peak_kva,
        "contract_demand": cd,
        "utilisation": utilisation
    }


def detect_anomalies(tenant_id):
    conn = get_connection()
    cursor = conn.cursor()

    anomalies = []

    # Low Power Factor
    cursor.execute("""
        SELECT COUNT(*)
        FROM telemetry
        WHERE tenant_id=? AND True_PF_Avg < 0.9
    """, (tenant_id,))
    pf = cursor.fetchone()[0]

    if pf > 0:
        anomalies.append(f"Low Power Factor detected ({pf} records)")

    # High Voltage
    cursor.execute("""
        SELECT COUNT(*)
        FROM telemetry
        WHERE tenant_id=? AND VLL_Avg > 440
    """, (tenant_id,))
    volt = cursor.fetchone()[0]

    if volt > 0:
        anomalies.append(f"High Voltage detected ({volt} records)")

    # High Frequency
    cursor.execute("""
        SELECT COUNT(*)
        FROM telemetry
        WHERE tenant_id=? AND Frequency_Hz > 50.5
    """, (tenant_id,))
    freq = cursor.fetchone()[0]

    if freq > 0:
        anomalies.append(f"High Frequency detected ({freq} records)")

    # High Demand
    cursor.execute("""
        SELECT COUNT(*)
        FROM telemetry
        WHERE tenant_id=? AND (Watts_Total / 1000.0) > 1000
    """, (tenant_id,))
    demand_anom = cursor.fetchone()[0]

    if demand_anom > 0:
        anomalies.append(f"High Demand detected ({demand_anom} records)")

    conn.close()

    return {
        "tenant": tenant_id,
        "anomalies": anomalies
    }



def get_powerfactor_chart(tenant_id, range_val="today"):
    conn = get_connection()
    cursor = conn.cursor()
    date_cond, _ = get_range_sql(range_val)
    if range_val == "today":
        cursor.execute(f"""
            SELECT Time, True_PF_Avg
            FROM telemetry
            WHERE tenant_id=? AND {date_cond}
            ORDER BY Time DESC
            LIMIT 24
        """, (tenant_id,))
        rows = cursor.fetchall()
        conn.close()
        rows = list(rows)
        rows.reverse()
        data = []
        for row in rows:
            data.append({
                "time": row[0][:5],
                "pf": round(abs(row[1] or 0), 2)
            })
    else:
        cursor.execute(f"""
            SELECT Date, AVG(ABS(True_PF_Avg))
            FROM telemetry
            WHERE tenant_id=? AND {date_cond}
            GROUP BY Date
            ORDER BY Date ASC
        """, (tenant_id,))
        rows = cursor.fetchall()
        conn.close()
        data = []
        for row in rows:
            data.append({
                "time": row[0][5:],
                "pf": round(row[1] or 0, 2)
            })
    return data


def get_voltage_chart(tenant_id, range_val="today"):
    conn = get_connection()
    cursor = conn.cursor()
    date_cond, _ = get_range_sql(range_val)
    if range_val == "today":
        cursor.execute(f"""
            SELECT Time, V_R, V_Y, V_B, VLN_Avg
            FROM telemetry
            WHERE tenant_id=? AND {date_cond}
            ORDER BY Time DESC
            LIMIT 24
        """, (tenant_id,))
        rows = cursor.fetchall()
        conn.close()
        rows = list(rows)
        rows.reverse()
        data = []
        for row in rows:
            data.append({
                "time": row[0][:5],
                "R": round(row[1] or 0, 2),
                "Y": round(row[2] or 0, 2),
                "B": round(row[3] or 0, 2),
                "Avg": round(row[4] or 0, 2)
            })
    else:
        cursor.execute(f"""
            SELECT Date, AVG(V_R), AVG(V_Y), AVG(V_B), AVG(VLN_Avg)
            FROM telemetry
            WHERE tenant_id=? AND {date_cond}
            GROUP BY Date
            ORDER BY Date ASC
        """, (tenant_id,))
        rows = cursor.fetchall()
        conn.close()
        data = []
        for row in rows:
            data.append({
                "time": row[0][5:],
                "R": round(row[1] or 0, 2),
                "Y": round(row[2] or 0, 2),
                "B": round(row[3] or 0, 2),
                "Avg": round(row[4] or 0, 2)
            })
    return data


def get_current_chart(tenant_id, range_val="today"):
    conn = get_connection()
    cursor = conn.cursor()
    date_cond, _ = get_range_sql(range_val)
    if range_val == "today":
        cursor.execute(f"""
            SELECT Time, I_R, I_Y, I_B, I_Total
            FROM telemetry
            WHERE tenant_id=? AND {date_cond}
            ORDER BY Time DESC
            LIMIT 24
        """, (tenant_id,))
        rows = cursor.fetchall()
        conn.close()
        rows = list(rows)
        rows.reverse()
        data = []
        for row in rows:
            data.append({
                "time": row[0][:5],
                "R": round(row[1] or 0, 2),
                "Y": round(row[2] or 0, 2),
                "B": round(row[3] or 0, 2),
                "Avg": round(row[4] or 0, 2)
            })
    else:
        cursor.execute(f"""
            SELECT Date, AVG(I_R), AVG(I_Y), AVG(I_B), AVG(I_Total)
            FROM telemetry
            WHERE tenant_id=? AND {date_cond}
            GROUP BY Date
            ORDER BY Date ASC
        """, (tenant_id,))
        rows = cursor.fetchall()
        conn.close()
        data = []
        for row in rows:
            data.append({
                "time": row[0][5:],
                "R": round(row[1] or 0, 2),
                "Y": round(row[2] or 0, 2),
                "B": round(row[3] or 0, 2),
                "Avg": round(row[4] or 0, 2)
            })
    return data


def get_energy_chart(tenant_id, range_val="today"):
    conn = get_connection()
    cursor = conn.cursor()
    date_cond, _ = get_range_sql(range_val)
    cursor.execute(f"SELECT MAX(Watts_Total) FROM telemetry WHERE tenant_id=? AND {date_cond}", (tenant_id,))
    peak_watts = cursor.fetchone()[0] or 1.0
    peak_kW = peak_watts / 1000.0

    if range_val == "today":
        cursor.execute(f"""
            SELECT Time, Watts_Total
            FROM telemetry
            WHERE tenant_id=? AND {date_cond}
            ORDER BY Time DESC
            LIMIT 24
        """, (tenant_id,))
        rows = cursor.fetchall()
        conn.close()
        rows = list(rows)
        rows.reverse()
        data = []
        for row in rows:
            kw = (row[1] or 0) / 1000.0
            lf = (kw / peak_kW) * 100.0 if peak_kW > 0 else 0
            data.append({
                "time": row[0][:5],
                "val": round(lf, 2)
            })
    else:
        cursor.execute(f"""
            SELECT Date, AVG(Watts_Total)
            FROM telemetry
            WHERE tenant_id=? AND {date_cond}
            GROUP BY Date
            ORDER BY Date ASC
        """, (tenant_id,))
        rows = cursor.fetchall()
        conn.close()
        data = []
        for row in rows:
            kw = (row[1] or 0) / 1000.0
            lf = (kw / peak_kW) * 100.0 if peak_kW > 0 else 0
            data.append({
                "time": row[0][5:],
                "val": round(lf, 2)
            })
    return data


def get_power_chart(tenant_id, range_val="today"):
    conn = get_connection()
    cursor = conn.cursor()
    date_cond, _ = get_range_sql(range_val)
    if range_val == "today":
        cursor.execute(f"""
            SELECT Time, Watts_Total, VA_Total
            FROM telemetry
            WHERE tenant_id=? AND {date_cond}
            ORDER BY Time DESC
            LIMIT 24
        """, (tenant_id,))
        rows = cursor.fetchall()
        conn.close()
        rows = list(rows)
        rows.reverse()
        data = []
        for row in rows:
            data.append({
                "time": row[0][:5],
                "kW": round((row[1] or 0) / 1000.0, 2),
                "kVA": round((row[2] or 0) / 1000.0, 2)
            })
    else:
        cursor.execute(f"""
            SELECT Date, AVG(Watts_Total), AVG(VA_Total)
            FROM telemetry
            WHERE tenant_id=? AND {date_cond}
            GROUP BY Date
            ORDER BY Date ASC
        """, (tenant_id,))
        rows = cursor.fetchall()
        conn.close()
        data = []
        for row in rows:
            data.append({
                "time": row[0][5:],
                "kW": round((row[1] or 0) / 1000.0, 2),
                "kVA": round((row[2] or 0) / 1000.0, 2)
            })
    return data


def get_demand_chart(tenant_id, range_val="today"):
    conn = get_connection()
    cursor = conn.cursor()
    date_cond, _ = get_range_sql(range_val)
    cd = 1501.0
    if range_val == "today":
        cursor.execute(f"""
            SELECT Time, VA_Total
            FROM telemetry
            WHERE tenant_id=? AND {date_cond}
            ORDER BY Time DESC
            LIMIT 24
        """, (tenant_id,))
        rows = cursor.fetchall()
        conn.close()
        rows = list(rows)
        rows.reverse()
        data = []
        for row in rows:
            data.append({
                "time": row[0][:5],
                "val": round(((row[1] or 0) / 1000.0) / cd * 100.0, 2)
            })
    else:
        cursor.execute(f"""
            SELECT Date, MAX(VA_Total)
            FROM telemetry
            WHERE tenant_id=? AND {date_cond}
            GROUP BY Date
            ORDER BY Date ASC
        """, (tenant_id,))
        rows = cursor.fetchall()
    conn.close()
    rows = list(rows)
    rows.reverse()
    data = []
    for row in rows:
        data.append({
            "time": row[0][:5],
            "val": round(((row[1] or 0) / 1000.0) / cd * 100.0, 2)
        })
    return data


def calculate_billing(tenant_id, month=None):
    conn = get_connection()
    cursor = conn.cursor()
    
    date_filter = ""
    params = [tenant_id]
    if month:
        date_filter = " AND Date LIKE ?"
        params.append(f"{month}-%")

    # 1. Off-Peak VAh (22:00 to 06:00)
    query_off_peak = f"""
        SELECT SUM(VAh_Received) FROM telemetry 
        WHERE tenant_id=? AND (Time >= '22:00:00' OR Time < '06:00:00'){date_filter}
    """
    cursor.execute(query_off_peak, tuple(params))
    off_peak_vah = cursor.fetchone()[0] or 0

    # 2. Normal VAh (10:00 to 18:00)
    query_normal = f"""
        SELECT SUM(VAh_Received) FROM telemetry 
        WHERE tenant_id=? AND (Time >= '10:00:00' AND Time < '18:00:00'){date_filter}
    """
    cursor.execute(query_normal, tuple(params))
    normal_vah = cursor.fetchone()[0] or 0

    # 3. Peak VAh (06:00 to 10:00, 18:00 to 22:00)
    query_peak = f"""
        SELECT SUM(VAh_Received) FROM telemetry 
        WHERE tenant_id=? AND (
            (Time >= '06:00:00' AND Time < '10:00:00') OR 
            (Time >= '18:00:00' AND Time < '22:00:00')
        ){date_filter}
    """
    cursor.execute(query_peak, tuple(params))
    peak_vah = cursor.fetchone()[0] or 0

    # 4. Max Apparent Power (Max Demand)
    query_max_va = f"""
        SELECT MAX(VA_Total) FROM telemetry 
        WHERE tenant_id=?{date_filter}
    """
    cursor.execute(query_max_va, tuple(params))
    max_va = cursor.fetchone()[0] or 0

    conn.close()

    # Convert to kVAh (telemetry scale factor 10^6)
    off_peak_kvah = off_peak_vah / 1000000.0
    normal_kvah = normal_vah / 1000000.0
    peak_kvah = peak_vah / 1000000.0
    total_kvah = off_peak_kvah + normal_kvah + peak_kvah
    max_demand_kva = max_va / 1000.0

    # Tariff rates: Off-Peak (6.65), Normal (7.15), Peak (8.65)
    off_peak_charges = off_peak_kvah * 6.65
    normal_charges = normal_kvah * 7.15
    peak_charges = peak_kvah * 8.65
    energy_charges = off_peak_charges + normal_charges + peak_charges

    # Electricity duty (6 paise/kVAh)
    electricity_duty = total_kvah * 0.06
    customer_charges = 3500.0

    # Demand charges (CD = 1501 kVA. Min chargeable = 1201 kVA. Normal: 500/kVA. Penal: 1000/kVA)
    chargeable_demand = max(max_demand_kva, 1201.0)
    normal_demand_charge = min(chargeable_demand, 1501.0) * 500.0
    penal_demand_charge = max(0.0, max_demand_kva - 1501.0) * 1000.0
    total_demand_charge = normal_demand_charge + penal_demand_charge

    subtotal_bill = energy_charges + electricity_duty + total_demand_charge + customer_charges
    late_payment_surcharge = subtotal_bill * 0.0125
    grand_total = subtotal_bill + late_payment_surcharge

    return {
        "tenant": tenant_id,
        "month": month,
        "off_peak_kvah": int(round(off_peak_kvah)),
        "normal_kvah": int(round(normal_kvah)),
        "peak_kvah": int(round(peak_kvah)),
        "total_kvah": int(round(total_kvah)),
        "max_demand_kva": int(round(max_demand_kva)),
        "chargeable_demand_kva": int(round(chargeable_demand)),
        "energy_charges": int(round(energy_charges)),
        "electricity_duty": int(round(electricity_duty)),
        "normal_demand_charge": int(round(normal_demand_charge)),
        "penal_demand_charge": int(round(penal_demand_charge)),
        "total_demand_charge": int(round(total_demand_charge)),
        "customer_charges": int(round(customer_charges)),
        "subtotal_bill": int(round(subtotal_bill)),
        "late_payment_surcharge": int(round(late_payment_surcharge)),
        "total_bill": int(round(subtotal_bill)), # Maintained for backward compatibility
        "grand_total": int(round(grand_total))
    }



def calculate_power(tenant_id, range_val="today"):
    conn = get_connection()
    cursor = conn.cursor()
    date_cond, _ = get_range_sql(range_val)
    cursor.execute(f"""
        SELECT AVG(Watts_Total), AVG(VA_Total)
        FROM telemetry
        WHERE tenant_id=? AND {date_cond}
    """, (tenant_id,))
    result = cursor.fetchone()
    conn.close()
    return {
        "tenant": tenant_id,
        "average_active_power": round((result[0] or 0) / 1000.0, 2),
        "average_apparent_power": round((result[1] or 0) / 1000.0, 2)
    }


def get_thd_metrics(tenant_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT AVG(V_R_THD_Pct), AVG(V_Y_THD_Pct), AVG(V_B_THD_Pct),
               AVG(I_R_THD_Pct), AVG(I_Y_THD_Pct), AVG(I_B_THD_Pct)
        FROM telemetry
        WHERE tenant_id=?
    """, (tenant_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return {"message": "No THD data found."}
    return {
        "tenant": tenant_id,
        "average_voltage_thd_pct": {
            "phase_r": round(row[0] or 0, 2),
            "phase_y": round(row[1] or 0, 2),
            "phase_b": round(row[2] or 0, 2)
        },
        "average_current_thd_pct": {
            "phase_r": round(row[3] or 0, 2),
            "phase_y": round(row[4] or 0, 2),
            "phase_b": round(row[5] or 0, 2)
        }
    }


def get_peak_usage_times(tenant_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT Date, Time, Watts_Total
        FROM telemetry
        WHERE tenant_id=?
        ORDER BY Watts_Total DESC
        LIMIT 5
    """, (tenant_id,))
    rows = cursor.fetchall()
    conn.close()
    return [
        {
            "date": r[0],
            "time": r[1][:5],
            "active_power_kw": round((r[2] or 0) / 1000.0, 2)
        }
        for r in rows
    ]


def get_low_pf_events(tenant_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT Date, Time, True_PF_Avg, VAR_Total, Watts_Total
        FROM telemetry
        WHERE tenant_id=? AND ABS(True_PF_Avg) < 0.95
        ORDER BY Date DESC, Time DESC
        LIMIT 5
    """, (tenant_id,))
    rows = cursor.fetchall()
    conn.close()
    return [
        {
            "date": r[0],
            "time": r[1][:5],
            "pf": round(abs(r[2] or 0), 2),
            "reactive_power_kvar": round((r[3] or 0) / 1000.0, 2),
            "active_power_kw": round((r[4] or 0) / 1000.0, 2)
        }
        for r in rows
    ]
