# Ontology Viewer

A web application for viewing and exploring OWL ontologies with discourse relation examples. Built with FastAPI backend and Angular frontend.

## Features

- **Corpus Discovery**: Automatically loads OWL files following the `<corpus>-<lang>.owl` naming convention
- **Advanced Filtering**: Filter examples by language, connective, relation type, symmetry, and full-text search
- **Pagination**: Browse through examples with configurable page sizes
- **Responsive Design**: Mobile-friendly interface
- **Detailed View**: Modal popup with complete example information
- **RESTful API**: Comprehensive JSON API with filtering capabilities

## Project Structure

```
ontology-viewer/
├── backend/                          # Python FastAPI backend
│   ├── src/
│   │   ├── main.py                   # FastAPI application
│   │   ├── models.py                 # Pydantic models
│   │   ├── parser.py                 # OWL file parsing
│   │   └── config.py                 # Configuration
│   ├── tests/
│   │   └── test_parser.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/                         # Angular frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/
│   │   │   │   ├── corpus-list/
│   │   │   │   ├── example-detail/
│   │   │   │   ├── examples-list/
│   │   │   │   └── filter-bar/
│   │   │   ├── services/
│   │   │   │   └── api.service.ts
│   │   │   ├── models/
│   │   │   │   └── example.model.ts
│   │   │   ├── app.component.ts
│   │   │   └── app.module.ts
│   │   ├── index.html
│   │   ├── main.ts
│   │   └── styles.css
│   ├── angular.json
│   ├── tsconfig.json
│   ├── tsconfig.app.json
│   ├── tsconfig.spec.json
│   ├── package.json
│   ├── package-lock.json
│   ├── postcss.config.cjs
│   ├── tailwind.config.cjs
│   ├── proxy.conf.json
│   ├── nginx.conf
│   ├── .dockerignore
│   └── Dockerfile
├── nginx/                            # Nginx reverse proxy config
│   ├── conf.d/
│   │   └── security.conf
│   ├── html/
│   │   ├── 429.html
│   │   └── 50x.html
│   └── nginx.conf
├── data/                             # OWL ontology files
│   ├── discourse.ISO.UDisc.owl
│   ├── ISO-24617-8-en.owl
│   ├── PDC-pl.owl
│   └── PDC-Guidelines-pl.owl
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

## Quick Start

### Prerequisites

- Docker and Docker Compose

### Deployment

1. **Clone the repository and configure environment:**

   ```bash
   cp .env.example .env
   ```

2. **Edit `.env`** — set your domain and allowed origins:

   ```bash
   DOMAIN_NAME=example.com
   ALLOWED_ORIGINS=https://example.com
   ```

3. **Prepare SSL certificates:**

   ```bash
   mkdir -p nginx/ssl
   cp /path/to/fullchain.pem nginx/ssl/fullchain.pem
   cp /path/to/privkey.pem nginx/ssl/privkey.pem
   openssl dhparam -out nginx/ssl/dhparam.pem 2048
   ```

4. **Start the stack:**

   ```bash
   docker compose up -d
   ```

   The application will be available at `https://<your-domain>`.

5. **View logs:**

   ```bash
   docker compose logs -f
   ```

6. **Stop the stack:**
   ```bash
   docker compose down
   ```

## Adding New Corpora

1. Place OWL files in the `data/` directory
2. Follow naming convention: `<corpus-name>-<language-code>.owl`
3. Ensure files import the main ontology `discourse.ISO.UDisc.owl`
4. Restart the stack: `docker compose restart backend`

## API Endpoints

### Health Check

- `GET /api/health` — Returns server status

### Corpora

- `GET /api/corpora` — List available corpora with counts

### Examples

- `GET /api/examples` — Get paginated examples with filtering
  - Query parameters: `corpus`, `language`, `connective`, `relation`, `symmetric`, `q` (search), `page`, `page_size`
- `GET /api/examples/{id}` — Get specific example by ID

### Ontology

- `GET /api/ontology/classes` — Get ontology class hierarchy
- `GET /api/ontology/relations` — Get relation classes with symmetry info

## Data Format

### Example Object

```json
{
  "id": "http://purl.org/olia/discourse/discourse.ISO.owl#Example_Purpose",
  "text": "Idź do babci, żeby dała ci 20 złotych",
  "language": "pl",
  "connective": "żeby",
  "relation": "Purpose",
  "symmetric": false,
  "corpus": "PDC",
  "ontology_types": [
    "http://purl.org/olia/discourse/discourse.ISO.owl#Purpose"
  ],
  "provenance": "PDC-pl.owl"
}
```

### Corpus Object

```json
{
  "name": "PDC",
  "language": "pl",
  "file": "data/PDC-pl.owl",
  "count": 8
}
```

## Acknowledgements

This research was funded in whole by the National Science Centre, Poland, grant 2023/50/A/HS2/00559 ("Universal Discourse: a multilingual model of discourse relations").
