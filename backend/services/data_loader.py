from database.db import get_connection

def get_data(tenant_id):
    conn = get_connection()

    cursor = conn.cursor()

    cursor.execute(
        "SELECT * FROM telemetry WHERE tenant_id=?",
        (tenant_id,)
    )

    rows = cursor.fetchall()

    conn.close()

    return rows