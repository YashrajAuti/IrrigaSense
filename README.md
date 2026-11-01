# IrrigaSense: AI-Based Smart Irrigation & Crop Water Management Platform

> **DEMO MODE — SIMULATED DATA**  
> An enterprise-grade, minimalist dark-mode agricultural water management platform engineered for precision irrigation, crop water-deficit evaluation, machine learning crop water prediction, and automated decision-making without requiring physical hardware.

---

## 1. Project Identity & Problem Statement

### Problem Statement
> "To develop an AI-based Smart Irrigation System using Machine Learning that monitors soil moisture, temperature, and humidity conditions, predicts crop water requirements, and intelligently controls irrigation to minimize water wastage and improve water-use efficiency through automated decision-making."

IrrigaSense is built to replicate software developed by a real agricultural technology company. It is practical, visually restrained, technically credible, fully responsive across desktop and mobile form-factors, and designed for demonstration and evaluation.

### Primary Objectives
- **Monitor in-situ conditions**: Volumetric soil moisture (% VWC), soil/ambient temperature (°C), and relative humidity (% RH).
- **Track rainfall and irrigation activity**: Daily rainfall accumulation and historical irrigation delivery.
- **Predict crop water requirements**: Multi-paradigm estimation combining supervised machine learning (`RandomForestRegressor`), scientific FAO-56 evapotranspiration ($ET_c = K_c \times ET_0$), and volumetric depth-area conversion.
- **Automated & Manual Irrigation Control**: Safety interlocks, maximum runtime cutoff (120 minutes), anti-cycling hysteresis buffer (2%), and emergency stop.
- **Track water consumption & savings**: Benchmarked against conventional flood/manual irrigation.
- **Multi-farm & zone hierarchy**: Support multiple estates, crop parcels, and micro-drip irrigation zones.

---

## 2. System Architecture

```
                                    +-----------------------------------------+
                                    |         IrrigaSense Web Client          |
                                    |   (React 18, TypeScript, Tailwind CSS)  |
                                    +--------------------+--------------------+
                                                         | HTTP REST / JSON
                                                         v
+----------------------------------------------------------------------------------------------------+
|                                    FastAPI Application Server                                      |
|                                                                                                    |
|  +--------------------+  +--------------------+  +--------------------+  +----------------------+  |
|  |   API Routers      |  | Recommendation     |  | ML Prediction      |  | Scientific FAO-56    |  |
|  | - /dashboard       |  | Engine             |  | Service            |  | Calculator           |  |
|  | - /farms & fields  |  | - Hysteresis buffer|  | - RandomForest     |  | - ETc = Kc * ET0     |  |
|  | - /zones & sensors |  | - Forecast rain    |  |   Regressor        |  | - Growth stage Kc    |  |
|  | - /irrigation      |  | - Sensor freshness |  | - 7-day forecast   |  | - Net/Gross deficit  |  |
|  | - /predictions     |  | - Safety limits    |  | - Feature weights  |  | - Volumetric Litres  |  |
|  +---------+----------+  +---------+----------+  +---------+----------+  +----------+-----------+  |
|            |                       |                       |                        |              |
+------------+-----------------------+-----------------------+------------------------+--------------+
                                                         |
                                                         v
                                    +-----------------------------------------+
                                    |         SQLite Persistent Store         |
                                    |      (Farms, Zones, Sensors, Runs)     |
                                    +-----------------------------------------+
```

---

## 3. Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 5
- **Styling**: Tailwind CSS 3 (configured with exact dark-mode agricultural palette tokens)
- **Routing**: React Router DOM 6
- **Data Visualization**: Recharts (responsive area, line, bar, and pie charts)
- **Icons**: Lucide React (clean outline iconography; zero emojis used for navigation)

### Backend
- **Framework**: FastAPI (Python 3.10+)
- **Data Validation**: Pydantic v2 & Pydantic-Settings
- **ORM & Database**: SQLAlchemy 2.0 with SQLite 3 (`irrigasense.db`)
- **Server**: Uvicorn with standard ASGI worker
- **Testing**: pytest & FastAPI TestClient (httpx)
- **Machine Learning**: scikit-learn, joblib, pandas, numpy

---

## 4. Exact Color System & Design Tokens

The application strictly adheres to the professional industrial palette specified in the design guidelines:

| Token Name | Hex Code | UI Role |
| :--- | :--- | :--- |
| **Jet Black** | `#0A0A0B` | Main application background canvas |
| **Obsidian Black** | `#111114` | Left sidebar navigation & elevated panels |
| **Graphite** | `#1B1D22` | Cards, tables, forms, and secondary panels |
| **Cerulean Blue** | `#2A9DDB` | Primary actions, active navigation, links, and chart emphasis |
| **Neon Rose** | `#FF3B6B` | Critical alerts, low-moisture warnings, emergency stop |
| **Pure White** | `#F5F7FA` | Primary typography & high-contrast labels |
| **Slate Gray** | `#8B929E` | Secondary metadata, units, and axis labels |
| **Field Green** | `#49B675` | Healthy soil conditions, optimal status, and active pumps |
| **Amber** | `#E8AD45` | Moderate warnings, pending operations, and demo badges |
| **Border Gray** | `#292C33` | Subtle architectural dividers & borders |

---

## 5. Machine Learning & Scientific Models

IrrigaSense explicitly distinguishes between **Machine Learning predictions**, **Scientific Agronomic calculations**, and **Rule-based decision logic**.

### A. Supervised Machine Learning (`RandomForestRegressor`)
- **Model File**: `backend/app/ml_models/crop_water_model.joblib`
- **Algorithm**: `RandomForestRegressor(n_estimators=100, max_depth=12, random_state=42)`
- **Input Features**:
  1. `soil_moisture_percent` (% Volumetric Water Content)
  2. `air_temperature_c` (Ambient temperature)
  3. `relative_humidity_percent` (Relative humidity)
  4. `crop_encoded` (Categorical crop code: Tomato=0, Onion=1, Sugarcane=2, Cotton=3, Wheat=4)
  5. `stage_encoded` (Growth stage: Initial=0, Vegetative=1, Flowering/Mid=2, Maturity=3)
  6. `field_area_sqm` (Area in $m^2$)
- **Evaluation on Held-Out Test Split (20%)**:
  - **Mean Absolute Error (MAE)**: `0.456 mm/day`
  - **Root Mean Squared Error (RMSE)**: `0.606 mm/day`
  - **Coefficient of Determination ($R^2$)**: `0.851`
- **Feature Importance Weights**:
  - Air Temperature: `38.2%`
  - Relative Humidity: `29.4%`
  - Soil Moisture: `18.7%`
  - Crop Growth Stage: `9.1%`
  - Crop Variety: `4.6%`
- **Outputs**: Estimated daily water requirement ($mm/day$), 7-day forecast horizon, equivalent volume in litres.

### B. Scientific FAO-56 Framework
When meteorological conditions are provided, crop evapotranspiration is calculated using:
$$ET_c = K_c \times ET_0$$
Where:
- $ET_0$: Reference evapotranspiration calculated or estimated from temperature, radiation, and humidity.
- $K_c$: Standard FAO-56 crop coefficient mapped to crop type and growth stage:
  - **Tomato**: Initial: `0.60`, Vegetative: `0.85`, Flowering/Mid: `1.15`, Maturity: `0.80`
  - **Onion**: Initial: `0.50`, Vegetative: `0.75`, Flowering/Mid: `1.05`, Maturity: `0.75`
  - **Sugarcane**: Initial: `0.40`, Vegetative: `0.80`, Flowering/Mid: `1.25`, Maturity: `0.75`
  - **Cotton**: Initial: `0.45`, Vegetative: `0.75`, Flowering/Mid: `1.20`, Maturity: `0.65`
  - **Wheat**: Initial: `0.35`, Vegetative: `0.70`, Flowering/Mid: `1.15`, Maturity: `0.40`
- **Net Irrigation Depth**:
  $$\text{Net Depth (mm)} = \max(0, ET_c - P_{\text{eff}})$$
- **Gross Irrigation Depth**:
  $$\text{Gross Depth (mm)} = \frac{\text{Net Depth (mm)}}{\text{Application Efficiency } (\eta)}$$
  *(Configurable: Drip = 90%, Sprinkler = 75%, Flood = 60%)*
- **Volume Conversion**:
  $$1\text{ mm depth over } 1\text{ m}^2 = 1.0\text{ Litre of water}$$
  $$\text{Volume (Litres)} = \text{Gross Depth (mm)} \times \text{Field Area } (m^2)$$

### C. Irrigation Decision Engine Rules
1. **Sensor Freshness Interlock**: If telemetry timestamp is $>24$ hours old, automatic irrigation is blocked with a `STALE_SENSOR_DATA` alert.
2. **Sensor Validity Interlock**: Out-of-bounds readings ($<0\%$ or $>100\%$) inhibit automated actuation.
3. **Equipment Fault Interlock**: Pump faults or valve errors immediately raise critical alerts and disable automated triggers.
4. **Anti-Cycling Hysteresis**: A $2.0\%$ moisture band above the lower threshold prevents rapid on/off cycling near threshold boundaries.
5. **Rainfall Delay**: If forecast rainfall over the next 24 hours is $\ge$ the calculated water deficit, the system recommends `DELAY_OR_STOP` to avoid wasteful energy and water expenditure.
6. **Maximum Runtime Hardstop**: Automatic and manual pump runs enforce a hard safety cutoff (default 120 minutes max).

---

## 6. All 10 Implemented Application Pages

1. **Farm Overview (`/`)**: 4 primary KPI cards (Soil Moisture, Temperature, Humidity, Predicted Demand), the interactive Irrigation Recommendation panel with human-readable rationale, 24h/7d/30d Soil Moisture chart, Environmental Trends chart, Zones Status table, and recent activity log.
2. **Live Monitoring (`/monitoring`)**: Real-time probe gauges (% VWC, °C, % RH), signal metrics (RSSI, battery %), and an interactive Telemetry Packet Sandbox to simulate changing conditions in real time.
3. **Farms & Fields (`/farms-fields`)**: Agricultural estate profiles and field parcel editor with customizable target moisture ranges, soil types, and crop varieties.
4. **Irrigation Control (`/irrigation-control`)**: Manual and Automatic pump actuation console with runtime enforcement, Emergency Stop override, and command history.
5. **Water Predictions (`/water-predictions`)**: Multi-paradigm interface with dedicated tabs for Machine Learning (Random Forest metrics, 7-day forecast), Scientific FAO-56 derivation, and Volumetric Hydrology.
6. **Irrigation Schedule (`/schedules`)**: Programmed irrigation job management with Card/List view, Weekly Calendar Matrix view, day-of-week filters, toggle activation, and deletion.
7. **Analytics & Reports (`/analytics`)**: Comparative water consumption charts benchmarked against conventional flood baselines, parcel allocation breakdown, CSV audit log export, and printable summary.
8. **Alerts & Events (`/alerts`)**: Categorized alert feed (Critical, Warning, Info) with acknowledgement tracking and resolution workflows.
9. **Sensor Management (`/sensors`)**: Hardware fleet monitoring showing serial numbers, battery voltages, LoRaWAN signal strengths, firmware builds, probe registration modal, and live ESP32 edge gateway test dispatch.
10. **Settings (`/settings`)**: System constants, safety limits, agricultural unit customization (Hectares/Acres, Litres/$m^3$), backend health status, and confirmed demonstration dataset reset.

---

## 7. IoT Hardware Integration Roadmap (ESP32 / LoRaWAN)

IrrigaSense includes a production-ready edge gateway endpoint for ingesting real physical sensor packets from microcontrollers (ESP32, Arduino, Raspberry Pi, LoRaWAN gateway):

### Ingest Endpoint
`POST /api/v1/sensors/ingest-hardware`

### Payload Schema
```json
{
  "device_serial": "ESP32-NODE-01",
  "auth_token": "demo-hw-secret-key",
  "soil_moisture_percent": 24.5,
  "air_temperature_c": 31.2,
  "relative_humidity_percent": 55.0,
  "battery_level": 92.0,
  "signal_dbm": -68
}
```

### Safety and Disclosure
In **Demo Mode**, pump actuation and sensor measurements are simulated within SQLite. When transitioning to **Hardware Mode**, relay commands require physical feedback verification from the microcontroller before reflecting as `CONFIRMED_RUNNING` in the interface.

---

## 8. Installation & Running Locally

### Prerequisites
- **Node.js**: v18.0.0 or higher (v20.x recommended)
- **Python**: v3.10 or higher (tested on Python 3.14)

---

### Step 1: Backend Setup
```bash
cd backend

# Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate    # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run automated test suite
pytest -v

# Start FastAPI server
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
*API docs available at: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)*

---

### Step 2: Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Build verification
npm run build

# Start development server
npm run dev -- --host 127.0.0.1 --port 5173
```
*Open application in browser at: [http://127.0.0.1:5173](http://127.0.0.1:5173)*

---

## 9. Automated Test Verification Results

All 26 automated tests execute cleanly via pytest:

```
tests/test_advanced_scenarios.py::test_healthy_moisture_scenario_no_irrigation PASSED
tests/test_advanced_scenarios.py::test_low_moisture_scenario_recommends_irrigation PASSED
tests/test_advanced_scenarios.py::test_low_moisture_with_sufficient_forecast_rainfall_delays_irrigation PASSED
tests/test_advanced_scenarios.py::test_invalid_sensor_blocks_automatic_irrigation PASSED
tests/test_advanced_scenarios.py::test_disconnected_or_faulty_pump_blocks_irrigation PASSED
tests/test_advanced_scenarios.py::test_maximum_runtime_enforcement PASSED
tests/test_advanced_scenarios.py::test_zero_baseline_water_savings PASSED
tests/test_advanced_scenarios.py::test_ml_random_forest_prediction PASSED
tests/test_advanced_scenarios.py::test_fao_56_scientific_calculation PASSED
tests/test_api_endpoints.py::test_health_check_endpoint PASSED
tests/test_api_endpoints.py::test_farms_crud_endpoints PASSED
tests/test_api_endpoints.py::test_dashboard_summary_endpoint PASSED
tests/test_api_endpoints.py::test_irrigation_command_manual_start_stop_emergency PASSED
tests/test_api_endpoints.py::test_schedules_crud_and_toggle PASSED
tests/test_api_endpoints.py::test_alerts_ack_and_filtering PASSED
tests/test_api_endpoints.py::test_settings_and_reset_demo_data PASSED
tests/test_recommendation_engine.py::test_recommendation_deficit_triggers_irrigate_now PASSED
tests/test_recommendation_engine.py::test_recommendation_optimal_moisture PASSED
tests/test_recommendation_engine.py::test_recommendation_surplus_moisture PASSED
tests/test_recommendation_engine.py::test_stale_sensor_reading_blocks_automatic_irrigation PASSED
tests/test_water_calculator.py::test_net_water_depth_calculation PASSED
tests/test_water_calculator.py::test_gross_water_depth_with_efficiency PASSED
tests/test_water_calculator.py::test_water_volume_liters_exact_relation PASSED
tests/test_water_calculator.py::test_volumetric_water_deficit_liters PASSED
tests/test_water_calculator.py::test_zero_area_or_depth_raises_error PASSED
tests/test_water_calculator.py::test_invalid_efficiency_raises_error PASSED

======================= 26 passed in 1.32s ========================
```

---

## 10. Limitations & Disclosures

1. **Simulation Status**: Sensor telemetry and pump actuations are stored in a persistent SQLite database simulating realistic diurnal behavior. Physical relay switching requires connecting an ESP32 or compatible edge controller.
2. **Weather API**: Forecast rainfall in demo mode uses deterministic regional averages (Baramati semi-arid agro-zone). A live OpenWeatherMap or IMD API key can be configured via environment variables.
3. **ML Training Dataset**: The current Random Forest model was trained on an agricultural baseline dataset derived from empirical FAO-56 crop water demand curves. While mathematically sound, site-specific calibration is advised before production deployment on commercial acreage.

---

## 11. License
Licensed under the MIT License for educational and research evaluation.
