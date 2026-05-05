import React, { useState } from "react";
import {
    ResponsiveContainer,
    BarChart, Bar,
    LineChart, Line,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell,
} from "recharts";
import "../styles/Analytics.css";
import { FaFileExport } from "react-icons/fa";

// ── Constants ────────────────────────────────────────────────────────────────

const ZONE_NAMES = [
    "Karpoš", "Kisela Voda", "Gazi Baba", "Centar",
    "Butel", "Aerodrom", "Čair", "Stara Čaršija",
];

const TIME_OPTIONS = [
    { label: "Morning  (06:00)", value: "06:00" },
    { label: "Midday   (12:00)", value: "12:00" },
    { label: "Afternoon (15:00)", value: "15:00" },
    { label: "Evening  (18:00)", value: "18:00" },
    { label: "Night    (22:00)", value: "22:00" },
];

const ANALYSIS_TYPES = [
    { label: "All",         value: "all" },
    { label: "Temperature", value: "temperature" },
    { label: "Pollution",   value: "pollution" },
    { label: "Traffic",     value: "traffic" },
];

const RISK_COLORS = {
    LOW:      "#2ecc71",
    MODERATE: "#f1c40f",
    MEDIUM:   "#f1c40f",
    HIGH:     "#e67e22",
    CRITICAL: "#e74c3c",
};

const METRIC_COLORS = {
    temperature: "#e67e22",
    pollution:   "#9b59b6",
    traffic:     "#2f6fad",
};

const riskColor = (level) => RISK_COLORS[level?.toUpperCase()] ?? "#cccccc";

// ── Helpers ──────────────────────────────────────────────────────────────────

const metricValue = (zone, type) => {
    if (type === "temperature") return { value: zone.predictedTemperature, risk: zone.heatRiskLevel };
    if (type === "pollution")   return { value: zone.predictedPollution,   risk: zone.airRiskLevel };
    if (type === "traffic")     return { value: zone.predictedTraffic,     risk: zone.trafficRiskLevel };
    return null;
};

const metricUnit = (type) => {
    if (type === "temperature") return "°C";
    if (type === "pollution")   return "µg/m³";
    if (type === "traffic")     return "vehicles";
    return "";
};

const metricLabel = (type) => {
    if (type === "temperature") return "Temperature";
    if (type === "pollution")   return "PM2.5 Pollution";
    if (type === "traffic")     return "Traffic";
    return "";
};

async function fetchZones(body) {
    const res = await fetch("/api/predict/zones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error("Analytics request failed");
    return res.json();
}

// ── Custom tooltip ────────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label, unit }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="chart-tooltip">
            <p className="tooltip-label">{label}</p>
            {payload.map((p, i) => (
                <p key={i} style={{ color: p.color }}>
                    {p.name}: <strong>{typeof p.value === "number" ? p.value.toFixed(1) : p.value}</strong> {unit || p.unit || ""}
                </p>
            ))}
        </div>
    );
};

// ── Sub-charts ────────────────────────────────────────────────────────────────

const SingleBarChart = ({ data, dataKey, riskKey, color, unit, label }) => (
    <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-35} textAnchor="end" interval={0} />
            <YAxis tick={{ fontSize: 11 }} unit={` ${unit}`} width={65} />
            <Tooltip content={<CustomTooltip unit={unit} />} />
            <Bar dataKey={dataKey} name={label} radius={[4, 4, 0, 0]}>
                {data.map((entry, i) => (
                    <Cell key={i} fill={riskKey ? riskColor(entry[riskKey]) : color} />
                ))}
            </Bar>
        </BarChart>
    </ResponsiveContainer>
);

const SingleLineChart = ({ data, dataKey, color, unit, label }) => (
    <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="time" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} unit={` ${unit}`} width={65} />
            <Tooltip content={<CustomTooltip unit={unit} />} />
            <Legend />
            <Line type="monotone" dataKey={dataKey} name={label} stroke={color} strokeWidth={2.5} dot={{ r: 5 }} activeDot={{ r: 7 }} />
        </LineChart>
    </ResponsiveContainer>
);

const MultiLineChart = ({ data }) => (
    <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="time" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} width={55} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="temperature" name="Temp (°C)"     stroke={METRIC_COLORS.temperature} strokeWidth={2} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="pollution"   name="PM2.5 (µg/m³)" stroke={METRIC_COLORS.pollution}   strokeWidth={2} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="traffic"     name="Vehicles"       stroke={METRIC_COLORS.traffic}     strokeWidth={2} dot={{ r: 4 }} />
        </LineChart>
    </ResponsiveContainer>
);

// ── Main component ────────────────────────────────────────────────────────────

const Analytics = () => {
    const [form, setForm] = useState({ date: "", time: "", zone: "", type: "" });
    const [result, setResult] = useState(null); // { mode, type, data, zone }
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const isSpecificZone = form.zone && form.zone !== "All Zones";

    const handleGenerate = async () => {
        setLoading(true);
        setError(null);
        try {
            const type = form.type || "all";
            const date = form.date || null;

            if (!isSpecificZone) {
                // ── Bar chart: all zones at selected time ──────────────────
                const zoneData = await fetchZones({ date, time: form.time || null, type });
                const data = zoneData.map(z => ({
                    name:        z.zoneName,
                    temperature: z.predictedTemperature,
                    pollution:   z.predictedPollution,
                    traffic:     z.predictedTraffic,
                    heatRisk:    z.heatRiskLevel,
                    airRisk:     z.airRiskLevel,
                    trafficRisk: z.trafficRiskLevel,
                }));
                setResult({ mode: "bar", type, data, zone: "All Zones" });
            } else {
                // ── Line chart: selected zone across all time slots ────────
                const slots = TIME_OPTIONS.map(t => t.value);
                const allResults = await Promise.all(
                    slots.map(t => fetchZones({ date, time: t, type }))
                );
                const data = TIME_OPTIONS.map((slot, i) => {
                    const z = allResults[i].find(z => z.zoneName === form.zone);
                    if (!z) return { time: slot.label };
                    return {
                        time:        slot.label.split("(")[0].trim(),
                        temperature: z.predictedTemperature,
                        pollution:   z.predictedPollution,
                        traffic:     z.predictedTraffic,
                    };
                });
                setResult({ mode: "line", type, data, zone: form.zone });
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setForm({ date: "", time: "", zone: "", type: "" });
        setResult(null);
        setError(null);
    };

    const handleExport = () => {
        if (!result) return;
        const keys = Object.keys(result.data[0]);
        const rows = [
            keys.join(","),
            ...result.data.map(row => keys.map(k => row[k] ?? "").join(",")),
        ].join("\n");
        const a = Object.assign(document.createElement("a"), {
            href: URL.createObjectURL(new Blob([rows], { type: "text/csv" })),
            download: "analytics.csv",
        });
        a.click();
        URL.revokeObjectURL(a.href);
    };

    const chartTitle = result
        ? `${result.type === "all" ? "All Metrics" : metricLabel(result.type)} — ${result.zone}`
        : "No data yet";

    return (
        <div className="analysis-container">

            <div className="hero">
                <h1>Analytics</h1>
                <p>Compare zone metrics or track a single zone across the day</p>
            </div>

            {/* ── Form ── */}
            <div className="analysis-box">
                <h3>Analysis Parameters</h3>

                <div className="form-grid">
                    <div className="form-group">
                        <label>Select Date</label>
                        <input type="date" name="date" value={form.date} onChange={handleChange} />
                    </div>

                    <div className="form-group">
                        <label>Select Time <span className="field-note">(all-zones mode only)</span></label>
                        <select name="time" value={form.time} onChange={handleChange} disabled={isSpecificZone}>
                            <option value="" disabled hidden>Select time</option>
                            {TIME_OPTIONS.map(o => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Select Zone</label>
                        <select name="zone" value={form.zone} onChange={handleChange}>
                            <option value="" disabled hidden>Select zone</option>
                            <option value="All Zones">All Zones</option>
                            {ZONE_NAMES.map(z => (
                                <option key={z} value={z}>{z}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Select Analysis Type</label>
                        <select name="type" value={form.type} onChange={handleChange}>
                            <option value="" disabled hidden>Select analysis</option>
                            {ANALYSIS_TYPES.map(o => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="form-actions">
                    <span className="reset-link" onClick={handleReset}>Reset Filters</span>
                    <button className="generate-btn" onClick={handleGenerate} disabled={loading}>
                        {loading ? "Loading…" : "Generate Analysis"}
                    </button>
                </div>

                {isSpecificZone && (
                    <p className="field-hint">Zone selected — chart will show metrics across all time slots of the day.</p>
                )}
                {!isSpecificZone && form.zone === "All Zones" && (
                    <p className="field-hint">All Zones selected — chart will compare zones at the selected time.</p>
                )}

                {error && <p className="analytics-error">{error}</p>}
            </div>

            {/* ── Charts ── */}
            {result && (
                <div className="chart-section">
                    <div className="chart-header">
                        <h3>{chartTitle}</h3>
                        <button className="export-icon" title="Export CSV" onClick={handleExport}>
                            <FaFileExport />
                        </button>
                    </div>

                    {/* Single metric */}
                    {result.type !== "all" && result.mode === "bar" && (
                        <div className="chart-card">
                            <h4>{metricLabel(result.type)} by Zone</h4>
                            <SingleBarChart
                                data={result.data}
                                dataKey={result.type}
                                riskKey={result.type === "temperature" ? "heatRisk" : result.type === "pollution" ? "airRisk" : "trafficRisk"}
                                color={METRIC_COLORS[result.type]}
                                unit={metricUnit(result.type)}
                                label={metricLabel(result.type)}
                            />
                        </div>
                    )}

                    {result.type !== "all" && result.mode === "line" && (
                        <div className="chart-card">
                            <h4>{metricLabel(result.type)} across the day — {result.zone}</h4>
                            <SingleLineChart
                                data={result.data}
                                dataKey={result.type}
                                color={METRIC_COLORS[result.type]}
                                unit={metricUnit(result.type)}
                                label={metricLabel(result.type)}
                            />
                        </div>
                    )}

                    {/* All metrics */}
                    {result.type === "all" && result.mode === "bar" && (
                        <div className="charts-triple">
                            {["temperature", "pollution", "traffic"].map(m => (
                                <div className="chart-card" key={m}>
                                    <h4>{metricLabel(m)} by Zone</h4>
                                    <SingleBarChart
                                        data={result.data}
                                        dataKey={m}
                                        riskKey={m === "temperature" ? "heatRisk" : m === "pollution" ? "airRisk" : "trafficRisk"}
                                        color={METRIC_COLORS[m]}
                                        unit={metricUnit(m)}
                                        label={metricLabel(m)}
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    {result.type === "all" && result.mode === "line" && (
                        <div className="chart-card">
                            <h4>All Metrics across the day — {result.zone}</h4>
                            <MultiLineChart data={result.data} />
                        </div>
                    )}
                </div>
            )}

            {!result && !loading && (
                <div className="chart-empty">
                    <p>Select parameters above and click <strong>Generate Analysis</strong> to see charts</p>
                </div>
            )}

        </div>
    );
};

export default Analytics;
