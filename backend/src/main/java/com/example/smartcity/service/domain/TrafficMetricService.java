package com.example.smartcity.service.domain;

import com.example.smartcity.model.domain.TrafficMetric;

import java.util.List;
import java.util.Optional;

public interface TrafficMetricService {
    List<TrafficMetric> findAll();
    Optional<TrafficMetric> findById(Long id);
    TrafficMetric save(TrafficMetric trafficMetric);
}