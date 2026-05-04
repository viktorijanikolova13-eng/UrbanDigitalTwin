import pandas as pd
import numpy as np
import joblib
from datetime import datetime

model = joblib.load("temperature_model.pkl")
le_zone = joblib.load("zone_encoder.pkl")
le_season = joblib.load("season_encoder.pkl")
FEATURES = joblib.load("feature_order.pkl")

SEASON_MAP = {
    12:"winter",1:"winter",2:"winter",
    3:"spring",4:"spring",5:"spring",
    6:"summer",7:"summer",8:"summer",
    9:"autumn",10:"autumn",11:"autumn"
}

def predict(input_data):

    dt = datetime.strptime(f"{input_data['date']} {input_data['time']}", "%Y-%m-%d %H:%M")

    month = dt.month
    season = SEASON_MAP[month]

    zone_enc = le_zone.transform([input_data["zone"]])[0]
    season_enc = le_season.transform([season])[0]

    h = input_data["temp_history"]

    row = {
        "zone_encoded": zone_enc,
        "season_encoded": season_enc,
        "humidity": input_data.get("humidity", 65.0),
        "wind_speed": input_data.get("wind_speed", 2.0),
        "precipitation": input_data.get("precipitation", 0.0),
        "pressure": input_data.get("pressure", 1013.0),
        "hour_sin": np.sin(2 * np.pi * dt.hour / 24),
        "hour_cos": np.cos(2 * np.pi * dt.hour / 24),
        "month_sin": np.sin(2 * np.pi * month / 12),
        "month_cos": np.cos(2 * np.pi * month / 12),
        "weekday": dt.weekday(),
        "temp_lag_1h": h[-1],
        "temp_lag_2h": h[-2],
        "temp_lag_3h": h[-3],
        "temp_lag_6h": h[-6],
        "temp_lag_12h": h[-12],
        "temp_lag_24h": h[-24],
        "temp_roll3": np.mean(h[-3:]),
        "temp_roll6": np.mean(h[-6:]),
        "temp_roll12": np.mean(h[-12:]),
        "temp_roll24": np.mean(h[-24:]),
        "temp_roll24_std": np.std(h[-24:])
    }

    df = pd.DataFrame([row])[FEATURES]

    predicted = float(model.predict(df)[0])
    current = h[-1]

    if predicted >= 38: risk = "КРИТИЧЕН"
    elif predicted >= 33: risk = "ВИСОК"
    elif predicted >= 28: risk = "УМЕРЕН"
    else: risk = "НИЗОК"

    return {
        "predicted_temperature_c": round(predicted,2),
        "current_temperature_c": round(current,2),
        "change_c": round(predicted-current,2),
        "heat_risk_level": risk,
        "season": season
    }