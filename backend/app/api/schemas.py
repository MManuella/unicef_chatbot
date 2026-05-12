from pydantic import BaseModel, Field


# ============================================================
# CE QUE LE FRONTEND ENVOIE AU BACKEND
# ============================================================

class HistoryMessage(BaseModel):
    """Un message dans l'historique de la conversation."""
    role: str
    content: str


class ChatRequest(BaseModel):
    """Quand l'utilisateur envoie un message, le frontend envoie ceci."""
    message: str = Field(..., min_length=1, max_length=2000)
    conversation_id: str | None = None  # Pour regrouper les messages d'une conversation
    theme_id: str | None = None          # Thématique sélectionnée (contexte métier)
    history: list[HistoryMessage] = []   # Historique de la conversation


# ============================================================
# CE QUE LE BACKEND RENVOIE AU FRONTEND
# ============================================================

class SourceInfo(BaseModel):
    """Info sur une source (pour le bouton 'Sources' comme PhiloGPT)."""
    document: str       # Nom du fichier (ex: "guide_vih.pdf")
    page: int | None = None  # Numéro de page (si disponible)
    excerpt: str = ""   # Extrait du passage utilisé


class SubTopic(BaseModel):
    """Un sous-thème = bouton cliquable (comme PhiloGPT).
    
    label  = texte court affiché sur le bouton (ex: "Prévention")
    prompt = question complète mise dans le champ de saisie au clic
             (ex: "Quels sont les moyens de prévention du VIH...")
    """
    label: str
    prompt: str


class ChatResponse(BaseModel):
    """La réponse complète du chatbot."""
    answer: str                          # La réponse de l'IA
    sources: list[SourceInfo] = []       # Les sources (bouton Sources)
    conversation_id: str                 # ID de la conversation
    disclaimer: str | None = None        # Avertissement médical (si applicable)
    sub_topics: list[SubTopic] = []      # Sous-thèmes (boutons cliquables)


# ============================================================
# CE QUE LE BACKEND RENVOIE POUR LES THÉMATIQUES
# ============================================================

class TopicResponse(BaseModel):
    """Une thématique avec son message d'intro et ses sous-thèmes."""
    id: str
    title: str
    icon: str = ""
    starter_message: str
    sub_topics: list[SubTopic] = []      # Boutons sous-thèmes
    related_topics: list[str] = []       # Autres thématiques liées

