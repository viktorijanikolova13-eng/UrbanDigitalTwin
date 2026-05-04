package com.example.smartcity.web.controller;

import com.example.smartcity.model.dto.create.PredictionRequestDto;
import com.example.smartcity.model.dto.create.SimulateRequestDto;
import com.example.smartcity.model.dto.display.PredictionResponseDto;
import com.example.smartcity.model.dto.display.SimulationZoneDto;
import com.example.smartcity.model.dto.display.ZoneMapDto;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class FrontendController {

    @GetMapping("/zones")
    public List<ZoneMapDto> getZones(
            @RequestParam(defaultValue = "pollution") String type
    ) {
        LocalDateTime now = LocalDateTime.now();

        return List.of(
                new ZoneMapDto("Zone A", type, 45.0, "LOW", 41.9981, 21.4254, now),
                new ZoneMapDto("Zone B", type, 85.0, "MODERATE", 41.9950, 21.4300, now),
                new ZoneMapDto("Zone C", type, 188.0, "VERY_HIGH", 41.9900, 21.4350, now),
                new ZoneMapDto("Zone D", type, 120.0, "HIGH", 41.9850, 21.4400, now)
        );
    }

    @PostMapping("/predict")
    public PredictionResponseDto predict(@RequestBody PredictionRequestDto request) {

        double value = request.getType().equalsIgnoreCase("temperature")
                ? request.getTemperature() + 2
                : 188.0;

        return new PredictionResponseDto(
                request.getZone(),
                request.getType(),
                value,
                "HIGH",
                value,
                92.0,
                LocalDateTime.now()
        );
    }

    @PostMapping("/simulate")
    public List<SimulationZoneDto> simulate(@RequestBody SimulateRequestDto request) {

        return List.of(
                new SimulationZoneDto("Zone A", 25.0, 2.0, 150.0, "HIGH"),
                new SimulationZoneDto("Zone B", 22.0, 1.5, 100.0, "MODERATE")
        );
    }

    @GetMapping("/simulate/export")
    public ResponseEntity<String> export() {

        String csv = """
                zoneName,temperature,traffic,pollution,riskLevel
                Zone A,25,2.0,150,HIGH
                Zone B,22,1.5,100,MODERATE
                """;

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=results.csv")
                .contentType(MediaType.TEXT_PLAIN)
                .body(csv);
    }
}