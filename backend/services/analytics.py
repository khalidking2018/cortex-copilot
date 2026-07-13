# Analytics calculations service
import pandas as pd

def calculate_basic_metrics(df: pd.DataFrame) -> dict:
    # Add metric calculation logic here
    return {
        "row_count": len(df),
        "columns": list(df.columns)
    }
