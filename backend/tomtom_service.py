"""
Skopje Real-time Traffic Service — TomTom integration
=======================================================
Start:
    uvicorn tomtom_service:app --host 0.0.0.0 --port 8001 --reload

Requires TOMTOM_API_KEY in backend/.env  (or as env var).
Without a key, every zone returns the statistical fallback value.
"""

import os
import math
import asyncio
import time
from typing import Optional

import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

_raw_key   = os.getenv("TOMTOM_API_KEY", "").strip()
_PLACEHOLDERS = ("YOUR_", "your_", "TOMTOM_API_KEY_HERE", "xxxxxxxx", "example")
TOMTOM_KEY = "" if any(p in _raw_key for p in _PLACEHOLDERS) else _raw_key
FLOW_URL   = "https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json"

# ── Zone definitions ──────────────────────────────────────────────
# lat/lon = center point fed to TomTom's flowSegmentData endpoint
# base/morn/eve/lunch/wknd = statistical fallback parameters

ZONES = {
    "Центар":       {"lat":41.9965,"lon":21.4314,"base":42,"morn":88,"eve":92,"lunch":65,"wknd":60},
    "Карпош":       {"lat":41.9992,"lon":21.3952,"base":30,"morn":72,"eve":78,"lunch":48,"wknd":45},
    "Аеродром":     {"lat":41.9735,"lon":21.4385,"base":27,"morn":62,"eve":68,"lunch":42,"wknd":40},
    "Гази Баба":    {"lat":41.9988,"lon":21.4828,"base":24,"morn":58,"eve":64,"lunch":38,"wknd":36},
    "Чаир":         {"lat":42.0095,"lon":21.4450,"base":36,"morn":74,"eve":80,"lunch":55,"wknd":50},
    "Ѓорче Петров": {"lat":41.9975,"lon":21.3625,"base":19,"morn":50,"eve":56,"lunch":30,"wknd":28},
    "Сарај":        {"lat":41.9715,"lon":21.3288,"base":13,"morn":35,"eve":40,"lunch":18,"wknd":20},
    "Кисела Вода":  {"lat":41.9645,"lon":21.4748,"base":23,"morn":54,"eve":60,"lunch":36,"wknd":34},
    "Бутел":        {"lat":42.0228,"lon":21.4348,"base":17,"morn":45,"eve":50,"lunch":28,"wknd":26},
    "Шуто Оризари": {"lat":42.0382,"lon":21.4655,"base":10,"morn":28,"eve":32,"lunch":15,"wknd":15},
}

# ── Simple in-memory cache (ttl = 2 minutes) ──────────────────────
_cache: dict = {}
CACHE_TTL = 120  # seconds


def _cache_key(hour: int, weekday: int) -> str:
    return f"{hour}_{weekday}"


def _cache_get(hour: int, weekday: int) -> Optional[list]:
    key = _cache_key(hour, weekday)
    entry = _cache.get(key)
    if entry and (time.time() - entry["ts"]) < CACHE_TTL:
        return entry["data"]
    return None


def _cache_set(hour: int, weekday: int, data: list):
    _cache[_cache_key(hour, weekday)] = {"ts": time.time(), "data": data}


# ── Statistical fallback model (matches riskCalc.js exactly) ─────
def statistical_risk(zone_name: str, hour: int, weekday: int) -> int:
    r = ZONES.get(zone_name)
    if not r:
        return 0
    is_we = weekday >= 5
    if is_we:
        if 10 <= hour <= 14:
            k = 1.0 if hour == 12 else (0.9 if hour in (11, 13) else 0.75)
            score = r["base"] + (r["wknd"] - r["base"]) * k
        elif 18 <= hour <= 21:
            k = 0.85 if hour == 19 else (0.65 if hour == 18 else 0.5)
            score = r["base"] + (r["wknd"] - r["base"]) * k
        elif hour >= 22 or hour < 6:
            score = r["base"] * 0.18
        elif hour < 10:
            score = r["base"] * 0.6
        else:
            score = r["base"] * 0.72
    else:
        k_morn = {7: 0.75, 8: 1.0, 9: 0.85}
        k_eve  = {16: 0.65, 17: 1.0, 18: 0.88, 19: 0.6}
        if 7 <= hour <= 9:
            score = r["base"] + (r["morn"] - r["base"]) * k_morn.get(hour, 0.7)
        elif 16 <= hour <= 19:
            score = r["base"] + (r["eve"] - r["base"]) * k_eve.get(hour, 0.5)
        elif hour in (12, 13):
            score = r["base"] + (r["lunch"] - r["base"]) * (0.9 if hour == 12 else 0.7)
        elif hour >= 22 or hour < 5:
            score = r["base"] * 0.14
        elif hour < 7:
            score = r["base"] * 0.4
        else:
            score = r["base"] * 1.0

    return int(min(100, max(0, round(score))))


def score_to_level(score: int) -> str:
    if score < 25: return "НИЗОК"
    if score < 50: return "УМЕРЕН"
    if score < 75: return "ВИСОК"
    return "КРИТИЧЕН"


# ── TomTom fetch for a single zone ───────────────────────────────
async def fetch_zone_flow(client: httpx.AsyncClient, zone_name: str) -> Optional[dict]:
    """
    Query TomTom Traffic Flow Segment Data API for a zone center point.
    Returns parsed flow dict or None on failure.
    """
    z = ZONES[zone_name]
    try:
        resp = await client.get(
            FLOW_URL,
            params={
                "key":   TOMTOM_KEY,
                "point": f"{z['lat']},{z['lon']}",
                "unit":  "KMPH",
            },
            timeout=6.0,
        )
        if resp.status_code != 200:
            return None
        fd = resp.json().get("flowSegmentData", {})
        current   = fd.get("currentSpeed", 0)
        free_flow = fd.get("freeFlowSpeed", 1)
        confidence = fd.get("confidence", 0)
        road_closure = fd.get("roadClosure", False)

        if road_closure:
            return {"congestion": 1.0, "current_speed": 0, "free_flow_speed": free_flow, "confidence": confidence}

        congestion  = max(0.0, 1.0 - current / max(free_flow, 1))
        risk_score  = min(100, round(congestion * 120))  # amplify slightly for urban context

        return {
            "congestion":      round(congestion, 3),
            "current_speed":   current,
            "free_flow_speed": free_flow,
            "risk_score":      risk_score,
            "confidence":      confidence,
            "road_closure":    road_closure,
        }
    except Exception:
        return None


# ── FastAPI app ───────────────────────────────────────────────────
app = FastAPI(title="Skopje Traffic Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_methods=["GET"],
    allow_headers=["*"],
)


class ZoneResult(BaseModel):
    zone:            str
    risk_score:      int
    risk_level:      str
    source:          str          # "tomtom" | "statistical"
    current_speed:   Optional[float] = None
    free_flow_speed: Optional[float] = None
    congestion:      Optional[float] = None
    confidence:      Optional[float] = None


@app.get("/traffic/realtime", response_model=list[ZoneResult])
async def get_realtime_traffic(hour: int = 12, weekday: int = 0):
    """
    Returns traffic risk for all 10 Skopje zones.

    - If TOMTOM_API_KEY is set: fetches live data from TomTom Flow API,
      falls back zone-by-zone to statistical model on TomTom error.
    - If TOMTOM_API_KEY is not set: returns pure statistical predictions.

    hour:    0-23
    weekday: 0=Mon … 6=Sun
    """
    # Return cached result if available
    cached = _cache_get(hour, weekday)
    if cached:
        return cached

    results: list[ZoneResult] = []

    if not TOMTOM_KEY:
        # No API key — full statistical
        for name in ZONES:
            score = statistical_risk(name, hour, weekday)
            results.append(ZoneResult(
                zone=name, risk_score=score,
                risk_level=score_to_level(score), source="statistical",
            ))
        _cache_set(hour, weekday, results)
        return results

    # Fetch all zones in parallel via TomTom
    async with httpx.AsyncClient() as client:
        tasks = {name: fetch_zone_flow(client, name) for name in ZONES}
        flow_data = dict(zip(tasks.keys(), await asyncio.gather(*tasks.values())))

    for name in ZONES:
        fd = flow_data.get(name)
        if fd:
            results.append(ZoneResult(
                zone=name,
                risk_score=fd["risk_score"],
                risk_level=score_to_level(fd["risk_score"]),
                source="tomtom",
                current_speed=fd.get("current_speed"),
                free_flow_speed=fd.get("free_flow_speed"),
                congestion=fd.get("congestion"),
                confidence=fd.get("confidence"),
            ))
        else:
            # TomTom failed for this zone — use statistical fallback
            score = statistical_risk(name, hour, weekday)
            results.append(ZoneResult(
                zone=name, risk_score=score,
                risk_level=score_to_level(score), source="statistical",
            ))

    _cache_set(hour, weekday, results)
    return results


@app.get("/health")
def health():
    return {
        "status":             "ok",
        "tomtom_configured":  bool(TOMTOM_KEY),
        "tomtom_key_hint":    f"{TOMTOM_KEY[:6]}…" if TOMTOM_KEY else "NOT SET — edit backend/.env",
        "zones":              list(ZONES.keys()),
    }
