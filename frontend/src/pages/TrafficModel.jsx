import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { FaSyncAlt, FaFileExport } from "react-icons/fa";
import "leaflet/dist/leaflet.css";
import "../styles/TrafficModel.css";

// ── Map center ────────────────────────────────────────────────────
const SKOPJE_CENTER = [42.002, 21.436];

// ── Region definitions (riskCalc.js) ─────────────────────────────
const REGIONS = {
    "Центар":       { base:42, morn:88, eve:92, lunch:65, wknd:60 },
    "Карпош":       { base:30, morn:72, eve:78, lunch:48, wknd:45 },
    "Аеродром":     { base:27, morn:62, eve:68, lunch:42, wknd:40 },
    "Гази Баба":    { base:24, morn:58, eve:64, lunch:38, wknd:36 },
    "Чаир":         { base:36, morn:74, eve:80, lunch:55, wknd:50 },
    "Ѓорче Петров": { base:19, morn:50, eve:56, lunch:30, wknd:28 },
    "Сарај":        { base:13, morn:35, eve:40, lunch:18, wknd:20 },
    "Кисела Вода":  { base:23, morn:54, eve:60, lunch:36, wknd:34 },
    "Бутел":        { base:17, morn:45, eve:50, lunch:28, wknd:26 },
    "Шуто Оризари": { base:10, morn:28, eve:32, lunch:15, wknd:15 },
};
const ZONE_NAMES = Object.keys(REGIONS);

// TomTom service runs on port 8001 (separate from Spring Boot on 10000)
const TRAFFIC_SERVICE = "http://localhost:8001";

// ── GeoJSON polygons (SkopjeMap.jsx) ─────────────────────────────
const TRAFFIC_GEOJSON = {
    type: "FeatureCollection",
    features: [
        { type:"Feature", properties:{name:"Центар"},       geometry:{type:"Polygon",coordinates:[[[21.410,41.985],[21.410,42.010],[21.450,42.010],[21.450,41.985],[21.410,41.985]]]}},
        { type:"Feature", properties:{name:"Карпош"},       geometry:{type:"Polygon",coordinates:[[[21.370,41.985],[21.370,42.015],[21.415,42.015],[21.415,41.985],[21.370,41.985]]]}},
        { type:"Feature", properties:{name:"Кисела Вода"},  geometry:{type:"Polygon",coordinates:[[[21.415,41.960],[21.415,41.990],[21.470,41.990],[21.470,41.960],[21.415,41.960]]]}},
        { type:"Feature", properties:{name:"Гази Баба"},    geometry:{type:"Polygon",coordinates:[[[21.450,41.985],[21.450,42.020],[21.530,42.020],[21.530,41.985],[21.450,41.985]]]}},
        { type:"Feature", properties:{name:"Чаир"},         geometry:{type:"Polygon",coordinates:[[[21.415,41.995],[21.415,42.025],[21.465,42.025],[21.465,41.995],[21.415,41.995]]]}},
        { type:"Feature", properties:{name:"Ѓорче Петров"}, geometry:{type:"Polygon",coordinates:[[[21.335,41.985],[21.335,42.015],[21.375,42.015],[21.375,41.985],[21.335,41.985]]]}},
        { type:"Feature", properties:{name:"Сарај"},        geometry:{type:"Polygon",coordinates:[[[21.295,41.955],[21.295,41.990],[21.350,41.990],[21.350,41.955],[21.295,41.955]]]}},
        { type:"Feature", properties:{name:"Аеродром"},     geometry:{type:"Polygon",coordinates:[[[21.450,41.950],[21.450,41.985],[21.510,41.985],[21.510,41.950],[21.450,41.950]]]}},
        { type:"Feature", properties:{name:"Бутел"},        geometry:{type:"Polygon",coordinates:[[[21.410,42.010],[21.410,42.040],[21.465,42.040],[21.465,42.010],[21.410,42.010]]]}},
        { type:"Feature", properties:{name:"Шуто Оризари"}, geometry:{type:"Polygon",coordinates:[[[21.440,42.025],[21.440,42.055],[21.500,42.055],[21.500,42.025],[21.440,42.025]]]}},
    ],
};

// ── Statistical risk model (riskCalc.js fallback) ─────────────────
function calcRisk(zone, hour, weekday) {
    const r = REGIONS[zone];
    if (!r) return 0;
    const isWE = weekday >= 5;
    let score;
    if (isWE) {
        if (hour >= 10 && hour <= 14) {
            const k = hour === 12 ? 1 : (hour === 11 || hour === 13) ? 0.9 : 0.75;
            score = r.base + (r.wknd - r.base) * k;
        } else if (hour >= 18 && hour <= 21) {
            const k = hour === 19 ? 0.85 : hour === 18 ? 0.65 : 0.5;
            score = r.base + (r.wknd - r.base) * k;
        } else if (hour >= 22 || hour < 6) { score = r.base * 0.18; }
        else if (hour < 10) { score = r.base * 0.6; }
        else { score = r.base * 0.72; }
    } else {
        if (hour >= 7 && hour <= 9) {
            const k = { 7:0.75, 8:1.0, 9:0.85 }[hour] ?? 0.7;
            score = r.base + (r.morn - r.base) * k;
        } else if (hour >= 16 && hour <= 19) {
            const k = { 16:0.65, 17:1.0, 18:0.88, 19:0.6 }[hour] ?? 0.5;
            score = r.base + (r.eve - r.base) * k;
        } else if (hour === 12 || hour === 13) {
            score = r.base + (r.lunch - r.base) * (hour === 12 ? 0.9 : 0.7);
        } else if (hour >= 22 || hour < 5) { score = r.base * 0.14; }
        else if (hour < 7) { score = r.base * 0.4; }
        else { score = r.base * 1.0; }
    }
    return Math.round(Math.min(100, Math.max(0, score)));
}

// ── Risk thresholds ───────────────────────────────────────────────
const THRESHOLDS = [
    { max:25,  label:"Низок",    color:"#639922" },
    { max:50,  label:"Умерен",   color:"#BA7517" },
    { max:75,  label:"Висок",    color:"#D85A30" },
    { max:100, label:"Критичен", color:"#A32D2D" },
];

// Maps API risk level string → threshold color
const LEVEL_COLOR = {
    LOW:"#639922", MODERATE:"#BA7517", MEDIUM:"#BA7517",
    HIGH:"#D85A30", CRITICAL:"#A32D2D",
};

function riskInfo(score) {
    return THRESHOLDS.find(t => score <= t.max) ?? THRESHOLDS[3];
}

// ── Period labels ─────────────────────────────────────────────────
function getPeriodLabel(hour, isWeekend) {
    if (isWeekend) {
        if (hour < 8)   return "Ноќна мирнотија";
        if (hour < 10)  return "Утро — викенд";
        if (hour <= 14) return "Викенд шпица";
        if (hour < 18)  return "Попладне — викенд";
        if (hour <= 21) return "Викенд вечер";
        return "Ноќна мирнотија";
    }
    if (hour < 5)       return "Ноќна мирнотија";
    if (hour < 7)       return "Рано утро";
    if (hour <= 9)      return "Утринска шпица";
    if (hour < 12)      return "Претпладне";
    if (hour <= 13)     return "Пладневна пауза";
    if (hour < 16)      return "Попладне";
    if (hour <= 19)     return "Вечерна шпица";
    if (hour < 22)      return "Предвечерје";
    return "Ноќна мирнотија";
}

const DAY_LABELS = ["Пон","Вто","Сре","Чет","Пет","Саб","Нед"];
const DAY_FULL   = ["Понеделник","Вторник","Среда","Четврток","Петок","Сабота","Недела"];

const REFRESH_OPTIONS = [
    { label:"Auto Refresh: 2 min",  ms:120_000 },
    { label:"Auto Refresh: 5 min",  ms:300_000 },
    { label:"Auto Refresh: 10 min", ms:600_000 },
];

// ── SVG gauge ─────────────────────────────────────────────────────
function RiskGauge({ score, color }) {
    const cx=72, cy=72, r=52;
    const toRad = d => d * Math.PI / 180;
    const ptX   = a => cx + r * Math.cos(toRad(a));
    const ptY   = a => cy - r * Math.sin(toRad(a));
    const bgSX=ptX(225).toFixed(2), bgSY=ptY(225).toFixed(2);
    const bgEX=ptX(-45).toFixed(2), bgEY=ptY(-45).toFixed(2);
    const pct=score/100, fa=225-pct*270;
    const fX=ptX(fa).toFixed(2), fY=ptY(fa).toFixed(2);
    const lg=pct*270>180?1:0;
    return (
        <div className="tm-gauge">
            <svg width="144" height="96" viewBox="0 0 144 96">
                <path d={`M ${bgSX} ${bgSY} A ${r} ${r} 0 1 1 ${bgEX} ${bgEY}`}
                    fill="none" stroke="#e8e8e8" strokeWidth="10" strokeLinecap="round"/>
                {score > 0 && (
                    <path d={`M ${bgSX} ${bgSY} A ${r} ${r} 0 ${lg} 1 ${fX} ${fY}`}
                        fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"/>
                )}
                <circle cx={fX} cy={fY} r="6" fill={color}/>
            </svg>
            <div className="tm-gauge-score" style={{ color }}>{score}</div>
        </div>
    );
}

// ── Custom chart dot ──────────────────────────────────────────────
function ChartDot({ cx, cy, payload, activeHour, activeColor }) {
    if (cx == null || cy == null) return null;
    const isActive = parseInt(payload.hour, 10) === activeHour;
    if (isActive) return <circle cx={cx} cy={cy} r={7} fill={activeColor} stroke="#fff" strokeWidth={2}/>;
    const ri = riskInfo(payload.risk);
    return <circle cx={cx} cy={cy} r={3.5} fill={ri.color}/>;
}

// ── Main component ────────────────────────────────────────────────
const TrafficModel = ({ embedded = false }) => {
    const now      = new Date();
    const todayIdx = now.getDay() === 0 ? 6 : now.getDay() - 1;

    const [zone,       setZone]       = useState("Центар");
    const [dayIdx,     setDayIdx]     = useState(todayIdx);
    const [hour,       setHour]       = useState(now.getHours());
    const [refreshMs,  setRefreshMs]  = useState(120_000);
    const [fetching,   setFetching]   = useState(false);
    const [isRealtime, setIsRealtime] = useState(false);

    // apiZones: backend zone name → ZoneSimulationResultDto
    const [apiZones, setApiZones] = useState({});

    const debounceRef  = useRef(null);
    const refreshTimer = useRef(null);

    // ── API fetch — calls TomTom service on port 8001 ──────────
    const loadApiData = useCallback(async (h, d) => {
        setFetching(true);
        try {
            const res = await fetch(
                `${TRAFFIC_SERVICE}/traffic/realtime?hour=${h}&weekday=${d}`,
                { signal: AbortSignal.timeout(8000) }
            );
            if (!res.ok) throw new Error("Service error");
            const data = await res.json();

            // Index by Macedonian zone name (service returns our names directly)
            const map = {};
            data.forEach(z => { map[z.zone] = z; });
            setApiZones(map);
            // Show as real-time only when at least one zone has TomTom data
            setIsRealtime(data.some(z => z.source === "tomtom"));
        } catch {
            setApiZones({});
            setIsRealtime(false);
        } finally {
            setFetching(false);
        }
    }, []);

    // Debounce API calls when hour/day changes (400ms after last change)
    useEffect(() => {
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => loadApiData(hour, dayIdx), 400);
        return () => clearTimeout(debounceRef.current);
    }, [hour, dayIdx, loadApiData]);

    // Auto-refresh: sync clock AND re-fetch API data
    useEffect(() => {
        if (!embedded) return;
        refreshTimer.current = setInterval(() => {
            const t = new Date();
            const newHour = t.getHours();
            const newDay  = t.getDay() === 0 ? 6 : t.getDay() - 1;
            setHour(newHour);
            setDayIdx(newDay);
            loadApiData(newHour, newDay);
        }, refreshMs);
        return () => clearInterval(refreshTimer.current);
    }, [refreshMs, embedded, loadApiData]);

    const handleRefresh = useCallback(() => {
        const t = new Date();
        const newHour = t.getHours();
        const newDay  = t.getDay() === 0 ? 6 : t.getDay() - 1;
        setHour(newHour);
        setDayIdx(newDay);
        clearTimeout(debounceRef.current);
        loadApiData(newHour, newDay);
    }, [loadApiData]);

    const handleExport = () => {
        const rows = [
            "zone,risk_score,risk_level,current_speed_kmh,free_flow_speed_kmh,congestion,source,hour,day",
            ...ZONE_NAMES.map(z => {
                const api   = apiZones[z];
                const score = api ? api.risk_score : calcRisk(z, hour, dayIdx);
                const level = api ? api.risk_level : riskInfo(score).label;
                const spd   = api?.current_speed   ?? "";
                const ff    = api?.free_flow_speed  ?? "";
                const cong  = api?.congestion        ?? "";
                const src   = api ? api.source : "statistical";
                return `${z},${score},${level},${spd},${ff},${cong},${src},${hour},${DAY_FULL[dayIdx]}`;
            }),
        ].join("\n");
        const a = Object.assign(document.createElement("a"), {
            href: URL.createObjectURL(new Blob([rows], { type:"text/csv" })),
            download: `traffic_${DAY_FULL[dayIdx]}_${String(hour).padStart(2,"0")}h.csv`,
        });
        a.click();
        URL.revokeObjectURL(a.href);
    };

    // ── Helpers: resolve zone color/label (TomTom first, stat fallback) ─
    const resolveZoneColor = (name) => {
        const api = apiZones[name];
        if (api) return LEVEL_COLOR[api.risk_level?.toUpperCase()] ?? riskInfo(calcRisk(name, hour, dayIdx)).color;
        return riskInfo(calcRisk(name, hour, dayIdx)).color;
    };

    const resolveZoneLabel = (name) => {
        return apiZones[name]?.risk_level ?? null;
    };

    // Score for selected zone (always statistical for smooth gauge)
    const score  = calcRisk(zone, hour, dayIdx);
    const color  = resolveZoneColor(zone);
    const info   = riskInfo(score);
    // Use API risk label when available, otherwise derive from score
    const apiLabel = resolveZoneLabel(zone);
    const badgeInfo = apiLabel
        ? { label: apiLabel.charAt(0).toUpperCase() + apiLabel.slice(1).toLowerCase(), color }
        : info;

    const period = getPeriodLabel(hour, dayIdx >= 5);

    // 24h chart — always statistical (too many API calls otherwise)
    const chartData = useMemo(
        () => Array.from({ length:24 }, (_,h) => ({
            hour: String(h).padStart(2,"0"),
            risk: calcRisk(zone, h, dayIdx),
        })),
        [zone, dayIdx]
    );

    const geoKey = `${hour}-${dayIdx}-${zone}-${Object.keys(apiZones).length}`;

    const geoStyle = (feature) => {
        const name  = feature.properties.name;
        const fill  = resolveZoneColor(name);
        const isSel = name === zone;
        return {
            fillColor:   fill,
            color:       isSel ? "#185FA5" : "#fff",
            weight:      isSel ? 3 : 1.5,
            fillOpacity: isSel ? 0.80 : 0.55,
        };
    };

    const onEachFeature = (feature, layer) => {
        const name      = feature.properties.name;
        const api       = apiZones[name];
        const statScore = calcRisk(name, hour, dayIdx);
        const col       = resolveZoneColor(name);

        let tip;
        if (api) {
            const lvl = api.risk_level ?? "";
            const speedLine = api.current_speed != null
                ? `<br/>Брзина: <b>${api.current_speed} / ${api.free_flow_speed} км/ч</b>`
                : "";
            const srcIcon = api.source === "tomtom" ? "🟢" : "⚪";
            tip = `<b>${name}</b><br/>Ризик: <b style="color:${col}">${lvl}</b>${speedLine}<br/><small>${srcIcon} ${api.source}</small>`;
        } else {
            tip = `<b>${name}</b><br/>Ризик: ${statScore}/100 · ${riskInfo(statScore).label}`;
        }

        layer.bindTooltip(tip, { sticky:true, className:"tm-map-tooltip" });
        layer.on("click", () => setZone(name));
    };

    return (
        <div className={embedded ? "tm-embedded" : "tm-page"}>

            {/* ── Controls bar (embedded) ── */}
            {embedded && (
                <div className="controls">
                    <div className="controls-left">
                        <div className={`tm-source-badge ${isRealtime ? "realtime" : ""}`}>
                            <span className={`tm-source-dot ${isRealtime ? "realtime" : ""}`} />
                            {fetching ? "Вчитување…" : isRealtime ? "Real-time API" : "Статистички модел"}
                        </div>
                    </div>
                    <div className="controls-right">
                        <select
                            className="select-box"
                            value={refreshMs}
                            onChange={e => setRefreshMs(Number(e.target.value))}
                        >
                            {REFRESH_OPTIONS.map(o => (
                                <option key={o.ms} value={o.ms}>{o.label}</option>
                            ))}
                        </select>
                        <button
                            className="export-icon refresh-btn"
                            title="Refresh now"
                            onClick={handleRefresh}
                            disabled={fetching}
                        >
                            <FaSyncAlt className={fetching ? "spinning" : ""} />
                        </button>
                        <button className="export-icon" title="Export CSV" onClick={handleExport}>
                            <FaFileExport />
                        </button>
                    </div>
                </div>
            )}

            {/* ── Page header (standalone) ── */}
            {!embedded && (
                <div className="tm-header">
                    <div>
                        <h1 className="tm-title">Скопје · Сообраќаен модел</h1>
                        <p className="tm-subtitle">
                            Traffic Prediction Engine &nbsp;·&nbsp; 10 општини &nbsp;·&nbsp; real-time
                        </p>
                    </div>
                    <div className={`tm-badge ${isRealtime ? "realtime" : ""}`}>
                        <span className={`tm-badge-dot ${isRealtime ? "realtime" : ""}`} />
                        {fetching ? "Вчитување…" : isRealtime ? "Real-time API" : "Статистички модел"}
                    </div>
                </div>
            )}

            {/* ── Map + sidebar ── */}
            <div className="tm-body">
                <div className="tm-map-col">
                    <div className="tm-map-wrap">
                        <MapContainer
                            center={SKOPJE_CENTER} zoom={12}
                            style={{ height:"100%", width:"100%", borderRadius:"12px" }}
                            scrollWheelZoom
                        >
                            <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
                            />
                            <GeoJSON
                                key={geoKey}
                                data={TRAFFIC_GEOJSON}
                                style={geoStyle}
                                onEachFeature={onEachFeature}
                            />
                        </MapContainer>
                    </div>
                    <div className="tm-legend">
                        {THRESHOLDS.map((t,i) => {
                            const lo = i === 0 ? 0 : THRESHOLDS[i-1].max;
                            return (
                                <div key={t.label} className="tm-legend-item">
                                    <span className="tm-legend-swatch" style={{ background:t.color }}/>
                                    <span>{t.label} ({lo}–{t.max})</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Sidebar */}
                <div className="tm-sidebar">
                    <div className="tm-section">
                        <div className="tm-label">ИЗБРАН РЕГИОН</div>
                        <select className="tm-select" value={zone} onChange={e => setZone(e.target.value)}>
                            {ZONE_NAMES.map(z => <option key={z} value={z}>{z}</option>)}
                        </select>
                    </div>

                    <div className="tm-section tm-section-gauge">
                        <div className="tm-label">РИЗИК SCORE</div>
                        <RiskGauge score={score} color={color} />
                        <div className="tm-risk-pill" style={{ background:color }}>
                            {badgeInfo.label.toUpperCase()}
                        </div>
                    </div>

                    <div className="tm-section">
                        <div className="tm-label">ДЕН</div>
                        <div className="tm-days">
                            {DAY_LABELS.map((d,i) => (
                                <button
                                    key={i}
                                    className={`tm-day-btn${i === dayIdx ? " active" : ""}`}
                                    onClick={() => setDayIdx(i)}
                                >{d}</button>
                            ))}
                        </div>
                    </div>

                    <div className="tm-section">
                        <div className="tm-section-row">
                            <div className="tm-label">ЧАС</div>
                            <div className="tm-hour-val">{String(hour).padStart(2,"0")}:00</div>
                        </div>
                        <input
                            type="range" min={0} max={23} value={hour}
                            onChange={e => setHour(Number(e.target.value))}
                            className="tm-slider"
                        />
                        <div className="tm-ticks">
                            <span>00</span><span>06</span><span>12</span><span>18</span><span>23</span>
                        </div>
                    </div>

                    <div className="tm-section">
                        <div className="tm-label">ПЕРИОД</div>
                        <div className="tm-period-main">{period}</div>
                        <div className="tm-period-sub">{DAY_FULL[dayIdx]}</div>
                    </div>
                </div>
            </div>

            {/* ── 24h chart (statistical) ── */}
            <div className="tm-chart-card">
                <div className="tm-chart-title">
                    ПРЕДВИДУВАЊЕ — 24 ЧАСА &nbsp;·&nbsp; {zone} &nbsp;·&nbsp; {DAY_FULL[dayIdx]}
                </div>
                <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={chartData} margin={{ top:10, right:20, left:0, bottom:5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="hour" tick={{ fontSize:11, fill:"#aaa" }} tickLine={false} />
                        <YAxis domain={[0,100]} tick={{ fontSize:11, fill:"#aaa" }} tickLine={false} width={28} />
                        <Tooltip
                            formatter={(v) => [v, "Ризик"]}
                            labelFormatter={(l) => `${l}:00`}
                            contentStyle={{ fontSize:13, borderRadius:8, border:"1px solid #e0e0e0" }}
                        />
                        <ReferenceLine
                            x={String(hour).padStart(2,"0")}
                            stroke={color} strokeDasharray="4 3" strokeWidth={1.5}
                        />
                        <Line
                            type="monotone" dataKey="risk" stroke="#3b82f6" strokeWidth={2.5}
                            dot={<ChartDot activeHour={hour} activeColor={color} />}
                            activeDot={{ r:6 }} isAnimationActive={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

        </div>
    );
};

export default TrafficModel;
