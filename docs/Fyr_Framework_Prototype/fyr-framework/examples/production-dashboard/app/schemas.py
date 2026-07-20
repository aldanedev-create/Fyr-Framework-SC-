from typing import Literal
from pydantic import BaseModel, EmailStr, Field

class LoginInput(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)

class TaskInput(BaseModel):
    title: str = Field(min_length=2, max_length=180)
    description: str = Field(default="", max_length=2000)
    priority: Literal["low", "medium", "high"] = "medium"

class TaskUpdate(BaseModel):
    status: Literal["backlog", "active", "done"]
