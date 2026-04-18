import pytest
from tests.conftest import client

def test_read_main():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Welcome to Agentic PRD Harness Backend API"}

def test_create_document():
    # Red Phase for T013
    response = client.post(
        "/api/documents",
        json={"title": "Test PRD"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "id" in data
    assert data["title"] == "Test PRD"
    assert data["status"] == "Draft"

def test_update_document():
    # Red Phase for T013
    # Create doc first
    create_response = client.post(
        "/api/documents",
        json={"title": "Test PRD"}
    )
    doc_id = create_response.json()["id"]

    # Update doc
    update_response = client.put(
        f"/api/documents/{doc_id}",
        json={"content": {"scenarios": ["Scenario 1"], "requirements": ["FR-001"]}}
    )
    assert update_response.status_code == 200
    
    # Optional: fetch to verify if GET exists, or check response
    data = update_response.json()
    assert data["content"]["scenarios"] == ["Scenario 1"]
