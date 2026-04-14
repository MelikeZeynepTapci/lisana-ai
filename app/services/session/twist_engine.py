import random
from app.services.session.session_manager import LEVEL_PARAMS

LEVEL_ORDER = ["A1", "A2", "B1", "B2", "C1"]


def should_fire_twist(
    level: str,
    turn_count: int,
    twists_fired: int,
    turns_since_last_twist: int,
) -> bool:
    params = LEVEL_PARAMS.get(level, LEVEL_PARAMS["A1"])
    soft_cap = params["soft_cap"]
    max_twists = params["max_twists"]

    if turn_count < 2:
        return False
    if turn_count >= soft_cap - 2:
        return False
    if twists_fired >= max_twists:
        return False
    if turns_since_last_twist < 3:
        return False

    return True


def select_twist(
    scenario: dict,
    last_completed_waypoint_name: str | None,
    level: str,
) -> dict | None:
    """
    Select an eligible twist based on current waypoint and level.
    Returns a twist dict or None if nothing is eligible.
    """
    eligible = []

    for twist in scenario.get("possible_twists", []):
        min_level = twist.get("min_level", "A1")
        if LEVEL_ORDER.index(level) < LEVEL_ORDER.index(min_level):
            continue

        fires_after = twist.get("fires_after_waypoint")
        if fires_after and fires_after != last_completed_waypoint_name:
            continue

        eligible.append(twist)

    if not eligible:
        return None

    return random.choice(eligible)
