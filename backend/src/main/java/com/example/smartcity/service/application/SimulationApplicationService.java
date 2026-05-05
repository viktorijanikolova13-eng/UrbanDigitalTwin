package com.example.smartcity.service.application;

import com.example.smartcity.model.dto.create.SimulateRequestDto;
import com.example.smartcity.model.dto.display.DisplaySimulationResultDto;
import com.example.smartcity.model.dto.display.ZoneSimulationResultDto;

import java.util.List;

public interface SimulationApplicationService {

    DisplaySimulationResultDto runSimulation(Long scenarioId);
    DisplaySimulationResultDto simulate(SimulateRequestDto request);
    List<ZoneSimulationResultDto> simulateZones(SimulateRequestDto request);
    List<DisplaySimulationResultDto> findAll();
}
