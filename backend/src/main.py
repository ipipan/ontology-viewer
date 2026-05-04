from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import List, Optional, Set
import os
from pathlib import Path
import traceback

from .config import settings
from .parser import OntologyParser
from .models import Example, Corpus, OntologyClass, PaginatedResponse, ErrorResponse, ConnectiveData

app = FastAPI(
    title="Ontology Viewer API",
    description="API for viewing and searching OWL ontology examples",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global parser instance
parser = None

@app.on_event("startup")
async def startup_event():
    """Initialize the ontology parser on application startup"""
    global parser
    try:
        parser = OntologyParser(data_dir=settings.data_dir)
        parser.load_ontology_files()
        parser.extract_examples()
        parser.extract_ontology_classes()
        
        print(f"Loaded {len(parser.get_all_examples())} examples")
        print(f"Loaded {len(parser.get_corpora())} corpora")
        print(f"Loaded {len(parser.get_ontology_classes())} ontology classes")
        
    except Exception as e:
        print(f"Error during startup: {e}")
        raise

@app.get("/api/health", response_model=dict)
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "examples_count": len(parser.get_all_examples())}

@app.get("/api/corpora", response_model=List[Corpus])
async def get_corpora():
    """Get list of available corpora"""
    return parser.get_corpora()

@app.get("/api/examples", response_model=PaginatedResponse)
async def get_examples(
    corpus: Optional[List[str]] = Query(None, description="Corpus names (repeat for multi-select)"),
    language: Optional[str] = Query(None, description="Language filter"),
    connective: Optional[str] = Query(None, description="Connective text filter"),
    relation: Optional[str] = Query(None, description="Relation type filter"),
    symmetric: Optional[bool] = Query(None, description="Symmetric relation filter"),
    q: Optional[str] = Query(None, description="Full-text search query"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(25, ge=1, le=100, description="Page size")
):
    """Get paginated examples with filtering"""
    try:
        # Get all examples, optionally filtered by corpus
        all_examples = parser.get_all_examples()
        if corpus:
            all_examples = [
                ex for ex in all_examples
                if ex.corpus in corpus
            ]
        
        # Apply filters
        filtered_examples = all_examples
        
        if language:
            filtered_examples = [ex for ex in filtered_examples if ex.language == language]
        
        if connective:
            filtered_examples = [ex for ex in filtered_examples if any(connective.lower() in c.text.lower() for c in ex.connective)]
        
        if relation:
            filtered_examples = [ex for ex in filtered_examples if ex.relation == relation]
        
        if symmetric is not None:
            filtered_examples = [ex for ex in filtered_examples if ex.symmetric == symmetric]
        
        if q:
            q_lower = q.lower()
            filtered_examples = [
                ex for ex in filtered_examples 
                if q_lower in ex.text.lower() or 
                   any(q_lower in c.text.lower() for c in ex.connective)
            ]
        
        # Apply pagination
        total = len(filtered_examples)
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        paginated_results = filtered_examples[start_idx:end_idx]
        
        return PaginatedResponse(
            total=total,
            page=page,
            page_size=page_size,
            results=paginated_results
        )
        
    except Exception as e:
        print(f"Error retrieving examples: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Error retrieving examples: {str(e)}")

@app.get("/api/examples/{example_id}", response_model=Example)
async def get_example(example_id: str):
    """Get a specific example by ID"""
    examples = parser.get_all_examples()
    example = next((ex for ex in examples if ex.id == example_id), None)
    
    if not example:
        raise HTTPException(status_code=404, detail="Example not found")
    
    return example

@app.get("/api/ontology/classes", response_model=List[OntologyClass])
async def get_ontology_classes():
    """Get ontology class hierarchy"""
    return parser.get_ontology_classes()

@app.get("/api/ontology/relations", response_model=List[dict])
async def get_ontology_relations(
    corpus: Optional[List[str]] = Query(None, description="Corpus names to filter by")
):
    """Get list of relation classes with symmetry information"""
    classes = parser.get_ontology_classes()
    relations = []

    # Define the parent URIs for symmetric and asymmetric relations
    symmetric_drel_uri = parser.ISO_NS + "SymmetricDRel"
    asymmetric_drel_uri = parser.ISO_NS + "AsymmetricDRel"

    # If corpus filter is provided, collect relation labels that exist in those corpora
    allowed_labels: Optional[Set[str]] = None
    if corpus:
        allowed_labels = set()
        for ex in parser.get_all_examples():
            if ex.corpus in corpus:
                allowed_labels.add(ex.relation)

    for cls in classes:
        # Only include classes that are direct subclasses of SymmetricDRel or AsymmetricDRel
        if symmetric_drel_uri in cls.parent_uris or asymmetric_drel_uri in cls.parent_uris:
            if allowed_labels is not None and cls.label not in allowed_labels:
                continue
            relations.append({
                "label": cls.label,
                "uri": cls.uri,
                "symmetric": cls.symmetric
            })

    return relations

@app.get("/api/connectives", response_model=List[ConnectiveData])
async def get_connectives(
    corpus: Optional[List[str]] = Query(None, description="Corpus names to filter by")
):
    """Get list of unique connectives with their occurrence counts"""
    connectives_data = parser.get_connectives(corpora=corpus)
    return [ConnectiveData(label=conn["label"], count=conn["count"]) for conn in connectives_data]

# Error handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorResponse(detail=exc.detail, code="http_error").dict()
    )

@app.exception_handler(Exception)
async def generic_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content=ErrorResponse(detail="Internal server error", code="internal_error").dict()
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "src.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.reload
    )