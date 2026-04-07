import config

def decide_mechanism(question: str, num_agents: int = None) -> tuple[str, str]:
    """
    Decides whether a question should be handled via 'debate' or 'vote'.
    
    Decision logic:
    - If num_agents < 3, debate is ineffective; fallback to vote.
    - If question contains complexity signals (ethical, strategic, explain), debate.
    - If question contains fact signals (what is, how many, true or false), vote.
    - Default to vote for efficiency if unclear.
    
    Returns:
        tuple: (mechanism_name, reason_string)
    """
    if num_agents is None:
        num_agents = config.NUM_AGENTS

    if num_agents < 3:
        return "vote", f"Not enough agents for debate ({num_agents} < 3). Defaulting to vote."

    question_lower = question.lower()
    
    debate_signals = [
        "should", "why", "explain", "ethical", "moral", "strategy", 
        "complex", "better", "worse", "evaluate", "subjective"
    ]
    
    vote_signals = [
        "what is", "how many", "who", "when", "where", "true or false", 
        "yes or no", "fact", "calculate"
    ]

    # check strict binary/factual vote signals first
    for signal in vote_signals:
        if signal in question_lower:
            return "vote", f"Question contains factual/binary signal ('{signal}'). Efficient to vote."

    # check debate signals
    for signal in debate_signals:
        if signal in question_lower:
            return "debate", f"Question contains complex/analytical signal ('{signal}'). Requires debate."

    # default
    return "vote", "No strong complexity signals detected. Defaulting to efficient vote."
