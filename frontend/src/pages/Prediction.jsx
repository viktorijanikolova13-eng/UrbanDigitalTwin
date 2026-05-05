import React, { useState, useRef } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "../styles/Prediction.css";
import { FaFileExport } from "react-icons/fa";

const SKOPJE_CENTER = [41.993, 21.445];

const RISK_COLORS = {
    LOW:      "#2ecc71",
    MODERATE: "#f1c40f",
    MEDIUM:   "#f1c40f",
    HIGH:     "#e67e22",
    CRITICAL: "#e74c3c",
};

const riskColor = (level) => RISK_COLORS[level?.toUpperCase()] ?? "#cccccc";

const SKOPJE_GEOJSON = {
    type: "FeatureCollection",
    features: [
        {
            type: "Feature",
            properties: { name: "Karpoš" },
            geometry: {
                type: "Polygon",
                coordinates: [[[21.358,41.958],[21.358,42.022],[21.395,42.018],[21.410,42.005],[21.412,41.975],[21.400,41.958]]]
            }
        },
        {
            type: "Feature",
            properties: { name: "Centar" },
            geometry: {
                type: "Polygon",
                coordinates: [[[21.412,41.972],[21.412,42.002],[21.432,42.002],[21.455,41.998],[21.455,41.972]]]
            }
        },
        {
            type: "Feature",
            properties: { name: "Stara Čaršija" },
            geometry: {
                type: "Polygon",
                coordinates: [[[21.432,42.002],[21.432,42.018],[21.458,42.018],[21.458,42.002]]]
            }
        },
        {
            type: "Feature",
            properties: { name: "Čair" },
            geometry: {
                type: "Polygon",
                coordinates: [[[21.458,41.998],[21.458,42.030],[21.500,42.030],[21.500,41.998]]]
            }
        },
        {
            type: "Feature",
            properties: { name: "Butel" },
            geometry: {
                type: "Polygon",
                coordinates: [[[21.395,42.018],[21.395,42.068],[21.500,42.068],[21.500,42.030],[21.458,42.018],[21.432,42.018],[21.410,42.005]]]
            }
        },
        {
            type: "Feature",
            properties: { name: "Aerodrom" },
            geometry: {
                type: "Polygon",
                coordinates: [[[21.400,41.938],[21.400,41.972],[21.455,41.972],[21.455,41.938]]]
            }
        },
        {
            type: "Feature",
            properties: { name: "Kisela Voda" },
            geometry: {
                type: "Polygon",
                coordinates: [[[21.455,41.935],[21.455,41.998],[21.540,41.998],[21.540,41.935]]]
            }
        },
        {
            type: "Feature",
            properties: { name: "Gazi Baba" },
            geometry: {
                type: "Polygon",
                coordinates: [[[21.500,41.998],[21.500,42.068],[21.570,42.068],[21.570,41.998]]]
            }
        },
    ]
};

const ZONE_NAMES = ["Karpoš", "Kisela Voda", "Gazi Baba", "Centar", "Butel", "Aerodrom", "Čair", "Stara Čaršija"];

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

const TEMP_OPTIONS = [
    { label: "Cool    (18 °C)", value: 18 },
    { label: "Mild    (24 °C)", value: 24 },
    { label: "Warm    (30 °C)", value: 30 },
    { label: "Hot     (36 °C)", value: 36 },
    { label: "Extreme (42 °C)", value: 42 },
];

const worstRisk = (risks) => {
    const order = { LOW: 0, MODERATE: 1, MEDIUM: 1, HIGH: 2, CRITICAL: 3 };
    const labels = ["LOW", "MODERATE", "HIGH", "CRITICAL"];
    const max = risks.reduce((m, r) => Math.max(m, order[r?.toUpperCase()] ?? 0), 0);
    return labels[max] ?? "LOW";
};

const avgOf = (arr) => arr.reduce((s, v) => s + (v ?? 0), 0) / arr.length;

const deriveSummary = (zones) => ({
    predictedTemperature: avgOf(zones.map(z => z.predictedTemperature)),
    predictedPollution:   avgOf(zones.map(z => z.predictedPollution)),
    predictedTraffic:     avgOf(zones.map(z => z.predictedTraffic)),
    heatRiskLevel:    worstRisk(zones.map(z => z.heatRiskLevel)),
    airRiskLevel:     worstRisk(zones.map(z => z.airRiskLevel)),
    trafficRiskLevel: worstRisk(zones.map(z => z.trafficRiskLevel)),
    overallRiskLevel: worstRisk(zones.map(z => z.overallRiskLevel)),
});

const Prediction = () => {
    const [form, setForm] = useState({
        date:        "",
        time:        "",
        zone:        "",
        type:        "",
        temperature: "",
    });
    const [result,       setResult]       = useState(null);
    const [zones,        setZones]        = useState([]);
    const [selectedZone, setSelectedZone] = useState(null); // captured at generate time
    const [loading,      setLoading]      = useState(false);
    const [error,        setError]        = useState(null);
    const geoJsonRef = useRef(null);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const buildBody = () => ({
        date:        form.date        || null,
        time:        form.time        || null,
        zone:        (form.zone && form.zone !== "All Zones") ? form.zone : null,
        type:        form.type        || "all",
        temperature: form.temperature !== "" ? parseFloat(form.temperature) : null,
    });

    const handleGenerate = async () => {
        setLoading(true);
        setError(null);
        try {
            const body = buildBody();
            const zoneName = form.zone && form.zone !== "All Zones" ? form.zone : null;
            const res = await fetch("/api/predict/zones", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            if (!res.ok) throw new Error("Prediction failed");
            const zoneData = await res.json();
            setZones(zoneData);
            setSelectedZone(zoneName);

            const summary = zoneName
                ? (zoneData.find(z => z.zoneName === zoneName) ?? deriveSummary(zoneData))
                : deriveSummary(zoneData);
            setResult(summary);

            if (geoJsonRef.current) geoJsonRef.current.clearLayers().addData(SKOPJE_GEOJSON);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setForm({ date: "", time: "", zone: "", type: "", temperature: "" });
        setResult(null);
        setZones([]);
        setSelectedZone(null);
        setError(null);
        if (geoJsonRef.current) geoJsonRef.current.clearLayers().addData(SKOPJE_GEOJSON);
    };

    const handleExport = () => {
        if (!zones.length) return;
        const rows = [
            "zone,temperature,pm25,vehicles,heatRisk,airRisk,trafficRisk,overallRisk",
            ...zones.map(z =>
                `${z.zoneName},${z.predictedTemperature},${z.predictedPollution},${z.predictedTraffic},${z.heatRiskLevel},${z.airRiskLevel},${z.trafficRiskLevel},${z.overallRiskLevel}`
            ),
        ].join("\n");
        const a = Object.assign(document.createElement("a"), {
            href: URL.createObjectURL(new Blob([rows], { type: "text/csv" })),
            download: "prediction_zones.csv",
        });
        a.click();
        URL.revokeObjectURL(a.href);
    };

    const zoneByName = (name) => zones.find(z => z.zoneName === name);

    const geoJsonStyle = (feature) => {
        const zone = zoneByName(feature.properties.name);
        const isHighlighted = !selectedZone || feature.properties.name === selectedZone;
        const color = (isHighlighted && zone) ? riskColor(zone.overallRiskLevel) : "#cccccc";
        return {
            fillColor:   color,
            color:       "#ffffff",
            weight:      isHighlighted ? 2.5 : 1.5,
            fillOpacity: isHighlighted && zones.length ? 0.65 : 0.2,
        };
    };

    const onEachFeature = (feature, layer) => {
        const zone = zoneByName(feature.properties.name);
        const isHighlighted = !selectedZone || feature.properties.name === selectedZone;
        if (zone && isHighlighted) {
            layer.bindPopup(`
                <strong>${zone.zoneName}</strong><br/>
                🌡 ${zone.predictedTemperature} °C &mdash; <em>${zone.heatRiskLevel}</em><br/>
                💨 ${zone.predictedPollution} µg/m³ &mdash; <em>${zone.airRiskLevel}</em><br/>
                🚗 ${zone.predictedTraffic} vehicles &mdash; <em>${zone.trafficRiskLevel}</em><br/>
                <strong>Overall: ${zone.overallRiskLevel}</strong>
            `);
        } else {
            layer.bindTooltip(feature.properties.name, { permanent: true, direction: "center", className: "zone-label" });
        }
    };

    const zoneLabel = selectedZone ?? "All Zones";

    return (
        <div className="prediction-container">

            <div className="hero">
                <h1>Prediction</h1>
                <p>Select parameters below to generate predictions for Skopje zones</p>
            </div>

            {/* ── Parameters form ── */}
            <div className="prediction-box">
                <h3>Prediction Parameters</h3>

                <div className="form-grid">
                    <div className="form-group">
                        <label>Select Date</label>
                        <input type="date" name="date" value={form.date} onChange={handleChange} />
                    </div>

                    <div className="form-group">
                        <label>Select Time</label>
                        <select name="time" value={form.time} onChange={handleChange}>
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
                        {loading ? "Running…" : "Generate Prediction"}
                    </button>
                </div>

                {error && <p className="pred-error">{error}</p>}
            </div>

            {/* ── Map + results ── */}
            <div className="secondDiv">
                <div className="controls">
                    <div className="controls-left">
                        <h3>Prediction for {zoneLabel}</h3>
                    </div>
                </div>

                <div className="map-wrapper">
                    <MapContainer center={SKOPJE_CENTER} zoom={12} style={{ height: "450px", width: "100%", borderRadius: "10px" }} scrollWheelZoom={true}>
                        <TileLayer
                            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                        />
                        <GeoJSON
                            key={zones.length}
                            ref={geoJsonRef}
                            data={SKOPJE_GEOJSON}
                            style={geoJsonStyle}
                            onEachFeature={onEachFeature}
                        />
                    </MapContainer>

                    <div className="map-legend">
                        <span style={{ background: RISK_COLORS.LOW      }}>Low</span>
                        <span style={{ background: RISK_COLORS.MODERATE  }}>Moderate</span>
                        <span style={{ background: RISK_COLORS.HIGH      }}>High</span>
                        <span style={{ background: RISK_COLORS.CRITICAL  }}>Critical</span>
                    </div>

                    {!zones.length && !loading && (
                        <div className="map-hint">Generate a prediction to colour the zones</div>
                    )}
                </div>

                {/* Summary cards */}
                {result && (
                    <div className="results-grid">
                        <div className="result-card">
                            <span className="result-label">Temperature</span>
                            <span className="result-value">{result.predictedTemperature?.toFixed(1)} °C</span>
                            <span className="result-badge" style={{ background: riskColor(result.heatRiskLevel) }}>{result.heatRiskLevel}</span>
                        </div>
                        <div className="result-card">
                            <span className="result-label">PM2.5 Pollution</span>
                            <span className="result-value">{result.predictedPollution?.toFixed(1)} µg/m³</span>
                            <span className="result-badge" style={{ background: riskColor(result.airRiskLevel) }}>{result.airRiskLevel}</span>
                        </div>
                        <div className="result-card">
                            <span className="result-label">Traffic (vehicles)</span>
                            <span className="result-value">{result.predictedTraffic?.toFixed(0)}</span>
                            <span className="result-badge" style={{ background: riskColor(result.trafficRiskLevel) }}>{result.trafficRiskLevel}</span>
                        </div>
                        <div className="result-card overall-card">
                            <span className="result-label">Overall Risk</span>
                            <span className="result-badge overall-badge" style={{ background: riskColor(result.overallRiskLevel) }}>{result.overallRiskLevel}</span>
                        </div>
                    </div>
                )}
            </div>

        </div>
    );
};

export default Prediction;
