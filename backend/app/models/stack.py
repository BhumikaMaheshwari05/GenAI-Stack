# backend/app/models/stack.py
from sqlalchemy import Column, Integer, String, JSON
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class Stack(Base):
    __tablename__ = "stacks"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String, nullable=True)
    # This will store the react-flow nodes and edges
    workflow_definition = Column(JSON)