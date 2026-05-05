package com.example.smartcity.repository;

import com.example.smartcity.model.domain.EnvironmentalMetric;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EnvironmentalMetricRepository extends JpaRepository<EnvironmentalMetric, Long> {
}