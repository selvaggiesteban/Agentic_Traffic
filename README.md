# 🤖 AgenticTraffic: High-Performance WooCommerce Simulation

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue)](https://www.docker.com/)

**AgenticTraffic** is a distributed load-testing framework that leverages Large Language Models (LLMs) to power autonomous agents. Unlike traditional tools, it simulates real human-like interaction patterns—navigating the DOM, managing sessions, and making decisions—to identify critical bottlenecks in the full HTTP $\rightarrow$ PHP-FPM $\rightarrow$ MySQL stack.

---

## 🚀 High-Performance Architecture

The system is designed for massive scale using a **Fan-Out Worker Pattern**:

1.  **The Brain (LLM):** Interprets page state and decides the next action (e.g., "Register" $\rightarrow$ "Search" $\rightarrow$ "Buy").
2.  **The Hands (Playwright):** Executes browser actions in headless mode with resource optimization (blocked CSS/Images).
3.  **The Heart (BullMQ + Redis):** Manages thousands of jobs, ensuring a steady flow of agentic traffic across multiple distributed worker nodes.
4.  **The Infrastructure (Docker):** Allows instant scaling of worker replicas to match the server's PHP worker limit.

---

## 🛠 Installation & Configuration

### 1. Prerequisites
- **Docker & Docker Compose**
- **Redis** (provided via Docker)
- **LLM API Key** (Anthropic or OpenAI)
- **WooCommerce Staging Site** (with "Cash on Delivery" active)

### 2. Setup
```bash
git clone https://github.com/selvaggiesteban/Agentic_Traffic.git
cd Agentic_Traffic
cp .env.example .env
```
Edit the `.env` file:
```env
ANTHROPIC_API_KEY=your_key
TARGET_SITE_URL=https://staging.yoursite.com
REDIS_HOST=redis
REDIS_PORT=6379
```

### 3. Infrastructure Launch
Launch the distributed system:
```bash
docker-compose up -d --build
```

---

## 🏃 Launching the Evaluation

### Phase 1: Site Preparation (via SSH)
Before launching agents, prepare the environment using the provided SSH scripts to avoid bottlenecking the site during setup.

```bash
# Connect to your server via SSH
ssh user@server

# Run the preparation script (requires WP-CLI)
bash /path/to/scripts/ssh/setup_site.sh
```
*This will mass-create users and products to ensure the agents have data to interact with.*

### Phase 2: Executing the Stress Test
You can scale the number of concurrent agents by changing the `replicas` in `docker-compose.yml` or using the Docker CLI:

```bash
# Scale to 10 workers (approx 50-100 concurrent agents depending on config)
docker-compose up -d --scale worker=10
```

The orchestrator will automatically distribute personas:
- **Decisive Buyer:** Direct path to checkout.
- **Comparison Shopper:** High read load.
- **Indecisive User:** Session/Cart stress.
- **Account Manager:** Auth/DB stress.

### Phase 3: Post-Test Cleanup
To restore your staging site instantly:
```bash
# Via SSH
bash /path/to/scripts/ssh/cleanup_site.sh
```

---

## 📊 Transaction Logging & DB Mirroring

AgenticTraffic now includes a sophisticated logging system that records every database-altering action performed by the agents.

### Output Formats:
1.  **Global Log (`logs/transactions/global_transactions.json`):** A chronological JSON-Lines file containing every transaction across all agents.
2.  **Entity Snapshots:** Individual JSON files created for every modified record (e.g., `wp_users_username.json` or `wp_posts_123.json`). 
    - These files mirror the **original database schema** (column-value pairs), allowing you to import them directly or analyze them as DB portions.

### Log Structure:
```json
{
  "timestamp": "2026-09-17T...",
  "entity": "wp_posts",
  "id": "12345",
  "data": {
    "post_title": "Order for user_abc123",
    "post_type": "shop_order",
    "post_status": "wc-processing"
  }
}
```

---

## 📈 Performance Mapping

We provide a `flow_map.html` file that maps every agent action to the server infrastructure. Use this to align your server logs with the agent's behavior:

| Request Path | Component | Impact |
| :--- | :--- | :--- |
| HTTP $\rightarrow$ Firewall | Edge Server | Network I/O |
| Firewall $\rightarrow$ Cache | LiteSpeed | RAM/Disk |
| Cache $\rightarrow$ Worker | PHP-FPM | Worker Lock |
| Worker $\rightarrow$ Code | WordPress | CPU/RAM |
| Code $\rightarrow$ DB | MySQL | Disk I/O / Locks |
| DB $\rightarrow$ Response | HTTP Stream | Network Out |

---

## 🛡 Safety Guards
- **Circuit Breaker:** Automated shutdown if 5xx error rate exceeds 5%.
- **Human-Like Delay:** Randomized "Think Time" between actions.
- **Resource Blocking:** Blocks images/CSS to focus strictly on server-side processing.

## 📜 License
MIT
