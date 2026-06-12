"""
POST /api/chat/        → réponse complète
POST /api/chat/stream  → réponse en streaming SSE (token par token)
"""

import logging
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from app.api.schemas import ChatRequest, ChatResponse
from app.services.chat_service import ChatService
from app.api.dependencies import get_chat_service

router = APIRouter()


@router.post("/", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    chat_service: ChatService = Depends(get_chat_service),
):
    try:
        response = await chat_service.get_response(
            question=request.message,
            conversation_id=request.conversation_id,
            history=[m.model_dump() for m in request.history],
        )
        return response
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception:
        logging.exception("[CHAT] Erreur inattendue")
        raise HTTPException(status_code=500, detail="Erreur interne du serveur.")


@router.post("/stream")
async def chat_stream(
    request: ChatRequest,
    chat_service: ChatService = Depends(get_chat_service),
):
    """
    Réponse en streaming SSE. Exemple de tokens reçus :
        data: {"token": "Le", "done": false}
        ...
        data: {"token": "", "done": true, "sources": [...]}
    """
    try:
        return StreamingResponse(
            chat_service.stream_response(
                question=request.message,
                conversation_id=request.conversation_id,
                history=[m.model_dump() for m in request.history],
            ),
            media_type="text/event-stream",
        )
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception:
        logging.exception("[CHAT STREAM] Erreur inattendue")
        raise HTTPException(status_code=500, detail="Erreur interne du serveur.")
