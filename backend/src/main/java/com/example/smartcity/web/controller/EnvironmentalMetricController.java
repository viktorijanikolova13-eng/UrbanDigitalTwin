package com.example.smartcity.web.controller;

import com.example.smartcity.model.dto.create.CreateEnvironmentalMetricDto;
import com.example.smartcity.model.dto.display.DisplayEnvironmentalMetricDto;
import com.example.smartcity.service.application.EnvironmentalMetricApplicationService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/environmental-metrics")
public class EnvironmentalMetricController {

    private final EnvironmentalMetricApplicationService environmentalMetricApplicationService;

    public EnvironmentalMetricController(EnvironmentalMetricApplicationService environmentalMetricApplicationService) {
        this.environmentalMetricApplicationService = environmentalMetricApplicationService;
    }

    @GetMapping
    public List<DisplayEnvironmentalMetricDto> findAll() {
        return environmentalMetricApplicationService.findAll();
    }

    @GetMapping("/{id}")
    public Optional<DisplayEnvironmentalMetricDto> findById(@PathVariable Long id) {
        return environmentalMetricApplicationService.findById(id);
    }

    @PostMapping("/add")
    public DisplayEnvironmentalMetricDto save(@RequestBody CreateEnvironmentalMetricDto createEnvironmentalMetricDto) {
        return environmentalMetricApplicationService.save(createEnvironmentalMetricDto);
    }
}