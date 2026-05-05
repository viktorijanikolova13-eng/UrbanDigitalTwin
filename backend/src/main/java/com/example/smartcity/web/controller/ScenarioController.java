package com.example.smartcity.web.controller;

import com.example.smartcity.model.dto.create.CreateScenarioDto;
import com.example.smartcity.model.dto.display.DisplayScenarioDto;
import com.example.smartcity.service.application.ScenarioApplicationService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/scenarios")
public class ScenarioController {

    private final ScenarioApplicationService scenarioApplicationService;

    public ScenarioController(ScenarioApplicationService scenarioApplicationService) {
        this.scenarioApplicationService = scenarioApplicationService;
    }

    @GetMapping
    public List<DisplayScenarioDto> findAll() {
        return scenarioApplicationService.findAll();
    }

    @GetMapping("/{id}")
    public Optional<DisplayScenarioDto> findById(@PathVariable Long id) {
        return scenarioApplicationService.findById(id);
    }

    @PostMapping("/add")
    public DisplayScenarioDto save(@RequestBody CreateScenarioDto dto) {
        return scenarioApplicationService.save(dto);
    }
}