# Beyond Earth
### AI-Powered Planetary Habitat Design & Optimization

**Beyond Earth** is an AI-powered engineering platform that uses NASA research, scientific simulations, and artificial intelligence to help users design and optimize hypothetical human habitats on Mars, Venus, and Titan. By modeling critical life-support systems, our platform identifies resource shortages, evaluates equipment configurations, and provides AI-assisted recommendations for exploring more efficient and sustainable planetary habitat designs.

---

## Team

- **Chloe Phan** — Research & QA Owner
- **Lillian Barker** — AI Integration Developer
- **Serene Davis** — Backend Developer
- **Emily Phan** — Frontend Developer
- **Holly Lester** — Graphic Designer

---

## About

### The Problem

Designing sustainable human habitats beyond Earth requires balancing complex life-support systems under extreme environmental conditions. Oxygen, water, electricity, atmospheric pressure, and temperature regulation are interconnected, meaning improving one system can increase demands on another. Engineers must evaluate equipment capacity, resource consumption, and environmental constraints while minimizing unnecessary mass and energy usage.

### Our Solution

**Beyond Earth** combines NASA scientific research, engineering simulations, and Google Gemini to help users design and optimize habitats on Mars, Venus, and Titan. Our platform identifies potential resource shortages, compares equipment configurations, and provides AI-assisted recommendations to make early-stage planetary habitat design more efficient and accessible.

### Key Features

- **Planetary Environment Selection:** Explore environmental conditions on Mars, Venus, and Titan.
- **Custom Habitat Configuration:** Adjust crew size, mission duration, oxygen, water, power, and equipment.
- **Engineering Simulations:** Evaluate oxygen, water, electricity, CO₂, and selected cabin-atmosphere requirements.
- **Equipment Optimization:** Compare supported configurations to minimize known equipment mass while satisfying modeled constraints.
- **AI Mission-Design Agent:** Use Google Gemini to interpret mission goals, request Python calculations, and explain recommendations.
- **Interactive Dashboard:** Visualize resource consumption, equipment performance, warnings, and simulation results.

### The Science Behind Beyond Earth

Beyond Earth uses published NASA research and engineering principles to model extraterrestrial habitat requirements.

The Python backend calculates resource changes at hourly intervals using conservation equations for oxygen, water, and electricity. It also evaluates carbon dioxide accumulation, selected cabin-atmosphere conditions, and simplified thermal demand.

Scientific reference values are distinguished from modeling assumptions and simulation results.

### How Our AI Agent Works

Our custom AI agent uses the **Google Gemini API** to interpret natural-language mission goals and interact with two backend tools:

- `simulate_habitat` — Evaluates a habitat configuration.
- `optimize_habitat` — Searches equipment combinations under mission constraints.

The Python backend performs engineering calculations, while Gemini explains the results and recommends potential changes. Users review proposed changes before applying them.

### Tech Stack & Development

| Category | Technologies |
|---|---|
| Frontend | React, Vite, Tailwind CSS, Custom CSS |
| Charts | Recharts |
| Backend | Python, FastAPI |
| Validation | Pydantic |
| AI | Google Gemini API |
| Simulation | Custom Python resource models and deterministic optimization |
| Storage | Browser localStorage with JSON import/export, Supabase |
| Hosting | Vercel |
| Testing | Pytest, Node.js test runner |
| Version Control | Git, GitHub |

### External Tools, APIs, and AI-Assisted Development

- **Google Gemini API:** Powers the custom AI mission-design agent.
- **NASA Research:** Supplies planetary environmental data and life-support reference values.
- **Supabase:** Included in the project's storage technology stack.
- **Vercel:** Included in the project's hosting technology stack.
- **Open-source dependencies:** React, Vite, Recharts, Tailwind CSS, FastAPI, Pydantic, and associated packages.

**AI Development Disclosure:** AI-assisted development tools supported portions of implementation, debugging, testing, and documentation. The application's scientific calculations are performed by the custom Python backend.


### Scientific Sources

- NASA Life Support Baseline Values and Assumptions Document
- NASA Mars and Venus Fact Sheets
- NASA Titan environmental research
- NASA historical oxygen-generation and water-recovery studies
- NASA CO₂-removal research
- NASA Passive Thermal Control Engineering Guidebook
- U.S. Department of Energy electrolysis research

Additional documentation:

- `docs/sources.md`
- `docs/assumptions.md`
- `docs/research-audit.md`

---

## Prerequisites

To build and run Beyond Earth locally, you will need:

- Git
- Python 3 and pip
- Node.js and npm
- Google Gemini API key for AI functionality
- A modern web browser

The application uses separate React frontend and FastAPI backend development processes.

---

## Build from Source

### 1. Clone the Repository

```bash
git clone https://github.com/Lillyb6/GeauxHack26.git
cd GeauxHack26
```

### 2. Set Up the Backend

Navigate to the backend directory:

```bash
cd backend
```

Install Python dependencies:

```bash
pip install -r requirements.lock.txt
```

Start the FastAPI server:

```bash
uvicorn app.main:app --reload
```

Backend URL:

`http://localhost:8000`

API documentation:

`http://localhost:8000/docs`

### 3. Set Up the Frontend

Open a new terminal from the project root:

```bash
cd frontend
```

Install frontend dependencies:

```bash
npm install
```

Run the frontend:

```bash
npm run dev
```

Open the local URL displayed in the terminal.

### 4. Configure the Gemini API

Configure the following environment variables for the backend:

```text
GEMINI_API_KEY=<YOUR_API_KEY>
GEMINI_MODEL=<SUPPORTED_MODEL_NAME>
```

Keep API keys private and never commit them to GitHub.

The simulator and optimizer can operate independently of Gemini. AI-agent features require a working Gemini API connection.

---

## Extras

### Example Simulation Results

One documented simulation evaluated a four-person Mars mission lasting 30 days with 10 kW continuous electrical generation.

| Metric | Manual | Optimized |
|---|---|---|
| Oxygen equipment units | 2 | 1 |
| Water equipment units | 2 | 1 |
| Known equipment mass | 636 kg | 318 kg |
| Electrical demand | 10.334 kW | 8.367 kW |
| Hours evaluated | 300 / 720 | 720 / 720 |
| Result | Power shortage | Modeled resource checks completed |

The optimized configuration reduced equipment mass and power demand while satisfying the selected modeled resource constraints.

### Testing and Quality Assurance

Beyond Earth uses automated tests and scientific research reviews to evaluate resource calculations, equipment processing, input validation, atmospheric screening, optimization, and AI-agent integration.

The project documentation reported 176 passing backend tests following the atmosphere-screening implementation.

### Limitations and Future Development

Beyond Earth is a conceptual engineering tool, not certified habitat-design software.

Future improvements include:

- Radiation shielding
- Realistic thermal-control modeling
- Structural pressure protection
- Equipment reliability and redundancy
- Dynamic atmosphere regulation
- Additional validated equipment specifications

Passing modeled resource checks does not establish that a habitat is safe for human occupancy.

### Our Vision

Beyond Earth combines scientific research, engineering simulation, and artificial intelligence to make planetary habitat design more accessible, interactive, and understandable.

**Design. Simulate. Optimize. Explore Beyond Earth.**
