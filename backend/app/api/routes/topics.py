from fastapi import APIRouter
from app.core.prompts import TOPIC_STARTERS
from app.api.schemas import TopicResponse, SubTopic

router = APIRouter()


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
async def start_topic(topic_id: str) -> TopicResponse | dict:
    """
    GET /api/topics/vih_ist/start
    
    Quand l'utilisateur clique sur une thématique, cet endpoint retourne :
    1. Le message d'introduction (l'IA "lance" la discussion)
    2. Les sous-thèmes (boutons cliquables, comme PhiloGPT)
    3. Les thématiques liées (suggérer d'autres discussions)
    
    Exemple : clic sur "VIH / IST" → retourne :
    {
        "id": "vih_ist",
        "title": "VIH / IST",
        "icon": "",
        "starter_message": "Bonjour ! Parlons de la prévention...",
        "sub_topics": [
            {"label": "Prévention", "prompt": "Quels sont les moyens de..."},
            {"label": "Dépistage", "prompt": "Comment et où peut-on se..."},
            {"label": "Traitement", "prompt": "Quels sont les traitements..."}
        ],
        "related_topics": ["sante_reproductive", "epidemie"]
    }
    """
    topic_data = TOPIC_STARTERS.get(topic_id)
    if not topic_data:
        return {"error": "Thématique non trouvée"}

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
