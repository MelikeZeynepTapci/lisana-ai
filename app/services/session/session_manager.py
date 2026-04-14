import json
from pathlib import Path
from typing import Optional

SCENARIOS_DIR = Path(__file__).parent.parent.parent.parent / "docs" / "scenarios"

LEVEL_PARAMS: dict[str, dict] = {
    "A1": {"soft_cap": 8,  "hard_cap": 12, "max_twists": 1},
    "A2": {"soft_cap": 9,  "hard_cap": 13, "max_twists": 1},
    "B1": {"soft_cap": 10, "hard_cap": 14, "max_twists": 1},
    "B2": {"soft_cap": 11, "hard_cap": 15, "max_twists": 2},
    "C1": {"soft_cap": 12, "hard_cap": 16, "max_twists": 2},
}

SOFT_VOICE_CAP = 9 * 60   # seconds
HARD_VOICE_CAP = 12 * 60  # seconds
MIN_EVALUATABLE_UTTERANCES = 6


def load_scenario(scenario_id: str) -> dict:
    path = SCENARIOS_DIR / f"{scenario_id}.json"
    with open(path) as f:
        return json.load(f)


def all_required_waypoints_complete(scenario: dict, waypoints_state: dict) -> bool:
    required = [wp["id"] for wp in scenario["waypoints"] if wp.get("required_for_completion")]
    return bool(required) and all(waypoints_state.get(wp_id, False) for wp_id in required)


def check_end_trigger(
    level: str,
    turn_count: int,
    voice_seconds: float,
    waypoints_state: dict,
    wrap_up_turns: int,
    state: str,
    scenario: dict,
) -> Optional[str]:
    """
    Returns 'hard', 'soft', or None.
    Hard = immediate end, no wrap-up.
    Soft = begin wrap-up (2 turns to close naturally).
    """
    params = LEVEL_PARAMS.get(level, LEVEL_PARAMS["A1"])

    # Hard caps — absolute limits
    if turn_count >= params["hard_cap"]:
        return "hard"
    if voice_seconds >= HARD_VOICE_CAP:
        return "hard"
    # Already in wrap-up and used 2 turns → force end
    if state in ("WRAP_UP_SIGNAL", "WRAP_UP") and wrap_up_turns >= 2:
        return "hard"

    # If already wrapping up, keep it going (don't re-trigger soft)
    if state in ("WRAP_UP_SIGNAL", "WRAP_UP"):
        return None

    # Soft triggers
    if turn_count >= params["soft_cap"]:
        return "soft"
    if voice_seconds >= SOFT_VOICE_CAP:
        return "soft"
    if turn_count >= MIN_EVALUATABLE_UTTERANCES and all_required_waypoints_complete(scenario, waypoints_state):
        return "soft"

    return None


def get_turn_display(level: str, turn_count: int) -> dict:
    params = LEVEL_PARAMS.get(level, LEVEL_PARAMS["A1"])
    return {"current": turn_count, "soft_cap": params["soft_cap"]}
