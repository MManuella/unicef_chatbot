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
    """
    POST /api/chat/
    ...
    """
    try:
        response = await chat_service.get_response(
            question=request.message,
            conversation_id=request.conversation_id,
        )
        return response
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        import logging
        logging.exception("[CHAT] Erreur inattendue")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/stream")
async def chat_stream(
    request: ChatRequest,
    chat_service: ChatService = Depends(get_chat_service),
):
    try:
        return StreamingResponse(
            chat_service.stream_response(
                question=request.message,
                conversation_id=request.conversation_id,
            ),
            media_type="text/event-stream",
        )
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Erreur interne du serveur.")
    """
    POST /api/chat/stream
    Body : {"message": "Comment prévenir le VIH ?"}
    
    Même chose que /chat/ MAIS la réponse arrive en streaming :
    - Les tokens (mots) arrivent un par un
    - Le frontend les affiche au fur et à mesure
    - L'utilisateur voit la réponse se "taper" en temps réel
    
    Utilise le protocole SSE (Server-Sent Events) :
    Le serveur envoie des lignes "data: {...}" au fur et à mesure.
    
    Exemple de ce que le frontend reçoit :
        data: {"token": "Le", "done": false}
        data: {"token": " VIH", "done": false}
        data: {"token": " se", "done": false}
        data: {"token": " transmet", "done": false}
        ...
        data: {"token": "", "done": true, "sources": [...]}
    """
    return StreamingResponse(
        chat_service.stream_response(
            question=request.message,
            conversation_id=request.conversation_id,
        ),
        media_type="text/event-stream",
    )
