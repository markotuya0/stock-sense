# Development Setup Guide

## Prerequisites

- Python 3.9 or higher
- pip (Python package manager)
- Git

## Installation

### 1. Clone & Navigate

```bash
git clone https://github.com/markotuya/stock-sense.git
cd stock-sense
```

### 2. Virtual Environment

```bash
python3 -m venv venv
source venv/bin/activate  # macOS/Linux
# or on Windows:
venv\Scripts\activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
pip install -r requirements-dev.txt  # for development tools
```

### 4. Environment Configuration

```bash
cp .env.example .env
# Edit .env with your settings
```

## Development Commands

### Run Application

```bash
python main.py
```

### Run Tests

```bash
pytest tests/                 # Run all tests
pytest tests/ -v             # Verbose output
pytest tests/ --cov          # With coverage report
```

### Code Quality

```bash
ruff check .                 # Lint
black .                      # Format
ruff check . --fix          # Auto-fix issues
```

## Project Structure Quick Reference

- **main.py** — Entry point
- **config.py** — Configuration management
- **models.py** — Data schemas
- **routers/** — API endpoints
- **services/** — Business logic
- **middleware/** — Request middleware
- **agents/** — AI agents
- **scanner/** — Market data collection
- **db/** — Database layer
- **docs/** — Documentation

## Environment Variables

Key variables to configure:

```env
DEBUG=True                          # Enable debug mode
LOG_LEVEL=INFO                      # Logging level
DATABASE_URL=postgresql+psycopg2://...  # Supabase/Postgres connection
API_PORT=8000                       # Server port
NGX_DATA_API_URL=https://...        # Required live NGX data source
WHATSAPP_API_TOKEN=...              # Required for WhatsApp enterprise delivery
WHATSAPP_API_URL=https://graph.facebook.com/v19.0/messages
```

See `.env.example` for all available options.

## Troubleshooting

### Virtual Environment Issues

```bash
# Deactivate and recreate if needed
deactivate
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Dependency Conflicts

```bash
pip install --upgrade pip
pip install -r requirements.txt --force-reinstall
```

## Next Steps

1. Read the [README.md](README.md) for project overview
2. Check [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines
3. Review docs in `/docs` folder for detailed information
4. Start with a small feature or bug fix to get familiar

## Questions?

- Check existing issues on GitHub
- Open a new issue with your question
- Refer to documentation in `/docs`
