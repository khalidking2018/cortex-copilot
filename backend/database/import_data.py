import sqlite3
import pandas as pd

# Connect to database
conn = sqlite3.connect("database/cortex.db")

# Read CSV files
tenant_a = pd.read_csv("../data/tenant_a.csv")
tenant_b = pd.read_csv("../data/tenant_b.csv")

# Add tenant_id column
tenant_a["tenant_id"] = "A"
tenant_b["tenant_id"] = "B"

# Save into SQLite
tenant_a.to_sql("telemetry", conn, if_exists="replace", index=False)
tenant_b.to_sql("telemetry", conn, if_exists="append", index=False)

conn.commit()
conn.close()

print("Database Imported Successfully!")