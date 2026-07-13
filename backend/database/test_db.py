import sqlite3

conn = sqlite3.connect("database/cortex.db")

cursor = conn.cursor()

cursor.execute("SELECT COUNT(*) FROM telemetry")

print(cursor.fetchone())

conn.close()