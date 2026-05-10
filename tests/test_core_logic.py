import unittest

from config import API_KEYS
from core.selector import MetaAgent


@unittest.skipUnless(API_KEYS, "API_KEYS must be configured to instantiate MetaAgent")
class TestMetaAgent(unittest.TestCase):
    """tests for the MetaAgent governance router."""

    def setUp(self):
        self.agent = MetaAgent()

    def test_insufficient_agents_defaults_to_vote(self):
        """num_agents below the debate threshold must short-circuit to vote."""
        result = self.agent.analyze("Test question", num_agents=2)
        self.assertEqual(result["mechanism"], "vote")
        self.assertEqual(result["source"], "constraint")
        self.assertIn("Insufficient agents", result["reasoning"])

    def test_sufficient_agents_returns_valid_mechanism(self):
        """with enough agents the agent must return either 'debate' or 'vote'.
        if the api is unavailable, the error path returns 'vote' with source='error'."""
        result = self.agent.analyze("Should we do this?", num_agents=4)
        self.assertIn(result["mechanism"], ["debate", "vote"])
        self.assertIn(result["source"], ["ai", "error"])


class TestLLMClient(unittest.TestCase):
    """tests for the LLMClient wrapper."""

    def test_client_initialization(self):
        """client should initialize from config.API_KEYS without errors."""
        from core.llm_client import LLMClient
        from config import API_KEYS

        if API_KEYS:
            client = LLMClient()
            self.assertGreater(len(client.api_keys), 0)
            self.assertIsNotNone(client.models)

    def test_model_for_index(self):
        """model_for_index must return a non-empty string for any valid index."""
        from core.llm_client import LLMClient
        from config import API_KEYS

        if API_KEYS:
            client = LLMClient()
            model = client.model_for_index(0)
            self.assertIsInstance(model, str)
            self.assertGreater(len(model), 0)


class TestAgentReputation(unittest.TestCase):
    """tests for the agent reputation system."""

    @classmethod
    def setUpClass(cls):
        from server.database import init_db
        init_db()

    def test_reputation_initialization(self):
        """default agent set must seed the reputation leaderboard."""
        from server.agent_reputation import init_agent_reputation, get_leaderboard

        init_agent_reputation()
        leaderboard = get_leaderboard()

        self.assertIsInstance(leaderboard, list)
        self.assertEqual(len(leaderboard), 4)

    def test_reputation_update(self):
        """update_agent_reputation must increment sessions_participated."""
        from server.agent_reputation import update_agent_reputation, get_agent_reputation

        update_agent_reputation("Agent_1_Analyst", delta=5.0, correct=True)
        agent = get_agent_reputation("Agent_1_Analyst")

        if agent:
            self.assertEqual(agent.agent_name, "Agent_1_Analyst")
            self.assertGreater(agent.sessions_participated, 0)


if __name__ == "__main__":
    unittest.main()
