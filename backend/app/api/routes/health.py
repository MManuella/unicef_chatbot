from fastapi import APIRouter

# Un "router" est un groupe de routes. On le branchera dans main.py
router = APIRouter()


@router.get("/health")
async def health_check():
    """
    Endpoint de vérification : GET /api/health
    
    Retourne {"status": "ok"} si l'API fonctionne.
    C'est tout. Pas de logique compliquée ici.
    
    Utilité :
    - Le frontend peut vérifier que le backend est joignable
    - Docker peut vérifier que le conteneur est sain (healthcheck)
    """
    return {"status": "ok"}
