package com.example.smartcity.service.domain;

import com.example.smartcity.model.domain.EnvironmentalMetric;

import java.util.List;
import java.util.Optional;

public interface EnvironmentalMetricService {
    List<EnvironmentalMetric> findAll();
    Optional<EnvironmentalMetric> findById(Long id);
    EnvironmentalMetric save(EnvironmentalMetric environmentalMetric);
}