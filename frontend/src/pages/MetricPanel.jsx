/**
 * MetricPanel — shared component for Pollution, Temperature, and Heat Risk tabs.
 * Uses the same 10-zone map and statistical model as TrafficModel.
 * metricType: 'pollution' | 'temperature' | 'heat-risk'
 */
import React, { useState, useMemo, useEffect } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip as ReTooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { FaSyncAlt, FaFileExport } from "react-icons/fa";
import "leaflet/dist/leaflet.css";
import "../styles/TrafficModel.css";

// ── Map / zone config (mirrors TrafficModel exactly) ──────────────
const SKOPJE_CENTER = [42.002, 21.436];

const ZONE_NAMES = [
    "Центар","Карпош","Аеродром","Гази Баба","Чаир",
    "Ѓорче Петров","Сарај","Кисела Вода","Бутел","Шуто Оризари",
];

const ZONES_GEOJSON = {
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

// ── Traffic risk formula (from riskCalc.js) ───────────────────────
const TRAFFIC_REGIONS = {
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

function calcTraffic(zone, hour, weekday) {
    const r = TRAFFIC_REGIONS[zone];
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

// ── Pollution (PM2.5) model ───────────────────────────────────────
const BASE_PM25 = {
    "Центар":42, "Карпош":22, "Аеродром":30, "Гази Баба":18,
    "Чаир":32, "Ѓорче Петров":15, "Сарај":10, "Кисела Вода":25,
    "Бутел":20, "Шуто Оризари":12,
};

function calcPM25(zone, hour, weekday) {
    const base = BASE_PM25[zone] ?? 20;
    const t    = calcTraffic(zone, hour, weekday);
    return Math.round((base * (0.35 + 0.65 * t / 100)) * 10) / 10;
}

const AIR_THRESHOLDS = [
    { max:15,   label:"Низок",    color:"#639922" },
    { max:35,   label:"Умерен",   color:"#BA7517" },
    { max:55,   label:"Висок",    color:"#D85A30" },
    { max:9999, label:"Критичен", color:"#A32D2D" },
];
function airRiskInfo(pm25)  { return AIR_THRESHOLDS.find(t => pm25  <= t.max) ?? AIR_THRESHOLDS[3]; }
function pm25ToScore(pm25)  { return Math.min(100, Math.round(pm25  / 80 * 100)); }

// ── Temperature model ─────────────────────────────────────────────
const ZONE_HEAT = {
    "Центар":2.5, "Карпош":0.5, "Аеродром":1.5, "Гази Баба":0.5,
    "Чаир":1.5, "Ѓорче Петров":0.0, "Сарај":-1.0, "Кисела Вода":1.0,
    "Бутел":0.5, "Шуто Оризари":0.0,
};
const BASE_TEMP = 22; // Skopje seasonal average °C

function calcTemperature(zone, hour, weekday) {
    const delta    = ZONE_HEAT[zone] ?? 0;
    const hourFx   = -4.5 * Math.cos(Math.PI * (hour - 6) / 9);
    const dayBonus = weekday < 5 ? 0.4 : 0;
    return Math.round((BASE_TEMP + delta + hourFx + dayBonus) * 10) / 10;
}

const TEMP_THRESHOLDS = [
    { max:28,   label:"Низок",    color:"#639922" },
    { max:33,   label:"Умерен",   color:"#BA7517" },
    { max:38,   label:"Висок",    color:"#D85A30" },
    { max:9999, label:"Критичен", color:"#A32D2D" },
];
function tempRiskInfo(temp) { return TEMP_THRESHOLDS.find(t => temp <= t.max) ?? TEMP_THRESHOLDS[3]; }
function tempToScore(temp)  { return Math.min(100, Math.max(0, Math.round((temp - 15) / 27 * 100))); }

// ── Overall risk ──────────────────────────────────────────────────
const OVERALL_THRESHOLDS = [
    { max:25,  label:"Низок",    color:"#639922" },
    { max:50,  label:"Умерен",   color:"#BA7517" },
    { max:75,  label:"Висок",    color:"#D85A30" },
    { max:100, label:"Критичен", color:"#A32D2D" },
];
function overallRiskInfo(score) { return OVERALL_THRESHOLDS.find(t => score <= t.max) ?? OVERALL_THRESHOLDS[3]; }

function calcOverall(zone, hour, weekday) {
    const traffic = calcTraffic(zone, hour, weekday);
    const air     = pm25ToScore(calcPM25(zone, hour, weekday));
    const heat    = tempToScore(calcTemperature(zone, hour, weekday));
    return Math.round(traffic * 0.5 + air * 0.3 + heat * 0.2);
}

// Estimated vehicle counts for Heat Risk overlay
const BASE_VEHICLES = {
    "Центар":500,"Карпош":300,"Аеродром":350,"Гази Баба":300,
    "Чаир":350,"Ѓорче Петров":200,"Сарај":150,"Кисела Вода":280,
    "Бутел":250,"Шуто Оризари":180,
};
function estimateVehicles(zone, hour, weekday) {
    return Math.round((BASE_VEHICLES[zone] ?? 200) * calcTraffic(zone, hour, weekday) / 100);
}

// ── Period labels (from riskCalc.js) ─────────────────────────────
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

// ── Per-metric config ─────────────────────────────────────────────
function getMetricConfig(metricType) {
    switch (metricType) {
        case "pollution": return {
            sideLabel:  "PM2.5",
            unit:       "µg/m³",
            chartLabel: "PM2.5 (µg/m³)",
            getScore:   (z,h,d) => pm25ToScore(calcPM25(z,h,d)),
            getValue:   (z,h,d) => calcPM25(z,h,d).toFixed(1),
            getRiskInfo:(z,h,d) => airRiskInfo(calcPM25(z,h,d)),
            getChartVal:(z,h,d) => calcPM25(z,h,d),
            getGaugeDisplay:(z,h,d) => `${calcPM25(z,h,d).toFixed(1)}`,
            chartDomain:[0, 80],
        };
        case "temperature": return {
            sideLabel:  "ТЕМПЕРАТУРА",
            unit:       "°C",
            chartLabel: "Температура (°C)",
            getScore:   (z,h,d) => tempToScore(calcTemperature(z,h,d)),
            getValue:   (z,h,d) => `${calcTemperature(z,h,d)}`,
            getRiskInfo:(z,h,d) => tempRiskInfo(calcTemperature(z,h,d)),
            getChartVal:(z,h,d) => calcTemperature(z,h,d),
            getGaugeDisplay:(z,h,d) => `${calcTemperature(z,h,d)}`,
            chartDomain:[10, 42],
        };
        case "heat-risk": return {
            sideLabel:  "РИЗИК SCORE",
            unit:       "",
            chartLabel: "Вкупен ризик",
            getScore:   (z,h,d) => calcOverall(z,h,d),
            getValue:   (z,h,d) => calcOverall(z,h,d),
            getRiskInfo:(z,h,d) => overallRiskInfo(calcOverall(z,h,d)),
            getChartVal:(z,h,d) => calcOverall(z,h,d),
            getGaugeDisplay:(z,h,d) => calcOverall(z,h,d),
            chartDomain:[0, 100],
        };
        default: return getMetricConfig("pollution");
    }
}

// ── Tooltip content per metric type ──────────────────────────────
function getTooltipHtml(name, hour, weekday, metricType) {
    const pm25    = calcPM25(name, hour, weekday);
    const temp    = calcTemperature(name, hour, weekday);
    const overall = calcOverall(name, hour, weekday);
    const air     = airRiskInfo(pm25);
    const heat    = tempRiskInfo(temp);
    const ov      = overallRiskInfo(overall);
    const veh     = estimateVehicles(name, hour, weekday);

    if (metricType === "pollution") {
        return `<b>${name}</b><br/>
            PM2.5: <b>${pm25.toFixed(1)} µg/m³</b><br/>
            Air Risk: <b style="color:${air.color}">${air.label.toUpperCase()}</b><br/>
            Overall Risk: <b style="color:${ov.color}">${ov.label.toUpperCase()}</b>`;
    }
    if (metricType === "temperature") {
        return `<b>${name}</b><br/>
            Температура: <b>${temp} °C</b><br/>
            Heat Risk: <b style="color:${heat.color}">${heat.label.toUpperCase()}</b><br/>
            Overall Risk: <b style="color:${ov.color}">${ov.label.toUpperCase()}</b>`;
    }
    // heat-risk
    return `<b>${name}</b><br/>
        Температура: <b>${temp} °C</b><br/>
        PM2.5: <b>${pm25.toFixed(1)} µg/m³</b><br/>
        Возила: <b>${veh}</b><br/>
        Overall Risk: <b style="color:${ov.color}">${ov.label.toUpperCase()}</b>`;
}

// ── SVG gauge arc ─────────────────────────────────────────────────
function MetricGauge({ score, color, displayValue, unit }) {
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
            <div className="tm-gauge-score" style={{ color }}>
                {displayValue}
                {unit && <span style={{ fontSize:14, fontWeight:400, marginLeft:3 }}>{unit}</span>}
            </div>
        </div>
    );
}

// ── Custom chart dot ──────────────────────────────────────────────
function MetricDot({ cx, cy, payload, activeHour, activeColor, thresholds, domainMin }) {
    if (cx == null || cy == null) return null;
    const isActive = parseInt(payload.hour, 10) === activeHour;
    const val      = payload.val;
    const colorFn  = (v) => {
        if (!thresholds) return "#3b82f6";
        const t = thresholds.find(th => v <= th.max);
        return t ? t.color : thresholds[thresholds.length-1].color;
    };
    if (isActive) return <circle cx={cx} cy={cy} r={7} fill={activeColor} stroke="#fff" strokeWidth={2}/>;
    return <circle cx={cx} cy={cy} r={3.5} fill={colorFn(val)}/>;
}

// ── Main component ────────────────────────────────────────────────
const MetricPanel = ({ metricType, embedded = false }) => {
    const now      = new Date();
    const todayIdx = now.getDay() === 0 ? 6 : now.getDay() - 1;

    const [zone,       setZone]       = useState("Центар");
    const [dayIdx,     setDayIdx]     = useState(todayIdx);
    const [hour,       setHour]       = useState(now.getHours());
    const [refreshMs,  setRefreshMs]  = useState(120_000);
    const [refreshing, setRefreshing] = useState(false);

    const cfg     = getMetricConfig(metricType);
    const score   = cfg.getScore(zone, hour, dayIdx);
    const info    = cfg.getRiskInfo(zone, hour, dayIdx);
    const display = cfg.getGaugeDisplay(zone, hour, dayIdx);
    const period  = getPeriodLabel(hour, dayIdx >= 5);

    // Which thresholds to color chart dots
    const dotThresholds = metricType === "pollution"    ? AIR_THRESHOLDS
                        : metricType === "temperature"  ? TEMP_THRESHOLDS
                        : OVERALL_THRESHOLDS;

    // Auto-refresh: sync to real clock
    useEffect(() => {
        if (!embedded) return;
        const id = setInterval(() => {
            const t = new Date();
            setHour(t.getHours());
            setDayIdx(t.getDay() === 0 ? 6 : t.getDay() - 1);
        }, refreshMs);
        return () => clearInterval(id);
    }, [refreshMs, embedded]);

    const handleRefresh = () => {
        setRefreshing(true);
        const t = new Date();
        setHour(t.getHours());
        setDayIdx(t.getDay() === 0 ? 6 : t.getDay() - 1);
        setTimeout(() => setRefreshing(false), 600);
    };

    const handleExport = () => {
        const headers = metricType === "heat-risk"
            ? "zone,temperature_c,pm25_ugm3,vehicles,overall_risk,overall_level,hour,day"
            : metricType === "pollution"
            ? "zone,pm25_ugm3,air_risk,overall_risk,overall_level,hour,day"
            : "zone,temperature_c,heat_risk,overall_risk,overall_level,hour,day";

        const rows = ZONE_NAMES.map(z => {
            const pm25  = calcPM25(z, hour, dayIdx);
            const temp  = calcTemperature(z, hour, dayIdx);
            const ov    = calcOverall(z, hour, dayIdx);
            const ovInf = overallRiskInfo(ov);
            const veh   = estimateVehicles(z, hour, dayIdx);
            if (metricType === "heat-risk")
                return `${z},${temp},${pm25.toFixed(1)},${veh},${ov},${ovInf.label},${hour},${DAY_FULL[dayIdx]}`;
            if (metricType === "pollution")
                return `${z},${pm25.toFixed(1)},${airRiskInfo(pm25).label},${ov},${ovInf.label},${hour},${DAY_FULL[dayIdx]}`;
            return `${z},${temp},${tempRiskInfo(temp).label},${ov},${ovInf.label},${hour},${DAY_FULL[dayIdx]}`;
        });

        const csv = [headers, ...rows].join("\n");
        const a = Object.assign(document.createElement("a"), {
            href: URL.createObjectURL(new Blob([csv], { type:"text/csv" })),
            download: `${metricType}_${DAY_FULL[dayIdx]}_${String(hour).padStart(2,"0")}h.csv`,
        });
        a.click();
        URL.revokeObjectURL(a.href);
    };

    // 24h chart data
    const chartData = useMemo(() =>
        Array.from({ length:24 }, (_,h) => ({
            hour: String(h).padStart(2,"0"),
            val:  cfg.getChartVal(zone, h, dayIdx),
        })),
        [zone, dayIdx, metricType]
    );

    const geoKey = `${metricType}-${hour}-${dayIdx}-${zone}`;

    const geoStyle = (feature) => {
        const name = feature.properties.name;
        const ri   = cfg.getRiskInfo(name, hour, dayIdx);
        const isSel = name === zone;
        return {
            fillColor:   ri.color,
            color:       isSel ? "#185FA5" : "#fff",
            weight:      isSel ? 3 : 1.5,
            fillOpacity: isSel ? 0.80 : 0.55,
        };
    };

    const onEachFeature = (feature, layer) => {
        const name = feature.properties.name;
        layer.bindTooltip(
            getTooltipHtml(name, hour, dayIdx, metricType),
            { sticky:true, className:"tm-map-tooltip" }
        );
        layer.on("click", () => setZone(name));
    };

    return (
        <div className={embedded ? "tm-embedded" : "tm-page"}>

            {/* ── Controls bar ── */}
            {embedded && (
                <div className="controls">
                    <div className="controls-left" />
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
                        <button className="export-icon refresh-btn" title="Refresh now" onClick={handleRefresh}>
                            <FaSyncAlt className={refreshing ? "spinning" : ""} />
                        </button>
                        <button className="export-icon" title="Export CSV" onClick={handleExport}>
                            <FaFileExport />
                        </button>
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
                                data={ZONES_GEOJSON}
                                style={geoStyle}
                                onEachFeature={onEachFeature}
                            />
                        </MapContainer>
                    </div>

                    <div className="tm-legend">
                        {dotThresholds.map((t, i) => {
                            const lo = i === 0 ? (metricType === "temperature" ? 0 : 0) : dotThresholds[i-1].max;
                            const loLabel = metricType === "temperature" ? `${lo}°C` : metricType === "pollution" ? `${lo}` : lo;
                            const hiLabel = metricType === "temperature" ? `${t.max === 9999 ? "38+" : t.max}°C` : metricType === "pollution" ? `${t.max === 9999 ? "55+" : t.max}` : t.max;
                            return (
                                <div key={t.label} className="tm-legend-item">
                                    <span className="tm-legend-swatch" style={{ background:t.color }} />
                                    <span>{t.label} ({loLabel}–{hiLabel})</span>
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
                        <div className="tm-label">{cfg.sideLabel}</div>
                        <MetricGauge
                            score={score}
                            color={info.color}
                            displayValue={display}
                            unit={cfg.unit}
                        />
                        <div className="tm-risk-pill" style={{ background:info.color }}>
                            {info.label.toUpperCase()}
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

            {/* ── 24h chart ── */}
            <div className="tm-chart-card">
                <div className="tm-chart-title">
                    {cfg.chartLabel.toUpperCase()} — 24 ЧАСА &nbsp;·&nbsp; {zone} &nbsp;·&nbsp; {DAY_FULL[dayIdx]}
                </div>
                <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={chartData} margin={{ top:10, right:20, left:0, bottom:5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="hour" tick={{ fontSize:11, fill:"#aaa" }} tickLine={false} />
                        <YAxis
                            domain={cfg.chartDomain}
                            tick={{ fontSize:11, fill:"#aaa" }}
                            tickLine={false}
                            width={32}
                        />
                        <ReTooltip
                            formatter={(v) => [`${typeof v==="number" ? v.toFixed(1) : v}${cfg.unit ? " "+cfg.unit : ""}`, cfg.sideLabel]}
                            labelFormatter={(l) => `${l}:00`}
                            contentStyle={{ fontSize:13, borderRadius:8, border:"1px solid #e0e0e0" }}
                        />
                        <ReferenceLine
                            x={String(hour).padStart(2,"0")}
                            stroke={info.color} strokeDasharray="4 3" strokeWidth={1.5}
                        />
                        <Line
                            type="monotone" dataKey="val" stroke="#3b82f6" strokeWidth={2.5}
                            dot={<MetricDot activeHour={hour} activeColor={info.color} thresholds={dotThresholds} />}
                            activeDot={{ r:6 }} isAnimationActive={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

        </div>
    );
};

export default MetricPanel;
