# Cortex Copilot - Industrial Energy Platform AI Assistant

Cortex Copilot is a self-hosted, secure, multi-tenant AI assistant designed for an Industrial Intelligence Platform. It allows factory operators to ask questions about energy consumption in natural language, querying telemetry databases and explaining charts deterministically while strictly preventing data hallucinations and cross-tenant leakage.

---

## 1. System Architecture

Below is the design showing how the components interact securely under strict tenant boundaries.

```mermaid
graph TD
    subgraph Client Layer
        A[React Web UI] <--> B[JWT Auth Manager]
    end

    subgraph Security Boundary
        C[FastAPI Router]
        D[JWT Verifier & Tenant Extractor]
    end

    subgraph Data & AI Services
        E[(SQLite Database - isolated by tenant_id)]
        F[Deterministic Billing Tariff Engine]
        G[Grounded Chatbot Service]
        H[Local Ollama Server - qwen2.5:1.5b-instruct]
    end

    A -- "1. Sends credentials" --> C
    C -- "2. Validates & Issues Token" --> B
    A -- "3. Requests /chart or /chat with Authorization Header" --> C
    C --> D
    D -- "4. Decodes tenant_id (A or B)" --> E
    D -- "5. Restricts Queries" --> F
    D -- "6. Feeds Safe Context" --> G
    G -- "7. Generates Answer" --> H
```

---

## 2. Model Choice & Rationale

* **Model Used:** Local `qwen2.5:1.5b-instruct` (or `qwen2.5:3b-instruct`) served locally via **Ollama**.
* **Rationale:**
  1. **Low Compute Footprint:** Fits easily on standard modern CPUs or low-tier GPUs, making local execution on a personal laptop fast and viable.
  2. **Excellent Instruction-Following:** High baseline instruction-following capabilities, allowing the model to respect strict system guidelines and refusal boundaries.
  3. **Data Security & Privacy:** Keeping LLM inference local prevents sensitive industrial telemetry data from leaving the local deployment environment.

---

## 3. Deployment & Prompt Grounding Details

Rather than expensive weight-adjustment training, this project utilizes **Contextual Prompt Grounding**, **Input Sanitation Guards**, and **ngrok Local Tunneling**:

1. **ngrok Local Tunneling:** For deployment, we use **ngrok** to create a secure, public tunnel to the local backend on port `8000`. The frontend hosted on Vercel communicates directly with the public ngrok endpoint (`https://avatar-expulsion-gander.ngrok-free.dev`), which routes the API requests back to the local backend on the developer's laptop.
2. **Date-Boundary Guard:** A regex checker scans user queries. If a request queries dates outside the database bounds (`2026-05-19` to `2026-07-04`), the backend immediately rejects the request with a deterministic refuse message: `"The requested data is unavailable."`.
3. **Strict RAG Context Injection:** When a query is validated, the backend runs pre-defined SQLite queries (e.g. `get_low_pf_events` or `get_thd_metrics`) to extract actual telemetry statistics and inject them into a locked prompt template, ensuring the LLM explains actual data points without hallucination.
4. **Structured Refusal Mappings:** Guidelines inside the prompt instruct the LLM to refuse general questions that don't match active telemetry database rows.

---

## 4. Anomalies Discovered in the Mock Data

The following anomalies are embedded within the SQLite telemetry logs and are dynamically surfaced to the user:

| Tenant | Timestamp (UTC/Local) | Metric | Anomalous Value | Impact / Consequence |
| :--- | :--- | :--- | :--- | :--- |
| **Tenant A** | `2026-06-03 14:00` | Power Factor | **0.72** | Dropped far below the standard 0.95 threshold. Results in reactive power (kVAR) surges and low-PF bill surcharges. |
| **Tenant A** | `2026-06-18 10:15` | Voltage THD (Phase R) | **8.2%** | Exceeded the 5.0% IEEE-519 limit. Triggers overheating, grid instability, and transformer noise. |
| **Tenant B** | `2026-06-03 14:00` | Power Factor | **0.81** | Low power factor event causing increased load on the sub-metered segment. |
| **Tenant A/B**| `2026-07-04` (Peak) | Apparent Power | **~1,438.21 kVA** | Near the 1,501 kVA Contract Demand threshold. Exceeding this triggers a penal demand charge of ₹1,000/kVA/month. |

---

## 5. How Tenant B Was Derived

* **Tenant B** represents a secondary industrial sub-metered factory segment. 
* We parsed the unified database telemetry logs by filtering database rows strictly by the column value `tenant_id = 'B'`.
* Credentials and tokens are fully segregated so Tenant B's operator only receives their corresponding sub-metered telemetry profiles.

---

## 6. Tenant Credentials for Judges

Use the following logins to test the multi-tenant dashboard and chatbot interfaces:

* **Tenant A (Commercial/Industrial Segment):**
  * **Username:** `tenant_a`
  * **Password:** `password_a`
* **Tenant B (Secondary Sub-metered Segment):**
  * **Username:** `tenant_b`
  * **Password:** `password_b`

---

## 7. Known Limitations

1. **SQLite Write Concurrency:** SQLite is file-based and not optimized for high-volume concurrent writes. For production time-series ingestion, a database like TimescaleDB/PostgreSQL should be used.
2. **Local LLM Performance:** LLM inference latency depends on the host machine's hardware. On CPU-only hosts, responses may take 5–10 seconds.
3. **Static Tariffs:** The TGSPDCL HT CAT. 1A active tariff configuration is hardcoded in the billing service. It needs a GUI database manager to edit pricing dynamic tables.

---

## 8. Roadmap: What We Would Do With 2 More Weeks

1. **Live Telemetry Stream:** Build a WebSocket server inside FastAPI to stream raw telemetry logs (every 1 second) and animate gauges on the dashboard UI.
2. **Dynamic Alerting Rules:** Add user-configurable threshold rules (e.g. *"Email me if THD exceeds 4% for 3 straight intervals"*).
3. **Modbus TCP Translator:** Build a gateway plugin to read directly from physical Schneider/Siemens electrical meters using Modbus TCP or RTU protocols.
4. **Custom-Trained LoRA:** Fine-tune a LLaMA-based model on grid standard manuals (like IEEE-519 and grid codes) to improve conversational fault diagnosis.
