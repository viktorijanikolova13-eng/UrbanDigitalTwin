package com.example.smartcity.service.domain.impl;

import com.example.smartcity.model.domain.TrafficMetric;
import com.example.smartcity.repository.TrafficMetricRepository;
import com.example.smartcity.service.domain.TrafficMetricService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class TrafficMetricServiceImpl implements TrafficMetricService {

    private final TrafficMetricRepository trafficMetricRepository;

    public TrafficMetricServiceImpl(TrafficMetricRepository trafficMetricRepository) {
        this.trafficMetricRepository = trafficMetricRepository;
    }

    @Override
    public List<TrafficMetric> findAll() {
        return trafficMetricRepository.findAll();
    }

    @Override
    public Optional<TrafficMetric> findById(Long id) {
        return trafficMetricRepository.findById(id);
    }

    @Override
    public TrafficMetric save(TrafficMetric trafficMetric) {
        return trafficMetricRepository.save(trafficMetric);
    }
}