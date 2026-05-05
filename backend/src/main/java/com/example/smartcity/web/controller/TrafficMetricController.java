package com.example.smartcity.web.controller;

import com.example.smartcity.model.dto.create.CreateTrafficMetricDto;
import com.example.smartcity.model.dto.display.DisplayTrafficMetricDto;
import com.example.smartcity.service.application.TrafficMetricApplicationService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/traffic-metrics")
public class TrafficMetricController {

    private final TrafficMetricApplicationService trafficMetricApplicationService;

    public TrafficMetricController(TrafficMetricApplicationService trafficMetricApplicationService) {
        this.trafficMetricApplicationService = trafficMetricApplicationService;
    }

    @GetMapping
    public List<DisplayTrafficMetricDto> findAll() {
        return trafficMetricApplicationService.findAll();
    }

    @GetMapping("/{id}")
    public Optional<DisplayTrafficMetricDto> findById(@PathVariable Long id) {
        return trafficMetricApplicationService.findById(id);
    }

    @PostMapping("/add")
    public DisplayTrafficMetricDto save(@RequestBody CreateTrafficMetricDto createTrafficMetricDto) {
        return trafficMetricApplicationService.save(createTrafficMetricDto);
    }
}