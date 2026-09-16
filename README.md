# Agentic Traffic Simulation for somoswanderlust.com

This project implements AI-driven autonomous agents to simulate real human-like interaction patterns on a WooCommerce site to measure performance and stability.

## Architecture
- **Execution Engine:** Playwright (Node.js)
- **Decision Engine:** LLM (Claude/GPT)
- **Orchestration:** BullMQ + Redis + Docker

## Personas
- Decisive Buyer
- Comparison Shopper
- Indecisive User
- Account Manager

## Setup
1. Install dependencies: `npm install`
2. Configure `.env`
3. Start Redis
4. Run agents: `npm start`
