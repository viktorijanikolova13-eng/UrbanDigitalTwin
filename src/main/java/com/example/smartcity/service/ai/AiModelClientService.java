package com.example.smartcity.service.ai;

import java.util.Map;

public interface AiModelClientService {

    Map<String, Object> predictPollution(Map<String, Object> request);

    Map<String, Object> predictTraffic(Map<String, Object> request);

    Map<String, Object> predictTemperature(Map<String, Object> request);
}