package com.example.smartcity.service.domain;

import com.example.smartcity.model.domain.Scenario;

import java.util.List;
import java.util.Optional;

public interface ScenarioService {
    List<Scenario> findAll();
    Optional<Scenario> findById(Long id);
    Scenario save(Scenario scenario);
}