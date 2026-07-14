import os
import json
from datetime import datetime
from dotenv import load_dotenv

from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from langchain_core.runnables import RunnableConfig
from langgraph.graph import StateGraph, END

from .state import AgentState
from .prompts import INTENT_DETECTION_PROMPT, EXTRACTION_VALIDATION_PROMPT
from .tools import (
    log_interaction_tool,
    edit_interaction_tool,
    search_history_tool,
    today_followups_tool,
    weekly_summary_tool
)

load_dotenv()

# Helper: safe JSON parsing
def parse_json_response(content: str) -> dict:
    # Remove markdown formatting if LLM includes it
    cleaned = content.strip()
    if cleaned.startswith("```"):
        # Remove first line
        lines = cleaned.split("\n")
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines[-1].startswith("```"):
            lines = lines[:-1]
        cleaned = "\n".join(lines).strip()
    
    try:
        return json.loads(cleaned)
    except Exception as e:
        print(f"JSON Parsing failed for content: {content}. Error: {e}")
        # Return fallback structures
        return {}

# Helpers for fallback handling and key validation
def get_valid_api_key() -> str:
    key = os.getenv("GROQ_API_KEY", "")
    if not key or "your_actual" in key or "placeholder" in key or key.strip() == "":
        return ""
    return key

def fallback_parse_intent(last_user_message: str) -> dict:
    import re
    lower_msg = last_user_message.lower()
    intent = "chat"
    args = {}
    
    # If any logging trigger words or medical representative terms are present, classify as log_interaction
    if any(word in lower_msg for word in ["meet", "saw", "visited", "log", "dr.", "doctor", "hospital", "clinic"]):
        intent = "log_interaction"
        args = {"notes": last_user_message}
        
        # 1. Extract Doctor Name: look for "dr." or "doctor" followed by name
        doc_match = re.search(r'(?:dr\.|doctor)\s+([a-zA-Z]+(?:\s+[a-zA-Z]+){0,2})', last_user_message, re.IGNORECASE)
        if doc_match:
            args["doctor_name"] = "Dr. " + doc_match.group(1).strip().title()
        elif "thomas" in lower_msg:
            args["doctor_name"] = "Dr. Thomas"
        elif "clara" in lower_msg:
            args["doctor_name"] = "Dr. Clara Rose"
            
        # 2. Extract Hospital: look for "[Name] Hospital/Clinic/Center" or "at [Name]"
        hosp_match = re.search(r'([a-zA-Z\s\.\'\-]+?(?:hospital|clinic|center|medical center))', last_user_message, re.IGNORECASE)
        if hosp_match:
            args["hospital"] = hosp_match.group(1).strip().title()
        else:
            at_match = re.search(r'at\s+([a-zA-Z]+(?:\s+[a-zA-Z]+){0,2})', last_user_message, re.IGNORECASE)
            if at_match:
                args["hospital"] = at_match.group(1).strip().title()
            elif "st. jude" in lower_msg or "st jude" in lower_msg:
                args["hospital"] = "St. Jude Hospital"
            elif "metro" in lower_msg:
                args["hospital"] = "Metro Clinic"
        
        # 3. Extract Products Discussed: look for "discussed [Products]" or "about [Products]"
        prod_match = re.search(r'(?:discussed|about|products|medicine|meds|drug|drugs)\s+([a-zA-Z]+(?:\s+[a-zA-Z]+){0,1})', last_user_message, re.IGNORECASE)
        if prod_match:
            args["products"] = prod_match.group(1).strip().title()

        # 4. Extract Follow-up Date (simple format check e.g. YYYY-MM-DD or relative keywords)
        date_match = re.search(r'(\d{4}-\d{2}-\d{2})', last_user_message)
        if date_match:
            args["followup_date"] = date_match.group(1)
        
    elif "edit" in lower_msg or "update" in lower_msg or "change" in lower_msg:
        intent = "edit_interaction"
        args = {"notes": last_user_message}
    elif "history" in lower_msg or "past" in lower_msg or "last" in lower_msg:
        intent = "search_history"
        if "thomas" in lower_msg:
            args["doctor_name"] = "Dr. Thomas"
    elif "followup" in lower_msg or "follow-up" in lower_msg:
        intent = "today_followups"
    elif "weekly" in lower_msg or "summary" in lower_msg:
        intent = "weekly_summary"

    return {"intent": intent, "tool_args": args}

def fallback_validation(tool_args: dict) -> dict:
    is_valid = bool(tool_args.get("doctor_name") and tool_args.get("hospital"))
    missing = []
    if not tool_args.get("doctor_name"): missing.append("doctor_name")
    if not tool_args.get("hospital"): missing.append("hospital")
    
    # We can use the 'notes' or other field as a fallback summary if summary is not set
    summary_val = tool_args.get("summary") or tool_args.get("notes") or ""
    
    has_summary = bool(summary_val.strip())
    if not has_summary:
        missing.append("summary")
        
    is_valid_final = is_valid and has_summary
    
    val_res = {
        "is_valid": is_valid_final,
        "missing_fields": missing,
        "extracted_data": {
            "doctor_name": tool_args.get("doctor_name"),
            "hospital": tool_args.get("hospital"),
            "products": tool_args.get("products"),
            "summary": summary_val,
            "followup_date": tool_args.get("followup_date"),
            "notes": tool_args.get("notes")
        },
        "feedback": "Please provide the doctor's hospital and summary." if not is_valid_final else "Validation successful."
    }
    return val_res


# Node 1: Intent Detection
def detect_intent_node(state: AgentState, config: RunnableConfig = None) -> dict:
    messages = state.get("messages", [])
    if not messages:
        return {"intent": "chat", "tool_args": {}, "response": "Hello! How can I assist you today?"}

    last_user_message = messages[-1].content

    # Prepare chat history representation
    history_text = ""
    for msg in messages[:-1]:
        sender = "User" if isinstance(msg, HumanMessage) else "AI"
        history_text += f"{sender}: {msg.content}\n"

    # Invoke Groq model
    api_key = get_valid_api_key()
    if not api_key:
        # Fallback if Groq API key is missing
        print("Warning: GROQ_API_KEY is not set or placeholder. Falling back to basic parsing.")
        return fallback_parse_intent(last_user_message)

    try:
        llm = ChatGroq(temperature=0.0, model="gemma2-9b-it", api_key=api_key)
        prompt = [
            SystemMessage(content=INTENT_DETECTION_PROMPT),
            HumanMessage(content=f"History:\n{history_text}\nLatest User Message: {last_user_message}")
        ]
        response = llm.invoke(prompt)
        parsed = parse_json_response(response.content)
        
        return {
            "intent": parsed.get("intent", "chat"),
            "tool_args": parsed.get("arguments", {})
        }
    except Exception as e:
        print(f"Error in detect_intent_node: {e}. Falling back to basic parsing.")
        return fallback_parse_intent(last_user_message)

# Node 2: Execute Tool
def execute_tool_node(state: AgentState, config: RunnableConfig = None) -> dict:
    intent = state.get("intent", "chat")
    tool_args = state.get("tool_args", {})
    db = config.get("configurable", {}).get("db") if config else None

    if not db:
        return {"tool_result": {"error": "Database session not provided in configuration."}}

    result = None
    if intent == "search_history":
        result = search_history_tool(db, tool_args)
    elif intent == "today_followups":
        result = today_followups_tool(db, tool_args)
    elif intent == "weekly_summary":
        result = weekly_summary_tool(db, tool_args)
    
    # For log and edit, we don't save *yet*. We pass them to LLM Validation next!
    # But we record the arguments as the tool_result for validation.
    elif intent in ["log_interaction", "edit_interaction"]:
        result = {"pending_validation": True, "data": tool_args}

    return {"tool_result": result}

# Node 3: LLM Validation
def llm_validation_node(state: AgentState, config: RunnableConfig = None) -> dict:
    intent = state.get("intent", "chat")
    tool_args = state.get("tool_args", {})

    # Validation only applies to logging or editing interactions
    if intent not in ["log_interaction", "edit_interaction"]:
        return {"validation_result": {"is_valid": True}}

    api_key = get_valid_api_key()
    if not api_key:
        val_res = fallback_validation(tool_args)
        return {"validation_result": val_res, "extracted_data": val_res["extracted_data"]}

    try:
        llm = ChatGroq(temperature=0.0, model="gemma2-9b-it", api_key=api_key)
        current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S (day: %A)")
        
        prompt = [
            SystemMessage(content=EXTRACTION_VALIDATION_PROMPT.format(current_time=current_time)),
            HumanMessage(content=f"Arguments to validate: {json.dumps(tool_args)}")
        ]
        
        response = llm.invoke(prompt)
        parsed = parse_json_response(response.content)
        
        return {
            "validation_result": parsed,
            "extracted_data": parsed.get("extracted_data")
        }
    except Exception as e:
        print(f"Error in llm_validation_node: {e}. Falling back to basic validation.")
        val_res = fallback_validation(tool_args)
        return {"validation_result": val_res, "extracted_data": val_res["extracted_data"]}

# Node 4: Save Database
def save_database_node(state: AgentState, config: RunnableConfig = None) -> dict:
    intent = state.get("intent")
    validation_result = state.get("validation_result", {})
    db = config.get("configurable", {}).get("db") if config else None

    if not db:
        return {"response": "System Error: Database connection is missing."}

    # Only save if intent is log/edit and validation passed
    if intent not in ["log_interaction", "edit_interaction"]:
        return {}

    if not validation_result.get("is_valid", False):
        # Validation failed, do not save yet, return current state
        return {}

    extracted_data = validation_result.get("extracted_data", {})
    
    # Trigger appropriate database save tool
    db_result = None
    if intent == "log_interaction":
        db_result = log_interaction_tool(db, extracted_data)
    elif intent == "edit_interaction":
        # Pass the extracted details
        db_result = edit_interaction_tool(db, extracted_data)

    return {"tool_result": db_result}

# Node 5: Return Response
def generate_response_node(state: AgentState, config: RunnableConfig = None) -> dict:
    intent = state.get("intent", "chat")
    tool_result = state.get("tool_result")
    validation_result = state.get("validation_result", {})
    extracted_data = state.get("extracted_data")

    # If general chat, let the LLM generate a natural response
    if intent == "chat":
        messages = state.get("messages", [])
        last_msg = messages[-1].content if messages else ""
        
        api_key = get_valid_api_key()
        if not api_key:
            return {"response": "Hello! I am your AI assistant. How can I help you today?"}
            
        try:
            llm = ChatGroq(temperature=0.5, model="gemma2-9b-it", api_key=api_key)
            prompt = [
                SystemMessage(content="You are a helpful, professional AI assistant for a Healthcare CRM portal. Help the sales representative log visits, view history, or coordinate followups."),
                HumanMessage(content=last_msg)
            ]
            response = llm.invoke(prompt)
            return {"response": response.content}
        except Exception as e:
            return {"response": "Hello! I am your AI assistant. How can I help you today?"}

    # If validation failed, prompt the user for the missing fields
    if intent in ["log_interaction", "edit_interaction"] and not validation_result.get("is_valid", False):
        feedback = validation_result.get("feedback", "Please provide more details.")
        return {"response": feedback}

    # If tool succeeded, format the response using the tool output
    if tool_result and isinstance(tool_result, dict):
        if "error" in tool_result:
            return {"response": f"I encountered an issue: {tool_result['error']}"}
        
        if intent == "log_interaction":
            return {
                "response": (
                    f"Great! I have successfully logged your meeting with {tool_result['data']['doctor_name']} at {tool_result['data']['hospital']}. "
                    f"Summary: {tool_result['data']['summary']}. "
                    f"Follow-up is set for {tool_result['data']['followup_date'] or 'none'}. "
                    f"I have populated these details into the structured form on the left."
                )
            }
        elif intent == "edit_interaction":
            return {
                "response": (
                    f"Successfully updated interaction with {tool_result['data']['doctor_name']}. "
                    f"The details have been updated in the CRM database."
                )
            }
        elif intent in ["search_history", "today_followups"]:
            # Format list response
            msg = tool_result.get("message", "")
            data_list = tool_result.get("data", [])
            
            if not data_list:
                return {"response": msg}
                
            formatted = f"{msg}\n"
            for idx, item in enumerate(data_list, 1):
                if intent == "search_history":
                    formatted += f"\n{idx}. **{item['date']}** - Visit with {item['doctor_name']} ({item['hospital']}): {item['summary']} (Products: {item['products'] or 'none'})."
                else:
                    formatted += f"\n{idx}. **{item['doctor_name']}** ({item['hospital']}) scheduled on {item['followup_date']} - {item['summary']}"
            return {"response": formatted}
            
        elif intent == "weekly_summary":
            return {"response": tool_result.get("summary", "")}

    return {"response": "I've processed your request successfully."}

# Build state graph
workflow = StateGraph(AgentState)

# Add nodes
workflow.add_node("intent_detection", detect_intent_node)
workflow.add_node("execute_tool", execute_tool_node)
workflow.add_node("llm_validation", llm_validation_node)
workflow.add_node("save_database", save_database_node)
workflow.add_node("generate_response", generate_response_node)

# Set Entrypoint
workflow.set_entry_point("intent_detection")

# Define edges
# Intent Detection -> Execute Tool (determines intent and calls tools)
workflow.add_edge("intent_detection", "execute_tool")

# Execute Tool -> LLM Validation (takes tool args/draft and validates it)
workflow.add_edge("execute_tool", "llm_validation")

# LLM Validation -> Save Database (decides if to write to DB or ask for details)
workflow.add_edge("llm_validation", "save_database")

# Save Database -> Generate Response (generates the text reply)
workflow.add_edge("save_database", "generate_response")

# Generate Response -> END
workflow.add_edge("generate_response", END)

# Compile graph
graph = workflow.compile()
