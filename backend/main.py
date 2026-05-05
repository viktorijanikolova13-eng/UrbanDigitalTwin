from fastapi import FastAPI
from pydantic import BaseModel
from predict_api import predict

app = FastAPI()

class PollutionRequest(BaseModel):
    temperature: float
    humidity: float
    wind_speed: float
    traffic: float
    hour: int
    month: int
    weekday: int

@app.post("/predict/pollution")
def predict_pollution(request: PollutionRequest):
    prediction = (
        20
        + request.traffic * 25
        + request.humidity * 0.12
        - request.wind_speed * 2.3
    )

    return {
        "predictedPm25": round(prediction, 2)
    }



@app.post("/predict/temperature")
def predict_temperature(input_data: dict):
    return predict(input_data)