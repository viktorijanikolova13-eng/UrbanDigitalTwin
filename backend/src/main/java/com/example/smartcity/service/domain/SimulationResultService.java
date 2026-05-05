package com.example.smartcity.service.domain;

import com.example.smartcity.model.domain.SimulationResult;

import java.util.List;

public interface SimulationResultService {
    List<SimulationResult> findAll();
    SimulationResult save(SimulationResult result);
}