package com.example.smartcity.service.application;

import com.example.smartcity.model.dto.create.CreateScenarioDto;
import com.example.smartcity.model.dto.display.DisplayScenarioDto;

import java.util.List;
import java.util.Optional;

public interface ScenarioApplicationService {
    List<DisplayScenarioDto> findAll();
    Optional<DisplayScenarioDto> findById(Long id);
    DisplayScenarioDto save(CreateScenarioDto createScenarioDto);
}