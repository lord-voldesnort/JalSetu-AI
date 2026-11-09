def test_root_health_endpoint(client):
    """Test that GET /health returns HTTP 200 with standard application identity."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["app"] == "JalSetu AI"
    assert "version" in data
    assert "database" in data


def test_api_v1_health_endpoint(client):
    """Test that GET /api/v1/health returns HTTP 200."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["app"] == "JalSetu AI"


def test_root_info_endpoint(client):
    """Test root greeting endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["app"] == "JalSetu AI"
    assert "health" in data

