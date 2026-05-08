import unittest
from core.selector import MetaAgent, DEBATE_SIGNALS, VOTE_SIGNALS


class TestMetaAgent(unittest.TestCase):
    """Test the MetaAgent selector logic."""
    
    def setUp(self):
        self.agent = MetaAgent()
    
    def test_debate_signals_list(self):
        """Test that debate signals are defined."""
        self.assertIsInstance(DEBATE_SIGNALS, list)
        self.assertGreater(len(DEBATE_SIGNALS), 0)
        self.assertIn("should", DEBATE_SIGNALS)
        self.assertIn("ethical", DEBATE_SIGNALS)
    
    def test_vote_signals_list(self):
        """Test that vote signals are defined."""
        self.assertIsInstance(VOTE_SIGNALS, list)
        self.assertGreater(len(VOTE_SIGNALS), 0)
        self.assertIn("what is", VOTE_SIGNALS)
        self.assertIn("true or false", VOTE_SIGNALS)
    
    def test_keyword_fallback_debate(self):
        """Test keyword fallback selects debate for debate signals."""
        result = self.agent._keyword_fallback("Should we deploy this contract?")
        self.assertEqual(result["mechanism"], "debate")
        self.assertIn("detected complexity signal", result["reasoning"])
    
    def test_keyword_fallback_vote(self):
        """Test keyword fallback selects vote for vote signals."""
        result = self.agent._keyword_fallback("What is 2 + 2?")
        self.assertEqual(result["mechanism"], "vote")
        self.assertIn("detected factual signal", result["reasoning"])
    
    def test_insufficient_agents(self):
        """Test that insufficient agents defaults to vote."""
        result = self.agent.analyze("Test question", num_agents=2)
        self.assertEqual(result["mechanism"], "vote")
        self.assertIn("Insufficient agents", result["reasoning"])
    
    def test_sufficient_agents_default(self):
        """Test that sufficient agents allows AI decision."""
        # This will fall back to keyword matching if API fails
        result = self.agent.analyze("Should we do this?", num_agents=4)
        self.assertIn(result["mechanism"], ["debate", "vote"])


class TestLLMClient(unittest.TestCase):
    """Test LLM client basic functionality."""
    
    def test_client_initialization(self):
        """Test that LLM client can be initialized."""
        from core.llm_client import LLMClient, LLMResponse
        from config import NVIDIA_API_KEYS
        
        if NVIDIA_API_KEYS:
            client = LLMClient()
            self.assertGreater(len(client.api_keys), 0)
            self.assertIsNotNone(client.models)
    
    def test_model_for_index(self):
        """Test model selection by index."""
        from core.llm_client import LLMClient
        from config import NVIDIA_API_KEYS, NVIDIA_MODELS
        
        if NVIDIA_API_KEYS:
            client = LLMClient()
            model = client.model_for_index(0)
            self.assertIsInstance(model, str)
            self.assertGreater(len(model), 0)


class TestAgentReputation(unittest.TestCase):
    """Test agent reputation system."""
    
    def test_reputation_initialization(self):
        """Test that default agents can be initialized."""
        from server.agent_reputation import init_agent_reputation, get_leaderboard
        
        init_agent_reputation()
        leaderboard = get_leaderboard()
        
        self.assertIsInstance(leaderboard, list)
        self.assertEqual(len(leaderboard), 4)  # 4 default agents
    
    def test_reputation_update(self):
        """Test that agent reputation can be updated."""
        from server.agent_reputation import update_agent_reputation, get_agent_reputation
        
        update_agent_reputation("Agent_1_Analyst", delta=5.0, correct=True)
        agent = get_agent_reputation("Agent_1_Analyst")
        
        if agent:
            self.assertEqual(agent.agent_name, "Agent_1_Analyst")
            self.assertGreater(agent.sessions_participated, 0)


class TestGitHubAudit(unittest.TestCase):
    """Test GitHub audit functionality."""
    
    def test_solidity_analysis_empty(self):
        """Test Solidity analysis with empty code."""
        from core.github_audit import GitHubAudit
        
        auditor = GitHubAudit()
        result = auditor.analyze_solidity_contract("")
        
        self.assertIn("vulnerabilities", result)
        self.assertIsInstance(result["vulnerabilities"], list)
        self.assertEqual(result["severity_score"], 0.0)
    
    def test_solidity_analysis_vulnerability(self):
        """Test Solidity analysis detects missing access control."""
        from core.github_audit import GitHubAudit
        
        auditor = GitHubAudit()
        code = """
        contract Vulnerable {
            function withdraw() public {
                msg.sender.transfer(address(this).balance);
            }
        }
        """
        result = auditor.analyze_solidity_contract(code)
        
        self.assertGreater(len(result["vulnerabilities"]), 0)
        self.assertGreater(result["severity_score"], 0)
    
    def test_rust_analysis_vulnerability(self):
        """Test Rust analysis detects missing owner check."""
        from core.github_audit import GitHubAudit
        
        auditor = GitHubAudit()
        code = """
        pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
            **ctx.accounts.vault.try_borrow_mut_lamports()? -= amount;
            **ctx.accounts.user.try_borrow_mut_lamports()? += amount;
            Ok(())
        }
        """
        result = auditor.analyze_rust_contract(code)
        
        self.assertGreater(len(result["vulnerabilities"]), 0)
        self.assertGreater(result["severity_score"], 0)


if __name__ == "__main__":
    unittest.main()
