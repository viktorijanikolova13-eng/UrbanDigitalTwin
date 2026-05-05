package com.example.smartcity.service.application.impl;

import com.example.smartcity.model.domain.Location;
import com.example.smartcity.model.dto.create.CreateLocationDto;
import com.example.smartcity.model.dto.display.DisplayLocationDto;
import com.example.smartcity.service.application.LocationApplicationService;
import com.example.smartcity.service.domain.LocationService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class LocationApplicationServiceImpl implements LocationApplicationService {

    private final LocationService locationService;

    public LocationApplicationServiceImpl(LocationService locationService) {
        this.locationService = locationService;
    }

    @Override
    public List<DisplayLocationDto> findAll() {
        return locationService.findAll()
                .stream()
                .map(this::toDisplayDto)
                .collect(Collectors.toList());
    }

    @Override
    public Optional<DisplayLocationDto> findById(Long id) {
        return locationService.findById(id).map(this::toDisplayDto);
    }

    @Override
    public DisplayLocationDto save(CreateLocationDto createLocationDto) {
        Location location = new Location();
        location.setName(createLocationDto.getName());
        location.setLatitude(createLocationDto.getLatitude());
        location.setLongitude(createLocationDto.getLongitude());

        return toDisplayDto(locationService.save(location));
    }

    private DisplayLocationDto toDisplayDto(Location location) {
        DisplayLocationDto dto = new DisplayLocationDto();
        dto.setId(location.getId());
        dto.setName(location.getName());
        dto.setLatitude(location.getLatitude());
        dto.setLongitude(location.getLongitude());
        return dto;
    }
}