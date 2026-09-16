# EcoRoute — AI-Driven Sustainable Travel Planning Platform

[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC.svg?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **Engineering Design and Innovation (EDI) Group Project**  
> An AI-powered full-stack sustainable travel planning platform integrating multi-objective carbon optimization, explainable AI, dynamic carbon footprint analytics, and interactive route mapping.

---

## 🌍 Abstract & Problem Statement
The rapid growth of the global tourism industry has significantly increased transportation-related carbon emissions. Existing commercial travel aggregators primarily optimize for cost and convenience while offering little to no visibility into the environmental consequences of choices in transportation, accommodation, and daily activities.

**EcoRoute** addresses this challenge by formulating travel itinerary generation as a **Multi-Objective Optimization Problem**, simultaneously balancing:
1. **Carbon Footprint ($\text{kg CO}_2\text{e}$)**
2. **Travel Cost ($\$$)**
3. **Travel Duration ($\text{hours}$)**
4. **User Preferences & Comfort**

---

## 🛠️ System Architecture

```mermaid
graph TD
    User([Traveler / Researcher]) <--> NextUI[Next.js 14 App Router UI]
    
    subgraph Frontend [Presentation Layer]
        Planner[Trip Parameter Wizard]
        Dashboard[Dynamic Carbon Dashboard & Recharts]
        Timeline[Day-by-Day Itinerary & Activity Timeline]
        Map[Leaflet / OpenStreetMap Visualizer]
        XAI[Explainable AI Rationale Drawer]
    end

    NextUI --> Planner
    NextUI --> Dashboard
    NextUI --> Timeline
    NextUI --> Map
    NextUI --> XAI

    subgraph Backend [Full-Stack Next.js API Layer]
        APIOptimize[/api/plan]
        APICarbon[/api/carbon]
        
        CarbonEngine[DEFRA 2023 & ICAO Factor Engine]
        ParetoEngine[Pareto Optimal Frontier Solver]
        XAIEngine[Explainable AI Decision Explainer]
        DataCatalog[Geo, Transit & Certified Eco-Hotels DB]
    end

    Planner --> APIOptimize
    APIOptimize --> ParetoEngine
    APIOptimize --> CarbonEngine
    APIOptimize --> XAIEngine
    CarbonEngine --> DataCatalog

    subgraph Companion [Academic Research Microservice]
        PythonService[Python FastAPI / NSGA-II Genetic Algorithm]
    end

    ParetoEngine -.->|Academic Companion| PythonService
```

---

## 🔬 Mathematical Formulation

### 1. Objective Functions
Given a candidate itinerary $x \in \mathcal{X}$, the system solves:
$$\min f(x) = \left[ f_{\text{carbon}}(x),\ f_{\text{cost}}(x),\ f_{\text{time}}(x),\ -f_{\text{preference}}(x) \right]$$

- **$f_{\text{carbon}}(x)$**: Total greenhouse gas emissions calculated using standardized UK DEFRA (2023) and ICAO reporting factors:
  $$\text{Emission}_{\text{transit}} = \sum_{l \in \text{Legs}} d_l \times EF_{\text{mode}(l)} \times \text{Pax}$$
  $$\text{Emission}_{\text{stay}} = N_{\text{nights}} \times EF_{\text{hotel\_tier}}$$

- **$f_{\text{cost}}(x)$**: Total financial cost of transport, accommodation, and curated activities.
- **$f_{\text{time}}(x)$**: Cruising time + terminal overheads (e.g. check-in, security, transfers).
- **$f_{\text{preference}}(x)$**: Weighted alignment with traveler priorities (Eco, Speed, Budget, Balanced).

### 2. Standardized Emission Factors (DEFRA / ICAO)
| Mode / Asset | Emission Factor | Accounting Standard |
| :--- | :--- | :--- |
| **Electric High-Speed Rail** | `0.032 kg CO2e / pkm` | DEFRA 2023 Passenger Transit |
| **Electric Car (EV)** | `0.042 kg CO2e / km` | European Grid Electricity Average |
| **Express Coach / Bus** | `0.055 kg CO2e / pkm` | DEFRA 2023 Bus & Coach |
| **Average Petrol Car (ICE)** | `0.171 kg CO2e / km` | DEFRA 2023 Medium Car |
| **Domestic Flight** | `0.255 kg CO2e / pkm` | ICAO + 1.9x Radiative Forcing Index |
| **Eco-Certified Hotel** | `12.0 kg CO2e / room-night` | LEED / Green Key Benchmark |
| **Standard City Hotel** | `26.5 kg CO2e / room-night` | Global Hotel Decarbonisation Study |

### 3. Pareto Optimal Frontier & Knee Point
A candidate $A$ Pareto-dominates candidate $B$ ($A \prec B$) if $A$ is no worse than $B$ across all objectives and strictly superior in at least one. The solver extracts 3 hallmark solutions:
1. 🌿 **The Eco-Champion**: Absolute minimal carbon ($f_{\text{carbon}}$).
2. ⚡ **The Speed-Priority**: Minimal travel time ($f_{\text{time}}$).
3. ⚖️ **EcoRoute Optimal (Balanced)**: The **Knee Point** on the Pareto frontier that maximizes marginal emissions abatement per unit time/cost added (via normalized Euclidean distance to the Utopia point).

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm**: v9.0.0 or higher
- **Python**: 3.9+ (optional, for academic NSGA-II script)

### 1. Running the Next.js Web Application
```bash
# 1. Install dependencies (already completed)
npm install

# 2. Run local development server
npm run dev
```

Open your browser and navigate to:
```
http://localhost:3000
```

### 2. Available Routes
- `http://localhost:3000/` — Landing page with live carbon abatement interactive calculator & architecture highlights.
- `http://localhost:3000/planner` — Multi-step trip planner wizard with interactive Pareto candidate selection, dynamic carbon metrics, Leaflet route map, day-by-day itinerary, and Explainable AI cards.
- `http://localhost:3000/dashboard` — Dynamic Carbon Dashboard with parametric simulation, modal comparisons, and standardized DEFRA factors reference table.
- `http://localhost:3000/api/plan` — REST API endpoint for multi-objective optimization.
- `http://localhost:3000/api/carbon` — REST API endpoint for carbon footprint calculations.

### 3. Running the Python NSGA-II Genetic Optimizer (Optional Academic Companion)
```bash
# Test the standalone genetic algorithm in terminal
python3 python-optimizer/nsga2_optimizer.py

# Or launch the FastAPI microservice
python3 -m pip install -r python-optimizer/requirements.txt
python3 python-optimizer/main.py
```

---

## 📂 Project Directory Structure

```
├── README.md                      # Comprehensive documentation & research specs
├── package.json                   # Next.js, React, Leaflet, Recharts, Tailwind
├── tsconfig.json                  # Strict TypeScript configuration
├── tailwind.config.ts             # Tailwind CSS theme & eco palettes
├── src/
│   ├── app/
│   │   ├── layout.tsx             # Global Navbar, Footer, and Metadata
│   │   ├── globals.css            # Tailwind & Leaflet styles
│   │   ├── page.tsx               # Landing Page + Live Carbon Slider
│   │   ├── planner/page.tsx       # Trip Planning Wizard & Results Page
│   │   ├── dashboard/page.tsx     # Dynamic Carbon Analytics Dashboard
│   │   └── api/
│   │       ├── plan/route.ts      # Multi-objective optimization API
│   │       └── carbon/route.ts    # Standalone carbon calculation API
│   ├── components/
│   │   ├── planner/TripWizard.tsx # Trip parameters configuration form
│   │   ├── itinerary/
│   │   │   ├── PlanComparisonCard.tsx # Pareto candidate selector
│   │   │   └── DayTimeline.tsx    # Day-by-day activities & transit schedule
│   │   ├── dashboard/CarbonCharts.tsx # Recharts Bar & Donut visualizers
│   │   ├── maps/LeafletMap.tsx    # Interactive OpenStreetMap route visualizer
│   │   └── xai/ExplainabilityCard.tsx # Explainable AI rationale card
│   └── lib/
│       ├── types.ts               # Core TypeScript domain models
│       ├── carbon/
│       │   ├── factors.ts         # DEFRA 2023 & ICAO factor database
│       │   └── calculator.ts      # Haversine distance & carbon algorithms
│       ├── optimizer/
│       │   └── pareto.ts          # Pareto dominance & Knee-point extraction
│       ├── ai/
│       │   └── explain.ts         # Transparent Explainable AI engine
│       └── data/
│           └── destinations.ts    # Cities, transit links, eco-hotels & POIs
└── python-optimizer/              # Companion research microservice
    ├── nsga2_optimizer.py         # NSGA-II Genetic Algorithm
    ├── main.py                    # FastAPI server
    └── requirements.txt
```

---

## 💡 Key Features Implemented

1. **Intelligent Itinerary Generator**:
   - Customizable origin, destination, trip dates, traveler count, and budget.
   - Dynamic scheduling of certified eco-hotels and low-impact cultural/outdoor attractions.
2. **Multi-Objective Pareto Engine**:
   - Extracts non-dominated candidate routes across emissions, cost, and time.
   - Provides 3 comparative choices: **🌿 The Eco-Champion**, **⚖️ EcoRoute Optimal**, and **⚡ Speed-Priority**.
3. **Dynamic Carbon Dashboard**:
   - Visual breakdown of emissions (Transport vs Accommodation vs Activities).
   - Comparison against conventional unoptimized baseline (Aviation + 4-Star Hotel).
   - Conversion to **Annual Tree Sequestration Equivalents** (21.77 kg $\text{CO}_2$/year per mature tree).
4. **Interactive Route Mapping**:
   - Clean OpenStreetMap CartoDB rendering with Leaflet.
   - Dynamic route polyline styling based on mode (solid emerald for train, dashed rose for flight, cyan for EV).
   - Interactive popups for origins, destinations, and scheduled attractions.
5. **Explainable AI (XAI)**:
   - Transparent natural-language justifications.
   - Quantified carbon and time trade-offs for each candidate leg.
   - Behavioral eco-nudges (packing light, public bike shares, zero single-use plastic).

---

## 📜 Authors & Acknowledgments
Developed as an **Engineering Design and Innovation (EDI)** project. Designed to advance sustainable computing and green tourism through applied AI and multi-objective evolutionary computation.
