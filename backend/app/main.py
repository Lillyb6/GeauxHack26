from fastapi import FastAPI, HTTPException
from .models import HabitatRequest, SimulationResult
from .engine import simulate
from .equipment import EQUIPMENT
from .environments import ENVIRONMENTS

app = FastAPI(title="Beyond Earth", version="0.2.0", description="Hourly resource-balance prototype")

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/equipment")
def equipment():
    return EQUIPMENT

@app.get("/environments")
def environments():
    return ENVIRONMENTS

@app.post("/simulate", response_model=SimulationResult)
def run_simulation(request: HabitatRequest):
    try:
        return simulate(request)
    except ValueError as error:
        raise HTTPException(
            status_code=422,
            detail=str(error),
        ) from error


@app.get("/model-reference")
def model_reference():
    from .research import SOURCES, PARAMETERS
    return {"version":"0.2.0", "sources":SOURCES, "parameters":PARAMETERS,
            "default_request":HabitatRequest().model_dump()}
