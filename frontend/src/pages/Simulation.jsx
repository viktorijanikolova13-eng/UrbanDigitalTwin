import React, { useState, useRef } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "../styles/Simulation.css";
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

// Approximate GeoJSON polygon boundaries for Skopje municipalities
// Coordinates are [longitude, latitude] (GeoJSON standard)
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

const Simulation = () => {
    const [form, setForm] = useState({
        temperatureDelta:    "",
        trafficMultiplier:   "",
        pollutionMultiplier: "",
        heatRiskLevel:       "",
    });
    const [result,  setResult]  = useState(null);
    const [zones,   setZones]   = useState([]);
    const [loading, setLoading] = useState(false);
    const [error,   setError]   = useState(null);
    const geoJsonRef = useRef(null);

    const handleChange = (e) =>
        setForm({ ...form, [e.target.name]: e.target.value });

    const buildBody = () => ({
        temperatureDelta:    form.temperatureDelta    !== "" ? parseFloat(form.temperatureDelta)    : null,
        trafficMultiplier:   form.trafficMultiplier   !== "" ? parseFloat(form.trafficMultiplier)   : null,
        pollutionMultiplier: form.pollutionMultiplier !== "" ? parseFloat(form.pollutionMultiplier) : null,
        heatRiskLevel:       form.heatRiskLevel || null,
    });

    const handleApply = async () => {
        setLoading(true);
        setError(null);
        try {
            const body = buildBody();
            const [summaryRes, zonesRes] = await Promise.all([
                fetch("/api/simulate",       { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...body, type: "all" }) }),
                fetch("/api/simulate/zones", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
            ]);
            if (!summaryRes.ok || !zonesRes.ok) throw new Error("Simulation failed");
            const [summary, zoneData] = await Promise.all([summaryRes.json(), zonesRes.json()]);
            setResult(summary);
            setZones(zoneData);
            // force GeoJSON layer to re-render with new colors
            if (geoJsonRef.current) geoJsonRef.current.clearLayers().addData(SKOPJE_GEOJSON);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setForm({ temperatureDelta: "", trafficMultiplier: "", pollutionMultiplier: "", heatRiskLevel: "" });
        setResult(null);
        setZones([]);
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
            download: "simulation_zones.csv"
        });
        a.click();
        URL.revokeObjectURL(a.href);
    };

    const zoneByName = (name) => zones.find(z => z.zoneName === name);

    const geoJsonStyle = (feature) => {
        const zone = zoneByName(feature.properties.name);
        const color = zone ? riskColor(zone.overallRiskLevel) : "#cccccc";
        return {
            fillColor:   color,
            color:       "#ffffff",
            weight:      2,
            fillOpacity: zones.length ? 0.65 : 0.25,
        };
    };

    const onEachFeature = (feature, layer) => {
        const zone = zoneByName(feature.properties.name);
        if (zone) {
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

    return (
        <div className="simulation-container">

            <div className="hero">
                <h1>Simulation</h1>
                <p>Apply scenario adjustments and see risk levels across Skopje zones</p>
            </div>

            {/* ── Scenario form ── */}
            <div className="simulation-box">
                <h3>Scenario Adjustments</h3>

                <div className="adjustments-grid">
                    <div className="adjustment">
                        <label>Temperature Delta (°C)</label>
                        <input type="number" name="temperatureDelta" placeholder="e.g. +5 or -3" value={form.temperatureDelta} onChange={handleChange} />
                    </div>
                    <div className="adjustment">
                        <label>Traffic Multiplier</label>
                        <input type="number" step="0.1" name="trafficMultiplier" placeholder="e.g. 1.5" value={form.trafficMultiplier} onChange={handleChange} />
                    </div>
                    <div className="adjustment">
                        <label>Pollution Multiplier</label>
                        <input type="number" step="0.1" name="pollutionMultiplier" placeholder="e.g. 1.2" value={form.pollutionMultiplier} onChange={handleChange} />
                    </div>
                    <div className="adjustment">
                        <label>Heat Risk Override</label>
                        <select name="heatRiskLevel" value={form.heatRiskLevel} onChange={handleChange}>
                            <option value="" disabled hidden>Select level</option>
                            <option value="LOW">Low</option>
                            <option value="MODERATE">Moderate</option>
                            <option value="HIGH">High</option>
                        </select>
                    </div>
                </div>

                <div className="actions">
                    <button className="apply-btn" onClick={handleApply} disabled={loading}>
                        {loading ? "Running…" : "Apply Scenario"}
                    </button>
                    <button className="reset-btn" onClick={handleReset}>Reset</button>
                </div>

                {error && <p className="sim-error">{error}</p>}
            </div>

            {/* ── Map + results ── */}
            <div className="secondDiv">
                <div className="controls">
                    <div className="controls-left"><h3>Skopje Zone Map</h3></div>
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
                        <div className="map-hint">Apply a scenario to colour the zones</div>
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

export default Simulation;
