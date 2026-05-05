import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "../styles/Home.css";
import { FaCar, FaFileExport, FaFire, FaIndustry, FaThermometerHalf, FaSyncAlt } from "react-icons/fa";

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
        { type: "Feature", properties: { name: "Karpoš" },        geometry: { type: "Polygon", coordinates: [[[21.358,41.958],[21.358,42.022],[21.395,42.018],[21.410,42.005],[21.412,41.975],[21.400,41.958]]] } },
        { type: "Feature", properties: { name: "Centar" },         geometry: { type: "Polygon", coordinates: [[[21.412,41.972],[21.412,42.002],[21.432,42.002],[21.455,41.998],[21.455,41.972]]] } },
        { type: "Feature", properties: { name: "Stara Čaršija" },  geometry: { type: "Polygon", coordinates: [[[21.432,42.002],[21.432,42.018],[21.458,42.018],[21.458,42.002]]] } },
        { type: "Feature", properties: { name: "Čair" },           geometry: { type: "Polygon", coordinates: [[[21.458,41.998],[21.458,42.030],[21.500,42.030],[21.500,41.998]]] } },
        { type: "Feature", properties: { name: "Butel" },          geometry: { type: "Polygon", coordinates: [[[21.395,42.018],[21.395,42.068],[21.500,42.068],[21.500,42.030],[21.458,42.018],[21.432,42.018],[21.410,42.005]]] } },
        { type: "Feature", properties: { name: "Aerodrom" },       geometry: { type: "Polygon", coordinates: [[[21.400,41.938],[21.400,41.972],[21.455,41.972],[21.455,41.938]]] } },
        { type: "Feature", properties: { name: "Kisela Voda" },    geometry: { type: "Polygon", coordinates: [[[21.455,41.935],[21.455,41.998],[21.540,41.998],[21.540,41.935]]] } },
        { type: "Feature", properties: { name: "Gazi Baba" },      geometry: { type: "Polygon", coordinates: [[[21.500,41.998],[21.500,42.068],[21.570,42.068],[21.570,41.998]]] } },
    ]
};

const METRIC_TABS = [
    { name: "Pollution",    key: "pollution",    icon: <FaIndustry />,        riskField: "airRiskLevel",     valueField: "predictedPollution",   unit: "µg/m³" },
    { name: "Traffic",      key: "traffic",      icon: <FaCar />,             riskField: "trafficRiskLevel", valueField: "predictedTraffic",     unit: "vehicles" },
    { name: "Temperature",  key: "temperature",  icon: <FaThermometerHalf />, riskField: "heatRiskLevel",    valueField: "predictedTemperature", unit: "°C" },
    { name: "Heat Risk",    key: "heat-risk",    icon: <FaFire />,            riskField: "overallRiskLevel", valueField: null,                   unit: "" },
];

const REFRESH_OPTIONS = [
    { label: "Auto Refresh: 2 min", ms: 120_000 },
    { label: "Auto Refresh: 5 min", ms: 300_000 },
    { label: "Auto Refresh: 10 min", ms: 600_000 },
];

const Home = () => {
    const [activeKey,    setActiveKey]    = useState("pollution");
    const [zones,        setZones]        = useState([]);
    const [clickedZone,  setClickedZone]  = useState(null);
    const [loading,      setLoading]      = useState(false);
    const [refreshMs,    setRefreshMs]    = useState(120_000);
    const geoJsonRef = useRef(null);
    const zonesRef   = useRef([]);

    // Assign synchronously during render so geoJsonStyle always sees current zones
    zonesRef.current = zones;

    const fetchZones = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/predict/zones", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type: "all" }),
            });
            if (!res.ok) return;
            const data = await res.json();
            setZones(data);
        } finally {
            setLoading(false);
        }
    };

    // initial load
    useEffect(() => { fetchZones(); }, []);

    // auto-refresh
    useEffect(() => {
        const id = setInterval(fetchZones, refreshMs);
        return () => clearInterval(id);
    }, [refreshMs]);

    const activeTab = METRIC_TABS.find(t => t.key === activeKey);

    const zoneByName = (name) => zonesRef.current.find(z => z.zoneName === name);

    const geoJsonStyle = (feature) => {
        const zone = zoneByName(feature.properties.name);
        const color = zone ? riskColor(zone[activeTab.riskField]) : "#cccccc";
        return {
            fillColor:   color,
            color:       "#fff",
            weight:      2,
            fillOpacity: zonesRef.current.length ? 0.65 : 0.2,
        };
    };

    const onEachFeature = (feature, layer) => {
        layer.on("click", () => {
            const zone = zoneByName(feature.properties.name);
            setClickedZone(zone ?? null);
        });
        layer.bindTooltip(feature.properties.name, {
            permanent: true, direction: "center", className: "zone-label"
        });
    };

    const handleTabClick = (key) => {
        setActiveKey(key);
        setClickedZone(null);
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
            download: "home_zones.csv",
        });
        a.click();
        URL.revokeObjectURL(a.href);
    };

    return (
        <div className="home-container">

            <div className="hero">
                <h1>Monitor different zones in real-time</h1>
                <p>Select the type of data you'd like to visualize</p>

                <div className="zone-grid">
                    {METRIC_TABS.map((t) => (
                        <div
                            key={t.key}
                            className={`zone-card ${activeKey === t.key ? "zone-card--active" : ""}`}
                            onClick={() => handleTabClick(t.key)}
                        >
                            <div className="zone-icon">{t.icon}</div>
                            <div className="zone-label">{t.name}</div>
                        </div>
                    ))}
                </div>

                <div className="scroll-hint">
                    <hr />
                    <p>Click a zone on the map to see details</p>
                </div>
            </div>

            <div className="secondDiv">

                <div className="controls">
                    <div className="controls-left">
                        <select
                            className="select-box"
                            value={activeKey}
                            onChange={(e) => handleTabClick(e.target.value)}
                        >
                            {METRIC_TABS.map(t => (
                                <option key={t.key} value={t.key}>View: {t.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="controls-right">
                        <select
                            className="select-box"
                            value={refreshMs}
                            onChange={(e) => setRefreshMs(Number(e.target.value))}
                        >
                            {REFRESH_OPTIONS.map(o => (
                                <option key={o.ms} value={o.ms}>{o.label}</option>
                            ))}
                        </select>

                        <button className="export-icon refresh-btn" title="Refresh now" onClick={fetchZones} disabled={loading}>
                            <FaSyncAlt className={loading ? "spinning" : ""} />
                        </button>

                        <button className="export-icon" title="Export CSV" onClick={handleExport} disabled={!zones.length}>
                            <FaFileExport />
                        </button>
                    </div>
                </div>

                <div className="map-wrapper-home">
                    <MapContainer
                        center={SKOPJE_CENTER}
                        zoom={12}
                        style={{ height: "450px", width: "100%", borderRadius: "10px" }}
                        scrollWheelZoom={true}
                    >
                        <TileLayer
                            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                        />
                        <GeoJSON
                            key={activeKey + "_" + zones.length}
                            ref={geoJsonRef}
                            data={SKOPJE_GEOJSON}
                            style={geoJsonStyle}
                            onEachFeature={onEachFeature}
                        />
                    </MapContainer>

                    {/* ── Clicked-zone tooltip overlay ── */}
                    {clickedZone && (
                        <div className="zone-tooltip-overlay">
                            <div className="zone-tooltip-title">{clickedZone.zoneName}</div>
                            {activeKey === "pollution" && <>
                                <div className="zone-tooltip-row"><span>PM2.5</span><strong>{clickedZone.predictedPollution?.toFixed(1)} µg/m³</strong></div>
                                <div className="zone-tooltip-row"><span>Air Risk</span><strong style={{ color: riskColor(clickedZone.airRiskLevel) }}>{clickedZone.airRiskLevel}</strong></div>
                            </>}
                            {activeKey === "traffic" && <>
                                <div className="zone-tooltip-row"><span>Vehicles</span><strong>{clickedZone.predictedTraffic?.toFixed(0)}</strong></div>
                                <div className="zone-tooltip-row"><span>Traffic Risk</span><strong style={{ color: riskColor(clickedZone.trafficRiskLevel) }}>{clickedZone.trafficRiskLevel}</strong></div>
                            </>}
                            {activeKey === "temperature" && <>
                                <div className="zone-tooltip-row"><span>Temperature</span><strong>{clickedZone.predictedTemperature?.toFixed(1)} °C</strong></div>
                                <div className="zone-tooltip-row"><span>Heat Risk</span><strong style={{ color: riskColor(clickedZone.heatRiskLevel) }}>{clickedZone.heatRiskLevel}</strong></div>
                            </>}
                            {activeKey === "heat-risk" && <>
                                <div className="zone-tooltip-row"><span>Temperature</span><strong>{clickedZone.predictedTemperature?.toFixed(1)} °C</strong></div>
                                <div className="zone-tooltip-row"><span>PM2.5</span><strong>{clickedZone.predictedPollution?.toFixed(1)} µg/m³</strong></div>
                                <div className="zone-tooltip-row"><span>Vehicles</span><strong>{clickedZone.predictedTraffic?.toFixed(0)}</strong></div>
                            </>}
                            <div className="zone-tooltip-row overall-row">
                                <span>Overall Risk</span>
                                <strong style={{ background: riskColor(clickedZone.overallRiskLevel) }} className="risk-badge">
                                    {clickedZone.overallRiskLevel}
                                </strong>
                            </div>
                            <button className="tooltip-close" onClick={() => setClickedZone(null)}>✕</button>
                        </div>
                    )}

                    {/* ── Legend ── */}
                    <div className="map-legend-home">
                        {Object.entries(RISK_COLORS).filter(([k]) => !["MEDIUM"].includes(k)).map(([k, v]) => (
                            <span key={k} style={{ background: v }}>{k.charAt(0) + k.slice(1).toLowerCase()}</span>
                        ))}
                    </div>

                    {!zones.length && !loading && (
                        <div className="map-hint-home">Loading zone data…</div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default Home;
