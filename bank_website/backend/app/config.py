import json
from pathlib import Path
from typing import Any, Dict

class Config:
    """Configuration manager for the application"""
    
    def __init__(self, config_path: str = "config.json"):
        self.config_path = Path(config_path)
        self._config: Dict[str, Any] = {}
        self.load_config()
    
    def load_config(self):
        """Load configuration from JSON file"""
        if self.config_path.exists():
            with open(self.config_path, 'r') as f:
                self._config = json.load(f)
        else:
            raise FileNotFoundError(f"Config file not found: {self.config_path}")
    
    def get(self, key: str, default: Any = None) -> Any:
        """Get configuration value by dot-notation key"""
        keys = key.split('.')
        value = self._config
        
        for k in keys:
            if isinstance(value, dict):
                value = value.get(k)
                if value is None:
                    return default
            else:
                return default
        
        return value
    
    @property
    def database_url(self) -> str:
        return self.get('database.url', 'sqlite+aiosqlite:///./bank_database.db')
    
    @property
    def ollama_base_url(self) -> str:
        return self.get('ollama.base_url', 'http://localhost:11434')
    
    @property
    def ollama_model(self) -> str:
        return self.get('ollama.model', 'llama3.2:8b')
    
    @property
    def social_media_url(self) -> str:
        return self.get('agents.eba.social_media_url', 'http://localhost:8001/api/posts')

# Global config instance
config = Config()
