from fastapi import FastAPI, HTTPException
from .models import HabitatRequest, SimulationResult, OptimizationRequest, OptimizationResult
from .engine import simulate
from .equipment import EQUIPMENT
from .environments import ENVIRONMENTS

app = FastAPI(title="Beyond Earth", version="0.4.0", description="Hourly resource-balance prototype")

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
    return {"version":"0.4.0", "sources":SOURCES, "parameters":PARAMETERS,
            "default_request":HabitatRequest().model_dump()}


@app.post("/optimize", response_model=OptimizationResult)
def optimize_habitat(request: OptimizationRequest):
    from .optimizer import optimize
    try:
        return optimize(request)
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error


@app.post("/explain")
def explain_design(request: OptimizationRequest):
    from .advisor import explain
    try:
        return explain(request)
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error


from .mission_agent import AgentRequest


@app.post("/agent")
def mission_agent(request: AgentRequest):
    from .mission_agent import run_agent
    return run_agent(request)
