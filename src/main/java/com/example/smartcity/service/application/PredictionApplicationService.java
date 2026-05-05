package com.example.smartcity.service.application;

import com.example.smartcity.model.dto.create.PredictionRequestDto;
import com.example.smartcity.model.dto.display.PredictionResponseDto;
import com.example.smartcity.model.dto.display.ZoneSimulationResultDto;

import java.util.List;

public interface PredictionApplicationService {

    PredictionResponseDto predict(PredictionRequestDto request);

    List<ZoneSimulationResultDto> predictZones(PredictionRequestDto request);
}
