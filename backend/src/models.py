from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from enum import Enum

class SymmetricType(str, Enum):
    SYMMETRIC = "symmetric"
    ASYMMETRIC = "asymmetric"
    UNKNOWN = "unknown"

class Argument(BaseModel):
    id: str
    text: str
    type: str
    order: Optional[int] = None

class Connective(BaseModel):
    id: str
    text: str
    order: Optional[int] = None

class Example(BaseModel):
    id: str
    text: str
    language: str
    relation: str
    symmetric: Optional[bool] = None
    corpus: str
    ontology_types: List[str]
    provenance: str
    notation: Optional[str] = None
    arg1: List[Argument] = []
    arg2: List[Argument] = []
    connective: List[Connective] = []

class Corpus(BaseModel):
    name: str
    language: str
    file: str
    count: int

class OntologyClass(BaseModel):
    label: str
    uri: str
    parent_uris: List[str]
    symmetric: Optional[bool] = None

class ConnectiveData(BaseModel):
    label: str
    count: int

class PaginatedResponse(BaseModel):
    total: int
    page: int
    page_size: int
    results: List[Example]

class ErrorResponse(BaseModel):
    detail: str
    code: str

class FilterParams(BaseModel):
    corpus: Optional[List[str]] = None
    language: Optional[str] = None
    connective: Optional[str] = None
    relation: Optional[str] = None
    symmetric: Optional[bool] = None
    q: Optional[str] = None
    page: int = 1
    page_size: int = 25
    sort: Optional[str] = None