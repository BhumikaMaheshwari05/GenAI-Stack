# backend/app/schemas.py
from pydantic import BaseModel
from typing import Optional, Any

# Base schema with common attributes
class StackBase(BaseModel):
    name: str
    description: Optional[str] = None

# Schema for creating a new stack
class StackCreate(StackBase):
   workflow_definition: Optional[dict] = None

# Schema for reading a stack from the database (includes the ID)
class Stack(StackBase):
    id: int
    workflow_definition: dict

    class Config:
        from_attributes = True

# Defines the structure for a chat message, e.g., {"query": "Hello"}
class QueryRequest(BaseModel):
    query: str