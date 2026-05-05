package com.example.smartcity.service.application.impl;

import com.example.smartcity.model.domain.Scenario;
import com.example.smartcity.model.domain.SimulationResult;
import com.example.smartcity.model.dto.create.SimulateRequestDto;
import com.example.smartcity.model.dto.display.DisplaySimulationResultDto;
import com.example.smartcity.model.dto.display.ZoneSimulationResultDto;
import com.example.smartcity.service.application.SimulationApplicationService;
import com.example.smartcity.service.domain.LocationService;
import com.example.smartcity.service.domain.ScenarioService;
import com.example.smartcity.service.domain.SimulationEngine;
import com.example.smartcity.service.domain.SimulationResultService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class SimulationApplicationServiceImpl implements SimulationApplicationService {

    private final ScenarioService scenarioService;
    private final LocationService locationService;
    private final SimulationResultService simulationResultService;
    private final SimulationEngine simulationEngine;

    public SimulationApplicationServiceImpl(
            ScenarioService scenarioService,
            LocationService locationService,
            SimulationResultService simulationResultService,
            SimulationEngine simulationEngine
    ) {
        this.scenarioService = scenarioService;
        this.locationService = locationService;
        this.simulationResultService = simulationResultService;
        this.simulationEngine = simulationEngine;
    }

    @Override
    public DisplaySimulationResultDto simulate(SimulateRequestDto request) {
        return simulationEngine.simulate(request);
    }

    @Override
    public List<ZoneSimulationResultDto> simulateZones(SimulateRequestDto request) {
        return simulationEngine.simulateZones(request);
    }

    @Override
    public DisplaySimulationResultDto runSimulation(Long scenarioId) {
        Scenario scenario = scenarioService.findById(scenarioId)
                .orElseThrow(() -> new RuntimeException("Scenario not found"));

        SimulateRequestDto request = new SimulateRequestDto();
        request.setType("all");
        request.setTrafficMultiplier(scenario.getTrafficMultiplier());
        request.setTemperatureDelta(scenario.getTemperatureDelta());
        request.setPollutionMultiplier(scenario.getPollutionMultiplier());
        request.setRoadClosure(scenario.getRoadClosure());
        request.setLocationId(scenario.getLocation().getId());

        return simulationEngine.simulate(request);
    }

    @Override
    public List<DisplaySimulationResultDto> findAll() {
        return simulationResultService.findAll()
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    private DisplaySimulationResultDto toDto(SimulationResult r) {
        DisplaySimulationResultDto dto = new DisplaySimulationResultDto();

        dto.setId(r.getId());
        dto.setPredictedTemperature(r.getPredictedTemperature());
        dto.setPredictedPollution(r.getPredictedPollution());
        dto.setPredictedTraffic(r.getPredictedTraffic());
        dto.setHeatRiskLevel(r.getHeatRiskLevel());
        dto.setAirRiskLevel(r.getAirRiskLevel());
        dto.setTrafficRiskLevel(r.getTrafficRiskLevel());
        dto.setOverallRiskLevel(r.getOverallRiskLevel());
        dto.setGeneratedAt(r.getGeneratedAt());

        if (r.getScenario() != null) {
            dto.setScenarioId(r.getScenario().getId());
        }

        if (r.getLocation() != null) {
            dto.setLocationId(r.getLocation().getId());
        }

        return dto;
    }
}