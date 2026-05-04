package com.example.smartcity.service.ai;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
public class AiModelClientServiceImpl implements AiModelClientService {

    private final RestTemplate restTemplate = new RestTemplate();

    private static final String BASE_URL = "http://localhost:8000";

    @Override
    public Map<String, Object> predictPollution(Map<String, Object> request) {
        return restTemplate.postForObject(
                BASE_URL + "/predict/pollution",
                request,
                Map.class
        );
    }

    @Override
    public Map<String, Object> predictTraffic(Map<String, Object> request) {
        return restTemplate.postForObject(
                BASE_URL + "/predict/traffic",
                request,
                Map.class
        );
    }

    @Override
    public Map<String, Object> predictTemperature(Map<String, Object> request) {
        return restTemplate.postForObject(
                BASE_URL + "/predict/temperature",
                request,
                Map.class
        );
    }
}