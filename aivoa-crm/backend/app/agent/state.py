from typing import List, Dict, Any, Optional, TypedDict
from langchain_core.messages import BaseMessage

class AgentState(TypedDict):
    messages: List[BaseMessage]
    intent: Optional[str]
    tool_to_call: Optional[str]
    tool_args: Optional[Dict[str, Any]]
    tool_result: Optional[Any]
    extracted_data: Optional[Dict[str, Any]]
    validation_result: Optional[Dict[str, Any]]
    response: Optional[str]
