# Stock Sense

> **⚠️ Active Development** — This project is currently in active refinement and development. Core features are being built out and the API/architecture may change. Use with caution in production environments.

## Overview

Stock Sense is a comprehensive stock analysis and monitoring platform designed to provide real-time insights, performance tracking, and intelligent alerting for equity markets.

## Project Structure

```
stock-sense/
├── README.md                 # Project overview and setup guide
├── .env.example             # Environment variables template
├── .gitignore               # Git ignore rules
├── requirements.txt         # Python dependencies
│
├── agents/                  # AI agent modules and integrations
├── models.py               # Data models and schemas
├── config.py               # Configuration management
├── main.py                 # Application entry point
│
├── routers/                # API route handlers
├── middleware/             # Custom middleware (auth, logging, etc.)
├── services/               # Business logic and service layer
├── scanner/                # Market scanning and data collection
│
├── db/                     # Database models and migrations
├── data/                   # Data processing and storage
│
├── docs/                   # Documentation
│   ├── PRD.md             # Product Requirements Document
│   ├── SKILLS.md          # Skills and capabilities
│   ├── SECURITY.md        # Security guidelines
│   └── PERFORMANCE.md     # Performance benchmarks
│
├── tests/                  # Test suite
│   └── conftest.py        # Pytest configuration
│
└── .github/               # GitHub configuration
    └── workflows/         # CI/CD workflows
```

## Key Features (In Development)

- **Real-time Stock Monitoring** — Track stock prices and movements
- **Performance Analytics** — Analyze portfolio and stock performance metrics
- **Smart Alerts** — Configurable alerts for price movements and patterns
- **AI-Powered Insights** — Agent-based analysis and recommendations
- **Secure Architecture** — Built-in security best practices

## Quick Start

### Prerequisites

- Python 3.9+
- Git
- Environment configuration (see below)

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/markotuya/stock-sense.git
   cd stock-sense
   ```

2. **Create a virtual environment**
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Run the application**
   ```bash
   python main.py
   ```

## Development

### Running Tests

```bash
pytest tests/
```

### Code Style

This project follows standard Python conventions. Run linting:

```bash
ruff check .
black --check .
```

### Project Status

| Component | Status | Notes |
|-----------|--------|-------|
| Core Architecture | 🔄 In Progress | Foundation being established |
| API Routes | 🔄 In Progress | Building route handlers |
| Database Layer | 🔄 In Progress | Schema design in progress |
| Services | 🔄 In Progress | Business logic implementation |
| Agent System | 🔄 In Progress | AI integration phase |
| Tests | ⏳ Planned | To be added with features |
| Documentation | ⏳ Planned | Will expand as features solidify |

## Documentation

- [Product Requirements](docs/PRD.md)
- [Skills & Capabilities](docs/SKILLS.md)
- [Security Guidelines](docs/SECURITY.md)
- [Performance Metrics](docs/PERFORMANCE.md)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on contributions, code style, and pull request procedures.

## Directory Guide

### `/agents`
AI agents and autonomous workflows for market analysis and decision-making.

### `/routers`
FastAPI or Flask route handlers for HTTP endpoints.

### `/middleware`
Custom middleware for request handling, authentication, and logging.

### `/services`
Core business logic, API clients, and service layer implementations.

### `/scanner`
Market data scanning, collection, and aggregation utilities.

### `/db`
Database models, migrations, and ORM configurations.

### `/data`
Data processing, transformation, and storage utilities.

### `/docs`
Comprehensive project documentation and specifications.

### `/tests`
Unit tests, integration tests, and test utilities.

## Configuration

All configuration is managed via environment variables. See `.env.example` for available options.

Key variables:
- `DEBUG` — Enable debug mode
- `LOG_LEVEL` — Logging level (DEBUG, INFO, WARNING, ERROR)
- `DATABASE_URL` — Database connection string
- `API_PORT` — API server port

## License

MIT License — See LICENSE file for details

## Support

For issues, questions, or suggestions, please open an issue on GitHub.

---

**Last Updated:** April 2026  
**Status:** 🔄 Active Development
