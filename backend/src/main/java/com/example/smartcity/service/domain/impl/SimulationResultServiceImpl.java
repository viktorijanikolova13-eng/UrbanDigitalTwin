package com.example.smartcity.service.domain.impl;

import com.example.smartcity.model.domain.SimulationResult;
import com.example.smartcity.repository.SimulationResultRepository;
import com.example.smartcity.service.domain.SimulationResultService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SimulationResultServiceImpl implements SimulationResultService {

    private final SimulationResultRepository repository;

    public SimulationResultServiceImpl(SimulationResultRepository repository) {
        this.repository = repository;
    }

    @Override
    public List<SimulationResult> findAll() {
        return repository.findAll();
    }

    @Override
    public SimulationResult save(SimulationResult result) {
        return repository.save(result);
    }
}