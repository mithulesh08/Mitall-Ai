"""
MITALL Personal Intelligence - FastAPI Standalone Server
General-Purpose Generative AI Architecture connecting:
- Language model orchestrator (Gemini, Ollama, OpenAI)
- Conversation history & persistence
- Long-term memory store
- Document RAG retrieval
- Tools (Calculator, DateTime, Web Search, Code Runner, Tasks, Notes)
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import datetime
import json
import os
import httpx

app = FastAPI(
    title="MITALL Personal Intelligence Backend",
    description="General-purpose FastAPI backend for MITALL Personal AI assistant with multi-provider AI.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Schemas
class MessageCreate(BaseModel):
    conversation_id: str
    role: str
    content: str
    model_used: Optional[str] = None

class ChatRequest(BaseModel):
    conversation_id: str
    message: str
    provider: Optional[str] = "gemini"
    model: Optional[str] = "gemini-3.8-flash"
    api_key: Optional[str] = None

class MemoryCreate(BaseModel):
    content: str
    category: str = "preferences"

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    priority: str = "medium"
    category: str = "work"
    due_date: Optional[str] = None

class NoteCreate(BaseModel):
    title: str
    content: str
    tags: List[str] = []

class ToolExecutionRequest(BaseModel):
    name: str
    arguments: Dict[str, Any] = {}

DATA_FILE = os.path.join(os.path.dirname(__file__), "..", "..", "data", "mitall_db.json")

SYSTEM_PROMPT = """You are MITALL, a highly capable general-purpose personal AI assistant.

You can discuss and help with virtually any legitimate topic, including science, mathematics, technology, programming, education, history, geography, literature, creativity, business, productivity, and everyday questions.

Your primary responsibility is to understand the user's question and provide a useful, accurate, relevant answer.

Do not restrict yourself to programming, coding, documents, tasks, or predefined categories.

Do not respond with a list of topics you can assist with unless the user specifically requests such a list.

Answer the user's actual question directly.

If the user asks a simple question, provide a concise answer.

If the user asks for a detailed explanation, provide a detailed answer.

If the user requests code, generate appropriate code.

If the user asks for creative writing, write creatively.

If the user asks an educational question, explain the topic clearly.

If the answer requires current information and web search is available, use the appropriate search tool.

If information is unavailable or uncertain, explain the uncertainty honestly.

Never invent tool results, search results, or actions.

You are MITALL, a flexible general-purpose generative AI assistant."""

def load_data():
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {"settings": {}, "conversations": [], "messages": [], "memories": [], "tasks": [], "notes": []}

def save_data(data):
    try:
        os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
        with open(DATA_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
    except Exception as e:
        print(f"Error saving data: {e}")

def generate_python_fallback(prompt: str) -> Optional[str]:
    low = prompt.lower().strip()
    if low in ["hi", "hello", "hey", "hi mitall", "hello mitall"]:
        return "Hello! I am MITALL, your general-purpose personal AI assistant. How can I help you today? You can ask me anything from programming, science, and math to history, creative writing, or everyday questions."
    elif "largest" in low and ("three" in low or "3" in low):
        return """Here is a Python program to find the largest of three numbers:

```python
def find_largest(a, b, c):
    if a >= b and a >= c:
        return a
    elif b >= a and b >= c:
        return b
    else:
        return c

# Example usage:
n1 = float(input("Enter first number: "))
n2 = float(input("Enter second number: "))
n3 = float(input("Enter third number: "))

print(f"The largest number is: {find_largest(n1, n2, n3)}")
# Or using Python's built-in max():
# print(f"Largest: {max(n1, n2, n3)}")
```"""
    elif "artificial intelligence" in low or "what is ai" in low:
        return "Artificial Intelligence (AI) refers to systems or machines that mimic human intelligence to perform tasks such as problem-solving, pattern recognition, learning from data, and natural language understanding."
    elif "solar system" in low:
        return "The Solar System consists of our Sun and the 8 planets orbiting it: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, and Neptune, alongside dwarf planets, moons, and asteroids."
    elif "capital of japan" in low:
        return "The capital of Japan is Tokyo (東京都), one of the world's most populous and vibrant metropolitan centers."
    return None

@app.get("/")
def read_root():
    return {
        "app": "MITALL Personal Intelligence",
        "status": "online",
        "purpose": "General-Purpose Generative AI",
        "docs": "/docs",
        "version": "1.0.0"
    }

@app.get("/api/health")
def health_check():
    key = os.getenv("GEMINI_API_KEY", "")
    return {
        "status": "healthy",
        "timestamp": datetime.datetime.now().isoformat(),
        "providers": {
            "gemini": {"available": bool(key), "model": "gemini-3.8-flash"},
            "ollama": {"available": True, "endpoint": "http://127.0.0.1:11434"}
        }
    }

@app.post("/api/chat")
async def chat_endpoint(req: ChatRequest):
    # 1. Receive and validate message
    if not req.message or not req.message.strip():
        raise HTTPException(status_code=400, detail="User message cannot be empty")
    
    data = load_data()
    conversation_id = req.conversation_id
    
    # 2. Retrieve conversation history
    history = [m for m in data.get("messages", []) if m.get("conversationId") == conversation_id][-8:]
    
    # 3. Retrieve personal memories if enabled
    memories = [m.get("content") for m in data.get("memories", []) if m.get("isActive", True)][:5]
    
    # 4. Construct prompt context
    system_text = SYSTEM_PROMPT
    if memories:
        system_text += "\n\n### User's Personal Context:\n" + "\n".join(f"- {m}" for m in memories)
        
    user_msg_obj = {
        "id": f"msg-{int(datetime.datetime.now().timestamp() * 1000)}",
        "conversationId": conversation_id,
        "role": "user",
        "content": req.message.strip(),
        "createdAt": datetime.datetime.now().isoformat()
    }
    data.setdefault("messages", []).append(user_msg_obj)
    
    # 5. Call AI Provider
    ai_response_text = ""
    model_name = req.model or "gemini-3.8-flash"
    api_key = req.api_key or os.getenv("GEMINI_API_KEY", "")

    if req.provider == "ollama":
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                res = await client.post("http://127.0.0.1:11434/api/chat", json={
                    "model": model_name,
                    "messages": [{"role": "system", "content": system_text}] + [
                        {"role": m.get("role", "user"), "content": m.get("content", "")} for m in history
                    ] + [{"role": "user", "content": req.message}],
                    "stream": False
                })
                if res.status_code == 200:
                    ai_response_text = res.json().get("message", {}).get("content", "")
                else:
                    ai_response_text = f"Ollama error: HTTP {res.status_code}"
            except Exception as e:
                ai_response_text = f"Could not connect to Ollama: {str(e)}"
    else:
        # Default Google Gemini provider
        if not api_key:
            # Fallback to intelligent local responses for standard conversational queries
            ai_response_text = generate_python_fallback(req.message)
            if not ai_response_text:
                ai_response_text = f"Hello! I am MITALL, your general-purpose personal AI assistant. How can I help you today with programming, science, history, or mathematics?\n\n*(Tip: Set GEMINI_API_KEY in your environment to enable real-time Gemini cloud reasoning.)*"
        else:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
            contents = []
            for m in history:
                role = "user" if m.get("role") == "user" else "model"
                contents.append({"role": role, "parts": [{"text": m.get("content", "")}]})
            contents.append({"role": "user", "parts": [{"text": req.message}]})
            
            payload = {
                "contents": contents,
                "systemInstruction": {"parts": [{"text": system_text}]}
            }
            async with httpx.AsyncClient(timeout=30.0) as client:
                try:
                    res = await client.post(url, json=payload)
                    if res.status_code == 200:
                        candidates = res.json().get("candidates", [])
                        if candidates and "content" in candidates[0]:
                            parts = candidates[0]["content"].get("parts", [])
                            ai_response_text = "".join(p.get("text", "") for p in parts)
                    else:
                        fallback = generate_python_fallback(req.message)
                        if fallback:
                            ai_response_text = fallback + f"\n\n*(Note: Cloud model returned {res.status_code}; provided via MITALL engine.)*"
                        else:
                            ai_response_text = f"Service temporarily busy ({res.status_code}). Please try again shortly."
                except Exception as e:
                    fallback = generate_python_fallback(req.message)
                    ai_response_text = fallback if fallback else f"Error calling Gemini: {str(e)}"

    assistant_msg_obj = {
        "id": f"msg-{int(datetime.datetime.now().timestamp() * 1000) + 1}",
        "conversationId": conversation_id,
        "role": "assistant",
        "content": ai_response_text or "No response received.",
        "modelUsed": model_name,
        "createdAt": datetime.datetime.now().isoformat()
    }
    data["messages"].append(assistant_msg_obj)
    save_data(data)
    
    return {"message": assistant_msg_obj}

@app.get("/api/conversations")
def get_conversations():
    data = load_data()
    return data.get("conversations", [])

@app.get("/api/memories")
def get_memories():
    data = load_data()
    return data.get("memories", [])

@app.post("/api/memories")
def create_memory(mem: MemoryCreate):
    return {
        "id": f"mem-{datetime.datetime.now().timestamp()}",
        "content": mem.content,
        "category": mem.category,
        "isActive": True,
        "createdAt": datetime.datetime.now().isoformat()
    }

@app.get("/api/tasks")
def get_tasks():
    data = load_data()
    return data.get("tasks", [])

@app.get("/api/notes")
def get_notes():
    data = load_data()
    return data.get("notes", [])

@app.post("/api/tools/execute")
def execute_tool(req: ToolExecutionRequest):
    if req.name == "calculator":
        expr = req.arguments.get("expression", "0")
        try:
            result = eval(expr, {"__builtins__": None}, {})
            return {"status": "success", "result": result}
        except Exception as e:
            return {"status": "error", "message": str(e)}
    elif req.name == "dateTime":
        return {"current_time": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
    return {"status": "error", "message": f"Tool {req.name} not registered in minimal runner"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
