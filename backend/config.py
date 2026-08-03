import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Base configuration settings for the Flask application."""
    SECRET_KEY = os.getenv("SECRET_KEY", "default-dev-key-change-in-production")
    DEBUG = os.getenv("FLASK_DEBUG", "True").lower() in ("true", "1", "t")
    PORT = int(os.getenv("PORT", 5000))
    HOST = os.getenv("HOST", "0.0.0.0")

class DevelopmentConfig(Config):
    """Development environment configuration."""
    DEBUG = True

class ProductionConfig(Config):
    """Production environment configuration."""
    DEBUG = False

config_by_name = {
    "dev": DevelopmentConfig,
    "prod": ProductionConfig,
    "default": DevelopmentConfig
}
