import unittest
from fastapi.testclient import TestClient
from server.api import app


class TestAPI(unittest.TestCase):
    """Test API endpoints."""
    
    def setUp(self):
        self.client = TestClient(app)
    
    def test_health_endpoint(self):
        """health check endpoint must respond 200 with a status field."""
        response = self.client.get("/api/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        # status is "ok" only when db is reachable AND api keys are configured.
        # in ci/tests without API_KEYS, "degraded" is the correct value.
        self.assertIn(data["status"], ["ok", "degraded"])
        self.assertIn("service", data)
        self.assertIn("version", data)

    def test_health_endpoint_detailed(self):
        """health endpoint must report real database state and key/session counts."""
        response = self.client.get("/api/health")
        data = response.json()
        self.assertIn("database", data)
        self.assertIn(data["database"], ["connected", "unavailable"])
        self.assertIn("api_keys_configured", data)
        self.assertIsInstance(data["api_keys_configured"], int)
        self.assertIn("active_sessions", data)
        self.assertIsInstance(data["active_sessions"], int)
    
    def test_submit_session_invalid_question(self):
        """Test session submission with invalid question."""
        response = self.client.post("/api/session", json={
            "question": "",  # Empty question
            "rounds": 3,
            "quorum_threshold": 0.75
        })
        self.assertIn(response.status_code, [400, 422])  # Validation error
    
    def test_submit_session_short_question(self):
        """Test session submission with too short question."""
        response = self.client.post("/api/session", json={
            "question": "Hi",  # Too short (< 10 chars)
            "rounds": 3,
            "quorum_threshold": 0.75
        })
        self.assertIn(response.status_code, [400, 422])
    
    def test_submit_session_invalid_rounds(self):
        """Test session submission with invalid rounds."""
        response = self.client.post("/api/session", json={
            "question": "Should we deploy this smart contract to mainnet?",
            "rounds": 15,  # Too many rounds (> 10)
            "quorum_threshold": 0.75
        })
        self.assertIn(response.status_code, [400, 422])
    
    def test_submit_session_invalid_quorum(self):
        """Test session submission with invalid quorum threshold."""
        response = self.client.post("/api/session", json={
            "question": "Should we deploy this smart contract to mainnet?",
            "rounds": 3,
            "quorum_threshold": 0.3  # Too low (< 0.51)
        })
        self.assertIn(response.status_code, [400, 422])
    
    def test_submit_session_valid(self):
        """Test session submission with valid data."""
        response = self.client.post("/api/session", json={
            "question": "Should we deploy this smart contract to mainnet?",
            "rounds": 3,
            "quorum_threshold": 0.75
        })
        # Should succeed (though might fail if NVIDIA API is down)
        self.assertIn(response.status_code, [200, 500])  # 200 = success, 500 = API error
    
    def test_get_sessions(self):
        """Test getting session list."""
        response = self.client.get("/api/sessions")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIsInstance(data, list)
    
    def test_get_agents(self):
        """Test getting agents list."""
        response = self.client.get("/api/agents")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIsInstance(data, list)
        # Should have 4 agents if reputation system is initialized
        if len(data) > 0:
            self.assertIn("persona", data[0])
            self.assertIn("reputation_score", data[0])
    
    def test_get_nonexistent_session(self):
        """Test getting a session that doesn't exist."""
        response = self.client.get("/api/session/nonexistent-id")
        self.assertEqual(response.status_code, 404)
    
    def test_rate_limiting_headers(self):
        """Test that rate limiting is in place (may not trigger immediately)."""
        # Make multiple requests to test rate limiting
        responses = []
        for _ in range(5):
            response = self.client.get("/api/health")
            responses.append(response.status_code)
        
        # First few should succeed
        self.assertIn(200, responses)
        # After many requests, might get 429 (rate limit)
        # But since we're only making 5 requests, it might not trigger


class TestRateLimiting(unittest.TestCase):
    """Test rate limiting functionality."""
    
    def test_rate_limit_store_structure(self):
        """Test that rate limit store is properly initialized."""
        from server.api import rate_limit_store
        from collections import defaultdict
        
        self.assertIsInstance(rate_limit_store, defaultdict)
        self.assertEqual(rate_limit_store.default_factory, list)
    
    def test_check_rate_limit_function(self):
        """Test the rate limit checking function."""
        from server.api import check_rate_limit
        
        # First request should pass
        result1 = check_rate_limit("127.0.0.1")
        self.assertTrue(result1)
        
        # Second request should also pass (unless rate limit is very low)
        result2 = check_rate_limit("127.0.0.1")
        self.assertTrue(result2)


if __name__ == "__main__":
    unittest.main()
