package com.example.smartcity.web.controller;

import com.example.smartcity.model.dto.create.CreateLocationDto;
import com.example.smartcity.model.dto.display.DisplayLocationDto;
import com.example.smartcity.service.application.LocationApplicationService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/locations")
public class LocationController {

    private final LocationApplicationService locationApplicationService;

    public LocationController(LocationApplicationService locationApplicationService) {
        this.locationApplicationService = locationApplicationService;
    }

    @GetMapping
    public List<DisplayLocationDto> findAll() {
        return locationApplicationService.findAll();
    }

    @GetMapping("/{id}")
    public Optional<DisplayLocationDto> findById(@PathVariable Long id) {
        return locationApplicationService.findById(id);
    }

    @PostMapping("/add")
    public DisplayLocationDto save(@RequestBody CreateLocationDto createLocationDto) {
        return locationApplicationService.save(createLocationDto);
    }
}