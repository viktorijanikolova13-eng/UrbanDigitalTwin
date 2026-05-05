package com.example.smartcity.service.application.impl;

import com.example.smartcity.model.domain.EnvironmentalMetric;
import com.example.smartcity.model.domain.Location;
import com.example.smartcity.model.dto.create.CreateEnvironmentalMetricDto;
import com.example.smartcity.model.dto.display.DisplayEnvironmentalMetricDto;
import com.example.smartcity.service.application.EnvironmentalMetricApplicationService;
import com.example.smartcity.service.domain.EnvironmentalMetricService;
import com.example.smartcity.service.domain.LocationService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class EnvironmentalMetricApplicationServiceImpl implements EnvironmentalMetricApplicationService {

    private final EnvironmentalMetricService environmentalMetricService;
    private final LocationService locationService;

    public EnvironmentalMetricApplicationServiceImpl(
            EnvironmentalMetricService environmentalMetricService,
            LocationService locationService
    ) {
        this.environmentalMetricService = environmentalMetricService;
        this.locationService = locationService;
    }

    @Override
    public List<DisplayEnvironmentalMetricDto> findAll() {
        return environmentalMetricService.findAll()
                .stream()
                .map(this::toDisplayDto)
                .collect(Collectors.toList());
    }

    @Override
    public Optional<DisplayEnvironmentalMetricDto> findById(Long id) {
        return environmentalMetricService.findById(id).map(this::toDisplayDto);
    }

    @Override
    public DisplayEnvironmentalMetricDto save(CreateEnvironmentalMetricDto createEnvironmentalMetricDto) {
        Location location = locationService.findById(createEnvironmentalMetricDto.getLocationId())
                .orElseThrow(() -> new RuntimeException("Location not found"));

        EnvironmentalMetric environmentalMetric = new EnvironmentalMetric();
        environmentalMetric.setAirQualityIndex(createEnvironmentalMetricDto.getAirQualityIndex());
        environmentalMetric.setPm25(createEnvironmentalMetricDto.getPm25());
        environmentalMetric.setPm10(createEnvironmentalMetricDto.getPm10());
        environmentalMetric.setTemperature(createEnvironmentalMetricDto.getTemperature());
        environmentalMetric.setHumidity(createEnvironmentalMetricDto.getHumidity());
        environmentalMetric.setWindSpeed(createEnvironmentalMetricDto.getWindSpeed());
        environmentalMetric.setRecordedAt(createEnvironmentalMetricDto.getRecordedAt());
        environmentalMetric.setLocation(location);

        return toDisplayDto(environmentalMetricService.save(environmentalMetric));
    }

    private DisplayEnvironmentalMetricDto toDisplayDto(EnvironmentalMetric environmentalMetric) {
        DisplayEnvironmentalMetricDto dto = new DisplayEnvironmentalMetricDto();
        dto.setId(environmentalMetric.getId());
        dto.setAirQualityIndex(environmentalMetric.getAirQualityIndex());
        dto.setPm25(environmentalMetric.getPm25());
        dto.setPm10(environmentalMetric.getPm10());
        dto.setTemperature(environmentalMetric.getTemperature());
        dto.setHumidity(environmentalMetric.getHumidity());
        dto.setWindSpeed(environmentalMetric.getWindSpeed());
        dto.setRecordedAt(environmentalMetric.getRecordedAt());

        if (environmentalMetric.getLocation() != null) {
            dto.setLocationId(environmentalMetric.getLocation().getId());
            dto.setLocationName(environmentalMetric.getLocation().getName());
        }

        return dto;
    }
}