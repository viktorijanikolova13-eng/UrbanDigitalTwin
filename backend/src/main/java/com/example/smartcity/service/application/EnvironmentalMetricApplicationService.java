package com.example.smartcity.service.application;

import com.example.smartcity.model.dto.create.CreateEnvironmentalMetricDto;
import com.example.smartcity.model.dto.display.DisplayEnvironmentalMetricDto;

import java.util.List;
import java.util.Optional;

public interface EnvironmentalMetricApplicationService {
    List<DisplayEnvironmentalMetricDto> findAll();
    Optional<DisplayEnvironmentalMetricDto> findById(Long id);
    DisplayEnvironmentalMetricDto save(CreateEnvironmentalMetricDto createEnvironmentalMetricDto);
}