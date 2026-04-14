from openai import AsyncOpenAI
from app.core.config import settings

client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)


async def detect_waypoints(
    scenario: dict,
    waypoints_state: dict,
    last_user_turn: str,
    last_maya_turn: str,
) -> dict:
    """
    Check each incomplete waypoint against the last exchange.
    Returns updated waypoints_state dict.
    Uses gpt-4o-mini for lightweight classification.
    """
    updated = dict(waypoints_state)
    context = f"User said: {last_user_turn}\nMaya said: {last_maya_turn}"

    for wp in scenario["waypoints"]:
        wp_id = wp["id"]
        if updated.get(wp_id, False):
            continue  # already complete

        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "Answer only 'yes' or 'no'."},
                {"role": "user", "content": f"{wp['detection_prompt']}\n\nContext:\n{context}"},
            ],
            max_tokens=5,
            temperature=0,
        )

        answer = response.choices[0].message.content.strip().lower()
        if answer.startswith("yes"):
            updated[wp_id] = True

    return updated


def get_current_waypoint(scenario: dict, waypoints_state: dict) -> dict | None:
    """Returns the first incomplete waypoint."""
    for wp in scenario["waypoints"]:
        if not waypoints_state.get(wp["id"], False):
            return wp
    return None


def get_last_completed_waypoint(scenario: dict, waypoints_state: dict) -> dict | None:
    """Returns the last completed waypoint (for twist eligibility checks)."""
    last = None
    for wp in scenario["waypoints"]:
        if waypoints_state.get(wp["id"], False):
            last = wp
    return last
