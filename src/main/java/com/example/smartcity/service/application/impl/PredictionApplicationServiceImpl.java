package com.example.smartcity.service.application.impl;

import com.example.smartcity.model.dto.create.PredictionRequestDto;
import com.example.smartcity.model.dto.display.PredictionResponseDto;
import com.example.smartcity.model.dto.display.ZoneSimulationResultDto;
import com.example.smartcity.service.application.PredictionApplicationService;
import com.example.smartcity.service.domain.PredictionEngine;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PredictionApplicationServiceImpl implements PredictionApplicationService {

    private final PredictionEngine predictionEngine;

    public PredictionApplicationServiceImpl(PredictionEngine predictionEngine) {
        this.predictionEngine = predictionEngine;
    }

    @Override
    public PredictionResponseDto predict(PredictionRequestDto request) {
        return predictionEngine.predict(request);
    }

    @Override
    public List<ZoneSimulationResultDto> predictZones(PredictionRequestDto request) {
        return predictionEngine.predictZones(request);
    }
}
