import os
from sqlalchemy.orm import Session
# pyrefly: ignore [missing-import]
from app.services import db_service
# pyrefly: ignore [missing-import]
from langchain_groq import ChatGroq
# pyrefly: ignore [missing-import]
from langchain_core.messages import SystemMessage, HumanMessage

def weekly_summary_tool(db: Session, args: dict = None) -> dict:
    """
    Fetch interactions logged in the last 7 days and use the LLM to generate a executive summary.
    """
    meetings = db_service.get_weekly_interactions(db)

    if not meetings:
        return {
            "success": True,
            "message": "No doctor interactions logged in the last 7 days.",
            "summary": "No interactions logged this week. Go to 'Log Interaction' to begin.",
            "data": []
        }

    # Format meetings for prompt
    meeting_details = []
    for m in meetings:
        meeting_details.append(
            f"- Doctor: {m.doctor.doctor_name} at {m.doctor.hospital}\n"
            f"  Products: {m.products or 'None'}\n"
            f"  Summary: {m.summary}\n"
            f"  Follow-up Date: {m.followup_date or 'None'}\n"
            f"  Notes: {m.notes or 'None'}\n"
        )
    
    meetings_text = "\n".join(meeting_details)

    # Invoke Groq model to generate a cohesive executive summary paragraph
    api_key = os.getenv("GROQ_API_KEY", "")
    
    if not api_key:
        # Fallback if API key is not configured
        fallback_summary = f"Summary of {len(meetings)} meetings: Discussed products including " + ", ".join(
            set(m.products for m in meetings if m.products)
        ) + "."
        return {
            "success": True,
            "message": "Weekly summary compiled (LLM generation skipped due to missing API key).",
            "summary": fallback_summary,
            "data": [m.id for m in meetings]
        }

    try:
        llm = ChatGroq(
            temperature=0.2,
            model="gemma2-9b-it",
            api_key=api_key
        )
        
        system_prompt = (
            "You are a Senior Pharmaceutical Executive. Summarize the following medical sales representative interaction logs "
            "from the past week into a concise, professional executive summary paragraph (3-4 sentences max). "
            "Highlight key outcomes, products promoted, and notable doctor responses. Do not include markdown code blocks, titles, or intros."
        )
        
        human_prompt = f"Weekly meetings context:\n\n{meetings_text}"
        
        response = llm.invoke([
            SystemMessage(content=system_prompt),
            HumanMessage(content=human_prompt)
        ])
        
        summary_text = response.content.strip()
        
        return {
            "success": True,
            "message": "Weekly executive summary generated successfully.",
            "summary": summary_text,
            "data": [m.id for m in meetings]
        }
    except Exception as e:
        print(f"Error calling LLM for weekly summary: {e}")
        return {
            "success": True,
            "message": f"Weekly summary compiled (LLM error: {str(e)}).",
            "summary": f"Logged {len(meetings)} visits this week, focusing on: " + ", ".join(
                set(m.products for m in meetings if m.products)
            ) + ".",
            "data": [m.id for m in meetings]
        }
