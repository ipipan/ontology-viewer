# Ontology Viewer

A web application for viewing and exploring OWL ontologies with discourse relation examples. Built with FastAPI backend and Angular frontend.

## Features

- **Corpus Discovery**: Automatically loads OWL files following the `<corpus>-<lang>.owl` naming convention
- **Advanced Filtering**: Filter examples by language, connective, relation type, symmetry, and full-text search
- **Pagination**: Browse through examples with configurable page sizes
- **Responsive Design**: Mobile-friendly interface using Twilight CSS
- **Detailed View**: Modal popup with complete example information
- **RESTful API**: Comprehensive JSON API with filtering capabilities

## Project Structure

```
ontology-viewer-deepseek/
├── backend/                 # Python FastAPI backend
│   ├── src/                # Source code
│   │   ├── main.py         # FastAPI application
│   │   ├── models.py       # Pydantic models
│   │   ├── parser.py       # OWL file parsing
│   │   └── config.py       # Configuration
│   ├── tests/              # Unit tests
│   ├── requirements.txt    # Python dependencies
│   └── Dockerfile          # Backend containerization
├── frontend/               # Angular frontend
│   ├── src/                # Source code
│   │   ├── app/            # Angular components
│   │   │   ├── components/ # UI components
│   │   │   ├── services/   # API services
│   │   │   └── models/     # TypeScript models
│   │   ├── index.html      # Main HTML
│   │   └── styles.css      # Global styles
│   ├── package.json        # Node.js dependencies
│   ├── angular.json        # Angular configuration
│   ├── tsconfig.json       # TypeScript configuration
│   └── Dockerfile          # Frontend containerization
├── data/                   # OWL ontology files
│   ├── discourse.ISO.UDisc.owl  # Main ontology
│   └── PDC-pl.owl         # Example corpus (Polish)
└── README.md              # This file
```

## Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+
- npm or yarn

### Backend Setup

1. **Install Python dependencies:**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Run the backend server:**
   ```bash
   python -m src.main
   ```
   Server will start on http://localhost:8000

### Frontend Setup

1. **Install Node.js dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm start
   ```
   Application will be available on http://localhost:4200

## API Endpoints

### Health Check
- `GET /api/health` - Returns server status

### Corpora
- `GET /api/corpora` - List available corpora with counts

### Examples
- `GET /api/examples` - Get paginated examples with filtering
  - Query parameters: `corpus`, `language`, `connective`, `relation`, `symmetric`, `q` (search), `page`, `page_size`
- `GET /api/examples/{id}` - Get specific example by ID

### Ontology
- `GET /api/ontology/classes` - Get ontology class hierarchy
- `GET /api/ontology/relations` - Get relation classes with symmetry info

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
  "ontology_types": ["http://purl.org/olia/discourse/discourse.ISO.owl#Purpose"],
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

## Docker Deployment

### Backend
```bash
cd backend
docker build -t ontology-backend .
docker run -p 8000:8000 ontology-backend
```

### Frontend
```bash
cd frontend
docker build -t ontology-frontend .
docker run -p 80:80 ontology-frontend
```

### Docker Compose
Create a `docker-compose.yml` file:

```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    volumes:
      - ./data:/app/data

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
```

Run with:
```bash
docker-compose up
```

## Adding New Corpora

1. Place OWL files in the `data/` directory
2. Follow naming convention: `<corpus-name>-<language-code>.owl`
3. Ensure files import the main ontology `discourse.ISO.UDisc.owl`
4. Restart the backend to auto-discover new corpora

## Development

### Backend Development
- Uses FastAPI with automatic API documentation at `/docs`
- OWL parsing with rdflib library
- CORS enabled for frontend development

### Frontend Development
- Angular 17 with TypeScript
- Twilight CSS for styling
- Responsive grid layout
- Component-based architecture

### Testing
```bash
# Backend tests
cd backend
python -m pytest tests/

# Frontend tests
cd frontend
npm test
```

## Configuration

### Environment Variables

**Backend (.env):**
```bash
DATA_DIR=data
ALLOWED_ORIGINS=http://localhost:4200,http://127.0.0.1:4200
HOST=0.0.0.0
PORT=8000
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Acknowledgments

- OWL ontology files provided by the discourse relations community
- FastAPI for the excellent web framework
- Angular for the frontend framework
- Twilight CSS for the styling framework