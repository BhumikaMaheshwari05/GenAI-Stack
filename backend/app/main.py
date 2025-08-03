# backend/app/main.py
from fastapi import FastAPI, Depends, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import shutil
import os

from .core.db import engine, get_db
from .models import stack as stack_model
from . import schemas
from .services import gemini_service, knowledge_base_service, web_search_service

stack_model.Base.metadata.create_all(bind=engine)
app = FastAPI(title="GenAI Stack Builder API")
origins = ["http://localhost:3000"]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

UPLOAD_DIRECTORY = "./uploaded_files"
if not os.path.exists(UPLOAD_DIRECTORY):
    os.makedirs(UPLOAD_DIRECTORY)

@app.post("/uploadfile/")
async def create_upload_file(file: UploadFile = File(...)):
    file_path = os.path.join(UPLOAD_DIRECTORY, file.filename)
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        knowledge_base_service.process_pdf(file_path=file_path, collection_name=file.filename)
        return {"filename": file.filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process file: {str(e)}")

@app.post("/stacks/", response_model=schemas.Stack, status_code=201)
def create_stack(stack: schemas.StackCreate, db: Session = Depends(get_db)):
    workflow = stack.workflow_definition if stack.workflow_definition is not None else {"nodes": [], "edges": []}
    db_stack = stack_model.Stack(name=stack.name, description=stack.description, workflow_definition=workflow)
    db.add(db_stack)
    db.commit()
    db.refresh(db_stack)
    return db_stack

@app.put("/stacks/{stack_id}", response_model=schemas.Stack)
def update_stack(stack_id: int, stack: schemas.StackCreate, db: Session = Depends(get_db)):
    db_stack = db.query(stack_model.Stack).filter(stack_model.Stack.id == stack_id).first()
    if db_stack is None: raise HTTPException(status_code=404, detail="Stack not found")
    db_stack.name = stack.name
    db_stack.description = stack.description
    if stack.workflow_definition is not None: db_stack.workflow_definition = stack.workflow_definition
    db.commit()
    db.refresh(db_stack)
    return db_stack

@app.get("/stacks/", response_model=List[schemas.Stack])
def read_stacks(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(stack_model.Stack).offset(skip).limit(limit).all()

@app.get("/stacks/{stack_id}", response_model=schemas.Stack)
def read_stack(stack_id: int, db: Session = Depends(get_db)):
    db_stack = db.query(stack_model.Stack).filter(stack_model.Stack.id == stack_id).first()
    if db_stack is None: raise HTTPException(status_code=404, detail="Stack not found")
    return db_stack

@app.delete("/stacks/{stack_id}", status_code=200)
def delete_stack(stack_id: int, db: Session = Depends(get_db)):
    db_stack = db.query(stack_model.Stack).filter(stack_model.Stack.id == stack_id).first()
    if db_stack is None: raise HTTPException(status_code=404, detail="Stack not found")
    db.delete(db_stack)
    db.commit()
    return {"message": f"Stack {stack_id} deleted successfully"}

@app.post("/stacks/{stack_id}/run")
def run_stack(stack_id: int, request: schemas.QueryRequest, db: Session = Depends(get_db)):
    db_stack = db.query(stack_model.Stack).filter(stack_model.Stack.id == stack_id).first()
    if not db_stack:
        raise HTTPException(status_code=404, detail="Stack not found")

    workflow = db_stack.workflow_definition
    nodes = workflow.get("nodes", [])
    edges = workflow.get("edges", [])
    
    start_node = next((n for n in nodes if n['data']['label'] == 'User Query'), None)
    if not start_node:
        raise HTTPException(status_code=400, detail="Workflow must have a 'User Query' node")

    # Initialize the data object that will be passed through the workflow
    current_data = {"query": request.query, "kb_context": None, "web_context": None}
    current_node_id = start_node['id']
    
    while current_node_id:
        current_node = next((n for n in nodes if n['id'] == current_node_id), None)
        if not current_node: break

        node_type = current_node['data'].get('label')
        node_config = current_node['data']

        if node_type == 'Knowledge Base':
            file_name = node_config.get('fileName')
            if file_name:
                current_data["kb_context"] = knowledge_base_service.query_knowledge_base(
                    query=current_data["query"], collection_name=file_name
                )
        
        elif node_type == 'Web Search':
            current_data["web_context"] = web_search_service.perform_search(
                query=current_data["query"]
            )
        
        elif node_type == 'LLM (OpenAI)':
            prompt = node_config.get("prompt", "You are a helpful assistant.")
            current_data["result"] = gemini_service.get_gemini_response(
                prompt=prompt,
                user_query=current_data["query"],
                context=current_data.get("kb_context"),
                web_context=current_data.get("web_context")
            )

        next_edge = next((e for e in edges if e['source'] == current_node_id), None)
        current_node_id = next_edge['target'] if next_edge else None

    return {"result": current_data.get("result", "Workflow ended without a result.")}