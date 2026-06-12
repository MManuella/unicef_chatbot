import re
from typing import Annotated
from fastapi import APIRouter, HTTPException, Path
from app.core.prompts import TOPIC_STARTERS
from app.api.schemas import TopicResponse, SubTopic

router = APIRouter()

TopicId = Annotated[str, Path(pattern=r"^[a-z0-9_]{1,64}$")]


@router.get("/")
async def get_topics() -> dict:
    """
    GET /api/topics/
    
    Retourne la liste de toutes les thématiques disponibles.
    Le frontend les affiche dans le panneau latéral gauche.
    
    Exemple de réponse :
    {
        "topics": [
            {"id": "vih_ist", "title": "VIH / IST"},
            {"id": "hygiene", "title": "Hygiène"},
            ...
        ]
    }
    """
    topics = []
    for topic_id, topic_data in TOPIC_STARTERS.items():
        topics.append({
            "id": topic_id,
            "title": topic_data["title"],
        })
    return {"topics": topics}


@router.get("/{topic_id}/start")
async def start_topic(topic_id: TopicId) -> TopicResponse:
    topic_data = TOPIC_STARTERS.get(topic_id)
    if not topic_data:
        raise HTTPException(status_code=404, detail="Thématique non trouvée")

    return TopicResponse(
        id=topic_id,
        title=topic_data["title"],
        icon=topic_data.get("icon", ""),
        starter_message=topic_data["starter_message"],
        sub_topics=[
            SubTopic(label=st["label"], prompt=st["prompt"])
            for st in topic_data.get("sub_topics", [])
        ],
        related_topics=topic_data.get("related_topics", []),
    )
