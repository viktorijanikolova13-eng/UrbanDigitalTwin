from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import date as DateType, datetime
import math

try:
    from predict_api import predict as temperature_model_predict
except Exception:
    temperature_model_predict = None

app = FastAPI(title="Urban Digital Twin API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ZONE_NAMES = [
    "Karpoš", "Kisela Voda", "Gazi Baba", "Centar",
    "Butel", "Aerodrom", "Čair", "Stara Čaršija"
]

ZONE_FACTORS = {
    "Karpoš": 0.96,
    "Kisela Voda": 1.08,
    "Gazi Baba": 1.14,
    "Centar": 1.10,
    "Butel": 0.98,
    "Aerodrom": 1.04,
    "Čair": 1.12,
    "Stara Čaršija": 1.06,
}

class PredictZonesRequest(BaseModel):
    date: Optional[str] = None
    time: Optional[str] = None
    zone: Optional[str] = None
    type: Optional[str] = "all"
    temperature: Optional[float] = None

class SimulateRequest(BaseModel):
    type: Optional[str] = "all"
    temperatureDelta: Optional[float] = 0
    trafficMultiplier: Optional[float] = 1
    pollutionMultiplier: Optional[float] = 1
    heatRiskLevel: Optional[str] = None

class PollutionRequest(BaseModel):
    temperature: float = 25
    humidity: float = 60
    wind_speed: float = 2
    traffic: float = 1
    hour: int = 12
    month: int = 5
    weekday: int = 0


def _parse_hour(time_value: Optional[str]) -> int:
    if not time_value:
        return 12
    try:
        return int(time_value.split(":")[0])
    except Exception:
        return 12


def _parse_month(date_value: Optional[str]) -> int:
    if not date_value:
        return datetime.now().month
    try:
        return datetime.strptime(date_value, "%Y-%m-%d").month
    except Exception:
        return datetime.now().month


def _risk_temperature(value: float) -> str:
    if value >= 38:
        return "CRITICAL"
    if value >= 33:
        return "HIGH"
    if value >= 28:
        return "MODERATE"
    return "LOW"


def _risk_pollution(value: float) -> str:
    if value >= 75:
        return "CRITICAL"
    if value >= 55:
        return "HIGH"
    if value >= 35:
        return "MODERATE"
    return "LOW"


def _risk_traffic(value: float) -> str:
    if value >= 1800:
        return "CRITICAL"
    if value >= 1400:
        return "HIGH"
    if value >= 900:
        return "MODERATE"
    return "LOW"


def _worst_risk(*risks: str) -> str:
    order = {"LOW": 0, "MODERATE": 1, "MEDIUM": 1, "HIGH": 2, "CRITICAL": 3}
    labels = ["LOW", "MODERATE", "HIGH", "CRITICAL"]
    max_value = max(order.get((r or "LOW").upper(), 0) for r in risks)
    return labels[max_value]


def _safe_temperature_prediction(zone: str, date_value: Optional[str], time_value: Optional[str], fallback_temp: Optional[float]) -> float:
    hour = _parse_hour(time_value)
    month = _parse_month(date_value)

    base = fallback_temp if fallback_temp is not None else 23 + 8 * math.sin((month - 3) / 12 * 2 * math.pi)
    daily = 4 * math.sin((hour - 7) / 24 * 2 * math.pi)
    factor = ZONE_FACTORS.get(zone, 1)
    estimated = base + daily + (factor - 1) * 4

    if temperature_model_predict is None:
        return round(estimated, 2)

    # The trained temperature model expects a concrete zone, date, time and 24 historical values.
    # If anything fails, frontend still receives valid data instead of HTTP 500.
    try:
        date_for_model = date_value or DateType.today().isoformat()
        time_for_model = time_value or "12:00"
        history = [round(estimated - 1.2 + i * 0.05, 2) for i in range(24)]
        model_response = temperature_model_predict({
            "date": date_for_model,
            "time": time_for_model,
            "zone": zone,
            "temp_history": history,
            "humidity": 65.0,
            "wind_speed": 2.0,
            "precipitation": 0.0,
            "pressure": 1013.0,
        })
        return round(float(model_response.get("predicted_temperature_c", estimated)), 2)
    except Exception:
        return round(estimated, 2)


def _zone_prediction(zone: str, body: PredictZonesRequest) -> Dict[str, Any]:
    hour = _parse_hour(body.time)
    factor = ZONE_FACTORS.get(zone, 1)

    temp = _safe_temperature_prediction(zone, body.date, body.time, body.temperature)
    traffic_daily_factor = 1.25 if hour in [8, 9, 16, 17, 18] else 0.75 if hour in [22, 23, 0, 1, 2, 3, 4, 5] else 1.0
    traffic = round(900 * factor * traffic_daily_factor)
    pollution = round((22 + traffic / 55 + max(temp - 25, 0) * 1.15) * factor, 2)

    heat_risk = _risk_temperature(temp)
    air_risk = _risk_pollution(pollution)
    traffic_risk = _risk_traffic(traffic)

    requested_type = (body.type or "all").lower()

    return {
        "zoneName": zone,
        "predictedTemperature": temp if requested_type in ["all", "temperature"] else None,
        "predictedPollution": pollution if requested_type in ["all", "pollution"] else None,
        "predictedTraffic": traffic if requested_type in ["all", "traffic"] else None,
        "heatRiskLevel": heat_risk if requested_type in ["all", "temperature"] else None,
        "airRiskLevel": air_risk if requested_type in ["all", "pollution"] else None,
        "trafficRiskLevel": traffic_risk if requested_type in ["all", "traffic"] else None,
        "overallRiskLevel": _worst_risk(heat_risk, air_risk, traffic_risk),
        "lastUpdated": datetime.now().isoformat(timespec="seconds"),
    }


def _summary(zones: List[Dict[str, Any]]) -> Dict[str, Any]:
    def avg(key: str):
        vals = [z[key] for z in zones if z.get(key) is not None]
        return round(sum(vals) / len(vals), 2) if vals else None

    return {
        "predictedTemperature": avg("predictedTemperature"),
        "predictedPollution": avg("predictedPollution"),
        "predictedTraffic": avg("predictedTraffic"),
        "heatRiskLevel": _worst_risk(*[z.get("heatRiskLevel") for z in zones if z.get("heatRiskLevel")]),
        "airRiskLevel": _worst_risk(*[z.get("airRiskLevel") for z in zones if z.get("airRiskLevel")]),
        "trafficRiskLevel": _worst_risk(*[z.get("trafficRiskLevel") for z in zones if z.get("trafficRiskLevel")]),
        "overallRiskLevel": _worst_risk(*[z.get("overallRiskLevel") for z in zones]),
        "generatedAt": datetime.now().isoformat(timespec="seconds"),
    }


@app.get("/")
def health():
    return {"status": "ok", "message": "Urban Digital Twin API is running"}


@app.post("/api/predict/zones")
def predict_zones(body: PredictZonesRequest):
    zones = [body.zone] if body.zone else ZONE_NAMES
    zones = [z for z in zones if z in ZONE_NAMES]
    return [_zone_prediction(zone, body) for zone in zones]


@app.post("/api/predict")
def predict_summary(body: PredictZonesRequest):
    return _summary(predict_zones(body))


@app.post("/api/simulate/zones")
def simulate_zones(body: SimulateRequest):
    base_request = PredictZonesRequest(type="all")
    zones = []
    temp_delta = body.temperatureDelta or 0
    traffic_multiplier = body.trafficMultiplier if body.trafficMultiplier not in [None, 0] else 1
    pollution_multiplier = body.pollutionMultiplier if body.pollutionMultiplier not in [None, 0] else 1

    for zone in ZONE_NAMES:
        z = _zone_prediction(zone, base_request)
        z["predictedTemperature"] = round((z["predictedTemperature"] or 0) + temp_delta, 2)
        z["predictedTraffic"] = round((z["predictedTraffic"] or 0) * traffic_multiplier)
        z["predictedPollution"] = round((z["predictedPollution"] or 0) * pollution_multiplier, 2)

        z["heatRiskLevel"] = (body.heatRiskLevel or _risk_temperature(z["predictedTemperature"])).upper()
        z["airRiskLevel"] = _risk_pollution(z["predictedPollution"])
        z["trafficRiskLevel"] = _risk_traffic(z["predictedTraffic"])
        z["overallRiskLevel"] = _worst_risk(z["heatRiskLevel"], z["airRiskLevel"], z["trafficRiskLevel"])
        zones.append(z)

    return zones


@app.post("/api/simulate")
def simulate_summary(body: SimulateRequest):
    return _summary(simulate_zones(body))


@app.post("/predict/pollution")
def predict_pollution(request: PollutionRequest):
    prediction = 20 + request.traffic * 25 + request.humidity * 0.12 - request.wind_speed * 2.3
    return {"predictedPm25": round(prediction, 2)}


@app.post("/predict/temperature")
def predict_temperature(input_data: dict):
    if temperature_model_predict is None:
        return {"error": "Temperature model is not loaded"}
    return temperature_model_predict(input_data)

class AuthRequest(BaseModel):
    username: str
    password: str


@app.post("/api/auth/register")
def register_user(request: AuthRequest):
    return {
        "token": "demo-token",
        "username": request.username,
        "role": "USER"
    }


@app.post("/api/auth/login")
def login_user(request: AuthRequest):
    return {
        "token": "demo-token",
        "username": request.username,
        "role": "USER"
    }

@app.get("/api/auth/me")
def get_current_user():
    return {
        "username": "tim24",
        "role": "USER"
    }