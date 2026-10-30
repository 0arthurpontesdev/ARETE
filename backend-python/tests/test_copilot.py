import pytest
import json
from src.app import create_app
from src.services.ai_copilot_service import MeetingAICopilotService

@pytest.fixture
def client():
    app = create_app()
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client

@pytest.fixture
def sample_meeting_data():
    return {
        "topic": "Sprint Planning & Arquitetura WebRTC",
        "date": "30 de Outubro de 2026",
        "duration": "30 minutos",
        "participants": [
            {"name": "Arthur", "identity": "host-1", "isHost": True},
            {"name": "Natan H.", "identity": "user-2", "isHost": False},
            {"name": "Mona Mulha", "identity": "user-3", "isHost": False}
        ],
        "transcripts": [
            {"speaker": "Arthur", "text": "Boa tarde pessoal, vamos alinhar a entrega do Copilot.", "timestamp": "14:02"},
            {"speaker": "Natan H.", "text": "Eu vou revisar os testes de integração do LiveKit hoje.", "timestamp": "14:05"},
            {"speaker": "Mona Mulha", "text": "Ficou acordado que manteremos o layout Zoom Dark Mode.", "timestamp": "14:10"},
            {"speaker": "Arthur", "text": "Excelente, precisamos entregar o resumo automático até o fim do dia.", "timestamp": "14:15"}
        ],
        "chat_messages": [
            {"senderName": "Natan H.", "text": "Alguém pode me passar o link da documentação?", "timestamp": "14:08"},
            {"senderName": "Arthur", "text": "Enviado no chat privado!", "timestamp": "14:09"}
        ]
    }

def test_health_check(client):
    res = client.get("/api/copilot/health")
    assert res.status_code == 200
    data = res.get_json()
    assert data["status"] == "online"
    assert "gemini_active" in data

def test_summary_endpoint(client, sample_meeting_data):
    res = client.post("/api/copilot/summary", json=sample_meeting_data)
    assert res.status_code == 200
    data = res.get_json()
    assert "topic" in data
    assert "executive_summary" in data
    assert "key_points" in data
    assert isinstance(data["key_points"], list)
    assert "main_decisions" in data
    assert len(data["executive_summary"]) > 20

def test_minutes_endpoint(client, sample_meeting_data):
    res = client.post("/api/copilot/minutes", json=sample_meeting_data)
    assert res.status_code == 200
    data = res.get_json()
    assert "title" in data
    assert "date" in data
    assert "attendees" in data
    assert "agenda" in data
    assert "discussions" in data
    assert "decisions" in data
    assert "action_items" in data
    assert "formatted_document" in data
    assert "ATA DE REUNIÃO" in data["formatted_document"]
    assert "Arthur" in data["host"]

def test_action_items_endpoint(client, sample_meeting_data):
    res = client.post("/api/copilot/action-items", json=sample_meeting_data)
    assert res.status_code == 200
    data = res.get_json()
    assert "action_items" in data
    assert isinstance(data["action_items"], list)
    assert len(data["action_items"]) > 0
    first_item = data["action_items"][0]
    assert "task" in first_item
    assert "assignee" in first_item
    assert "priority" in first_item

def test_ask_endpoint(client, sample_meeting_data):
    payload = {
        "meeting_data": sample_meeting_data,
        "question": "O que o Natan vai fazer?"
    }
    res = client.post("/api/copilot/ask", json=payload)
    assert res.status_code == 200
    data = res.get_json()
    assert "question" in data
    assert "answer" in data
    assert len(data["answer"]) > 5
