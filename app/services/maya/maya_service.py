from typing import AsyncGenerator
from openai import AsyncOpenAI
from app.core.config import settings
from app.services.maya.prompt_templates import (
    SYSTEM_PROMPT_TEMPLATE,
    OPENING_PROMPT_TEMPLATE,
    WRAP_UP_INJECTION,
    TWIST_INJECTION,
    VOCAB_LEVELS,
)

client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)


def _build_system_prompt(
    scenario: dict,
    level: str,
    language: str,
    waypoints_state: dict,
    turn_count: int,
    soft_cap: int,
    wrap_up: bool = False,
    twist: dict | None = None,
) -> str:
    persona = scenario["maya_persona"]
    waypoints = scenario["waypoints"]

    # Find current waypoint (first incomplete) and next waypoint
    current_wp = None
    next_wp = None
    for wp in waypoints:
        done = waypoints_state.get(wp["id"], False)
        if not done:
            if current_wp is None:
                current_wp = wp
            elif next_wp is None:
                next_wp = wp
                break

    current_name = current_wp["name"] if current_wp else "complete"
    current_status = "in progress" if current_wp else "completed"
    next_name = next_wp["name"] if next_wp else "none"

    prompt = SYSTEM_PROMPT_TEMPLATE.format(
        scenario_id=scenario["id"],
        persona_name=persona["name"],
        persona_role=persona["role"],
        persona_location=persona["location"],
        level=level,
        language=language,
        current_waypoint_name=current_name,
        current_waypoint_status=current_status,
        next_waypoint_name=next_name,
        turn_count=turn_count,
        soft_cap=soft_cap,
        wrap_up_signal="true" if wrap_up else "false",
        twist_active=twist["id"] if twist else "none",
        vocab_level=VOCAB_LEVELS.get(level, VOCAB_LEVELS["B1"]),
    )

    if wrap_up:
        prompt += "\n\n" + WRAP_UP_INJECTION

    if twist:
        prompt += "\n\n" + TWIST_INJECTION.format(
            twist_id=twist["id"],
            twist_example=twist.get("example", ""),
        )

    return prompt


def _build_opening_prompt(scenario: dict, level: str, language: str, user_name: str | None = None) -> str:
    persona = scenario["maya_persona"]
    prompt = OPENING_PROMPT_TEMPLATE.format(
        scenario_id=scenario["id"],
        persona_name=persona["name"],
        persona_role=persona["role"],
        persona_location=persona["location"],
        level=level,
        language=language,
        vocab_level=VOCAB_LEVELS.get(level, VOCAB_LEVELS["B1"]),
    )
    if user_name:
        prompt += f"\nThe user's name is {user_name}. Greet them by name in your opening line."
    return prompt


async def stream_maya_opening(
    scenario: dict,
    level: str,
    language: str,
    user_name: str | None = None,
) -> AsyncGenerator[str, None]:
    system_prompt = _build_opening_prompt(scenario, level, language, user_name)
    stream = await client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "system", "content": system_prompt}],
        temperature=0.8,
        max_tokens=80,
        stream=True,
    )
    async for chunk in stream:
        delta = chunk.choices[0].delta.content
        if delta:
            yield delta


async def stream_maya_turn(
    scenario: dict,
    level: str,
    language: str,
    conversation_history: list[dict],
    user_message: str,
    waypoints_state: dict,
    turn_count: int,
    soft_cap: int,
    wrap_up: bool = False,
    twist: dict | None = None,
) -> AsyncGenerator[str, None]:
    system_prompt = _build_system_prompt(
        scenario=scenario,
        level=level,
        language=language,
        waypoints_state=waypoints_state,
        turn_count=turn_count,
        soft_cap=soft_cap,
        wrap_up=wrap_up,
        twist=twist,
    )

    messages = [{"role": "system", "content": system_prompt}]
    messages.extend(conversation_history)
    messages.append({"role": "user", "content": user_message})

    stream = await client.chat.completions.create(
        model="gpt-4o",
        messages=messages,
        temperature=0.8,
        max_tokens=100,
        stream=True,
    )
    async for chunk in stream:
        delta = chunk.choices[0].delta.content
        if delta:
            yield delta
