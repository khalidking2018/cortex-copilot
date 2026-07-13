from database.db import get_connection

def dashboard(tenant_id):

    conn = get_connection()

    cursor = conn.cursor()

    cursor.execute("""
        SELECT
        COUNT(*) as total_records,
        AVG(ABS(True_PF_Avg)),
        AVG(VLL_Avg),
        AVG(I_Total),
        MAX(VA_Total),
        AVG(Watts_Total),
        AVG(Frequency_Hz),
        AVG(VA_Total)

        FROM telemetry

        WHERE tenant_id=?
    """,(tenant_id,))

    row = cursor.fetchone()

    conn.close()

    return {
        "Total Records": row[0],
        "Average PF": round(row[1],2) if row[1] is not None else 0,
        "Average Voltage": round(row[2],2) if row[2] is not None else 0,
        "Average Current": round(row[3],2) if row[3] is not None else 0,
        "Maximum Demand": round((row[4] or 0) / 1000.0, 2),
        "Average Power": round((row[5] or 0) / 1000.0, 2),
        "Average Frequency": round(row[6],2) if row[6] is not None else 0,
        "Average Apparent Power": round((row[7] or 0) / 1000.0, 2)
    }