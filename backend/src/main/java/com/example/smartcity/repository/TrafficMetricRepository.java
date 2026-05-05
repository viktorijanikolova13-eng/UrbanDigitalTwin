package com.example.smartcity.repository;

import com.example.smartcity.model.domain.TrafficMetric;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TrafficMetricRepository extends JpaRepository<TrafficMetric, Long> {
}