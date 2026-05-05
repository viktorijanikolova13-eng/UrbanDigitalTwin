package com.example.smartcity.repository;

import com.example.smartcity.model.domain.SimulationResult;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SimulationResultRepository extends JpaRepository<SimulationResult, Long> {
}