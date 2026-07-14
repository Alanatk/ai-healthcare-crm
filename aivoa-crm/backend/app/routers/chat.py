from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from langchain_core.messages import HumanMessage, AIMessage

# pyrefly: ignore [missing-import]
from app.database import get_db
# pyrefly: ignore [missing-import]
from app.services.auth_service import get_current_user
# pyrefly: ignore [missing-import]
from app.agent.graph import graph

router = APIRouter(tags=["AI Agent Chat"])

class ChatMessage(BaseModel):
    sender: str  # 'user' or 'assistant'
    text: str

class ChatRequest(BaseModel):
    message: str
    history: List[ChatMessage] = []

class ChatResponse(BaseModel):
    reply: str
    extracted_data: Optional[Dict[str, Any]] = None

@router.post("/chat", response_model=ChatResponse)
def chat_with_agent(
    payload: ChatRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Chat with the AI CRM Copilot. The agent will detect intent,
    run database tools, validate extracted details, and return replies.
    """
    # 1. Convert chat history to LangChain message formats
    messages = []
    for msg in payload.history:
        if msg.sender == "user":
            messages.append(HumanMessage(content=msg.text))
        elif msg.sender == "assistant":
            messages.append(AIMessage(content=msg.text))
            
    # Append latest message
    messages.append(HumanMessage(content=payload.message))

    # 2. Invoke LangGraph with DB context
    try:
        initial_state = {
            "messages": messages,
            "intent": None,
            "tool_to_call": None,
            "tool_args": None,
            "tool_result": None,
            "extracted_data": None,
            "validation_result": None,
            "response": None
        }

        # Pass DB session in graph configurable context
        final_state = graph.invoke(
            initial_state,
            config={"configurable": {"db": db}}
        )

        reply = final_state.get("response", "I could not formulate a response.")
        extracted_data = final_state.get("extracted_data")

        return {
            "reply": reply,
            "extracted_data": extracted_data
        }
    except Exception as e:
        print(f"Error executing agent graph: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI Agent error occurred: {str(e)}"
        )
