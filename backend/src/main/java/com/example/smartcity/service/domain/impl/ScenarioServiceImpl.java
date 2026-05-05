package com.example.smartcity.service.domain.impl;

import com.example.smartcity.model.domain.Scenario;
import com.example.smartcity.repository.ScenarioRepository;
import com.example.smartcity.service.domain.ScenarioService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ScenarioServiceImpl implements ScenarioService {

    private final ScenarioRepository scenarioRepository;

    public ScenarioServiceImpl(ScenarioRepository scenarioRepository) {
        this.scenarioRepository = scenarioRepository;
    }

    @Override
    public List<Scenario> findAll() {
        return scenarioRepository.findAll();
    }

    @Override
    public Optional<Scenario> findById(Long id) {
        return scenarioRepository.findById(id);
    }

    @Override
    public Scenario save(Scenario scenario) {
        return scenarioRepository.save(scenario);
    }
}