package com.example.smartcity.service.domain.impl;

import com.example.smartcity.model.domain.EnvironmentalMetric;
import com.example.smartcity.repository.EnvironmentalMetricRepository;
import com.example.smartcity.service.domain.EnvironmentalMetricService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class EnvironmentalMetricServiceImpl implements EnvironmentalMetricService {

    private final EnvironmentalMetricRepository environmentalMetricRepository;

    public EnvironmentalMetricServiceImpl(EnvironmentalMetricRepository environmentalMetricRepository) {
        this.environmentalMetricRepository = environmentalMetricRepository;
    }

    @Override
    public List<EnvironmentalMetric> findAll() {
        return environmentalMetricRepository.findAll();
    }

    @Override
    public Optional<EnvironmentalMetric> findById(Long id) {
        return environmentalMetricRepository.findById(id);
    }

    @Override
    public EnvironmentalMetric save(EnvironmentalMetric environmentalMetric) {
        return environmentalMetricRepository.save(environmentalMetric);
    }
}