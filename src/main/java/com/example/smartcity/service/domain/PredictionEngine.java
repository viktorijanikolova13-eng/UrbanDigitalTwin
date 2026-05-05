package com.example.smartcity.service.domain;

import com.example.smartcity.model.dto.create.PredictionRequestDto;
import com.example.smartcity.model.dto.display.PredictionResponseDto;
import com.example.smartcity.model.dto.display.ZoneSimulationResultDto;

import java.util.List;

public interface PredictionEngine {

    PredictionResponseDto predict(PredictionRequestDto request);

    List<ZoneSimulationResultDto> predictZones(PredictionRequestDto request);
}
