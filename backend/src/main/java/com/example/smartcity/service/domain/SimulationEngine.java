package com.example.smartcity.service.domain;

import com.example.smartcity.model.dto.create.SimulateRequestDto;
import com.example.smartcity.model.dto.display.DisplaySimulationResultDto;
import com.example.smartcity.model.dto.display.ZoneSimulationResultDto;

import java.util.List;

public interface SimulationEngine {

    DisplaySimulationResultDto simulate(SimulateRequestDto request);

    List<ZoneSimulationResultDto> simulateZones(SimulateRequestDto request);
}
