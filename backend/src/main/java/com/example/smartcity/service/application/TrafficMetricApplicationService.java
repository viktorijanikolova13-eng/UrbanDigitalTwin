package com.example.smartcity.service.application;

import com.example.smartcity.model.dto.create.CreateTrafficMetricDto;
import com.example.smartcity.model.dto.display.DisplayTrafficMetricDto;

import java.util.List;
import java.util.Optional;

public interface TrafficMetricApplicationService {
    List<DisplayTrafficMetricDto> findAll();
    Optional<DisplayTrafficMetricDto> findById(Long id);
    DisplayTrafficMetricDto save(CreateTrafficMetricDto createTrafficMetricDto);
}