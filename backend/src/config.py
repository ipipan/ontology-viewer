import os
from typing import Optional, List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Server settings
    host: str = "0.0.0.0"
    port: int = 8000
    reload: bool = True
    
    # Data directory (relative to project root)
    data_dir: str = "../data"
    
    # CORS settings
    allowed_origins: List[str] = ["http://localhost:4200", "http://127.0.0.1:4200"]
    
    # API settings
    default_page_size: int = 25
    max_page_size: int = 100
    
    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()