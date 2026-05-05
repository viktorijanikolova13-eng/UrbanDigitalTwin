package com.example.smartcity.service.application;

import com.example.smartcity.model.dto.create.CreateLocationDto;
import com.example.smartcity.model.dto.display.DisplayLocationDto;

import java.util.List;
import java.util.Optional;

public interface LocationApplicationService {
    List<DisplayLocationDto> findAll();
    Optional<DisplayLocationDto> findById(Long id);
    DisplayLocationDto save(CreateLocationDto createLocationDto);
}