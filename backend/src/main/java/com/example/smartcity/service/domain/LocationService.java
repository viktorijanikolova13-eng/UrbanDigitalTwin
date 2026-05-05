package com.example.smartcity.service.domain;

import com.example.smartcity.model.domain.Location;

import java.util.List;
import java.util.Optional;

public interface LocationService {
    List<Location> findAll();
    Optional<Location> findById(Long id);
    Location save(Location location);
}