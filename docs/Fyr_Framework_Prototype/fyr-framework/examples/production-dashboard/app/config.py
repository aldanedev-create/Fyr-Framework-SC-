from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    app_name: str = "Fyr Production Dashboard"
    secret_key: str = "development-only-change-me-please"
    database_url: str = "sqlite:///./fyr.db"
    secure_cookies: bool = False
    token_minutes: int = 120
    model_config = SettingsConfigDict(env_file=".env", env_prefix="FYR_", extra="ignore")

settings = Settings()
