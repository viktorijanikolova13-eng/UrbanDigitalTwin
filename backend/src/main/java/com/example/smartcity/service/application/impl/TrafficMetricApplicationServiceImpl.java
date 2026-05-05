package com.example.smartcity.service.application.impl;

import com.example.smartcity.model.domain.Location;
import com.example.smartcity.model.domain.TrafficMetric;
import com.example.smartcity.model.dto.create.CreateTrafficMetricDto;
import com.example.smartcity.model.dto.display.DisplayTrafficMetricDto;
import com.example.smartcity.service.application.TrafficMetricApplicationService;
import com.example.smartcity.service.domain.LocationService;
import com.example.smartcity.service.domain.TrafficMetricService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class TrafficMetricApplicationServiceImpl implements TrafficMetricApplicationService {

    private final TrafficMetricService trafficMetricService;
    private final LocationService locationService;

    public TrafficMetricApplicationServiceImpl(
            TrafficMetricService trafficMetricService,
            LocationService locationService
    ) {
        this.trafficMetricService = trafficMetricService;
        this.locationService = locationService;
    }

    @Override
    public List<DisplayTrafficMetricDto> findAll() {
        return trafficMetricService.findAll()
                .stream()
                .map(this::toDisplayDto)
                .collect(Collectors.toList());
    }

    @Override
    public Optional<DisplayTrafficMetricDto> findById(Long id) {
        return trafficMetricService.findById(id).map(this::toDisplayDto);
    }

    @Override
    public DisplayTrafficMetricDto save(CreateTrafficMetricDto createTrafficMetricDto) {
        Location location = locationService.findById(createTrafficMetricDto.getLocationId())
                .orElseThrow(() -> new RuntimeException("Location not found"));

        TrafficMetric trafficMetric = new TrafficMetric();
        trafficMetric.setVehicleCount(createTrafficMetricDto.getVehicleCount());
        trafficMetric.setAverageSpeed(createTrafficMetricDto.getAverageSpeed());
        trafficMetric.setCongestionLevel(createTrafficMetricDto.getCongestionLevel());
        trafficMetric.setRoadClosed(createTrafficMetricDto.getRoadClosed());
        trafficMetric.setRecordedAt(createTrafficMetricDto.getRecordedAt());
        trafficMetric.setLocation(location);

        return toDisplayDto(trafficMetricService.save(trafficMetric));
    }

    private DisplayTrafficMetricDto toDisplayDto(TrafficMetric trafficMetric) {
        DisplayTrafficMetricDto dto = new DisplayTrafficMetricDto();
        dto.setId(trafficMetric.getId());
        dto.setVehicleCount(trafficMetric.getVehicleCount());
        dto.setAverageSpeed(trafficMetric.getAverageSpeed());
        dto.setCongestionLevel(trafficMetric.getCongestionLevel());
        dto.setRoadClosed(trafficMetric.getRoadClosed());
        dto.setRecordedAt(trafficMetric.getRecordedAt());

        if (trafficMetric.getLocation() != null) {
            dto.setLocationId(trafficMetric.getLocation().getId());
            dto.setLocationName(trafficMetric.getLocation().getName());
        }

        return dto;
    }
}