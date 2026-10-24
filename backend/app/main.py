from fastapi import FastAPI
from .models import HabitatRequest, SimulationResult
from .engine import simulate
from .environments import ENVIRONMENTS

app = FastAPI(title="Beyond Earth", version="0.2.0", description="Hourly resource-balance prototype")

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/environments")
def environments():
    return ENVIRONMENTS

@app.post("/simulate", response_model=SimulationResult)
def run_simulation(request: HabitatRequest):
    return simulate(request)


@app.get("/model-reference")
def model_reference():
    from .research import SOURCES, PARAMETERS
    return {"version":"0.2.0", "sources":SOURCES, "parameters":PARAMETERS,
            "default_request":HabitatRequest().model_dump()}
