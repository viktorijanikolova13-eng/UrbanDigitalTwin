package com.example.smartcity.service.application.impl;

import com.example.smartcity.model.domain.Location;
import com.example.smartcity.model.domain.Scenario;
import com.example.smartcity.model.dto.create.CreateScenarioDto;
import com.example.smartcity.model.dto.display.DisplayScenarioDto;
import com.example.smartcity.service.application.ScenarioApplicationService;
import com.example.smartcity.service.domain.LocationService;
import com.example.smartcity.service.domain.ScenarioService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ScenarioApplicationServiceImpl implements ScenarioApplicationService {

    private final ScenarioService scenarioService;
    private final LocationService locationService;

    public ScenarioApplicationServiceImpl(
            ScenarioService scenarioService,
            LocationService locationService
    ) {
        this.scenarioService = scenarioService;
        this.locationService = locationService;
    }

    @Override
    public List<DisplayScenarioDto> findAll() {
        return scenarioService.findAll()
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public Optional<DisplayScenarioDto> findById(Long id) {
        return scenarioService.findById(id).map(this::toDto);
    }

    @Override
    public DisplayScenarioDto save(CreateScenarioDto dto) {

        Location location = locationService.findById(dto.getLocationId())
                .orElseThrow(() -> new RuntimeException("Location not found"));

        Scenario scenario = new Scenario();
        scenario.setName(dto.getName());
        scenario.setDescription(dto.getDescription());
        scenario.setTemperatureDelta(dto.getTemperatureDelta());
        scenario.setPollutionMultiplier(dto.getPollutionMultiplier());
        scenario.setTrafficMultiplier(dto.getTrafficMultiplier());
        scenario.setRoadClosure(dto.getRoadClosure());
        scenario.setCreatedAt(dto.getCreatedAt());
        scenario.setLocation(location);

        return toDto(scenarioService.save(scenario));
    }

    private DisplayScenarioDto toDto(Scenario s) {
        DisplayScenarioDto dto = new DisplayScenarioDto();

        dto.setId(s.getId());
        dto.setName(s.getName());
        dto.setDescription(s.getDescription());
        dto.setTemperatureDelta(s.getTemperatureDelta());
        dto.setPollutionMultiplier(s.getPollutionMultiplier());
        dto.setTrafficMultiplier(s.getTrafficMultiplier());
        dto.setRoadClosure(s.getRoadClosure());
        dto.setCreatedAt(s.getCreatedAt());

        if (s.getLocation() != null) {
            dto.setLocationId(s.getLocation().getId());
            dto.setLocationName(s.getLocation().getName());
        }

        return dto;
    }
}