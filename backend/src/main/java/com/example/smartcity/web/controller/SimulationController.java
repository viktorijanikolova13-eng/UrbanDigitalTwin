package com.example.smartcity.web.controller;

import com.example.smartcity.model.dto.display.DisplaySimulationResultDto;
import com.example.smartcity.service.application.SimulationApplicationService;
import com.example.smartcity.model.dto.create.SimulateRequestDto;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/simulations")
public class SimulationController {

    private final SimulationApplicationService simulationApplicationService;

    public SimulationController(SimulationApplicationService simulationApplicationService) {
        this.simulationApplicationService = simulationApplicationService;
    }

    @PostMapping("/run/{scenarioId}")
    public DisplaySimulationResultDto runSimulation(@PathVariable Long scenarioId) {
        return simulationApplicationService.runSimulation(scenarioId);
    }

    @GetMapping
    public List<DisplaySimulationResultDto> findAll() {
        return simulationApplicationService.findAll();
    }

    @PostMapping("/simulate")
    public DisplaySimulationResultDto simulate(@RequestBody SimulateRequestDto request) {
        return simulationApplicationService.simulate(request);
    }

}