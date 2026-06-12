"""
Guardrails — Filtre de sécurité du chatbot.

Le chatbot traite de SANTÉ. On ne peut pas laisser passer n'importe quoi.
Ce module vérifie chaque question en 2 étapes :

1. HORS-SCOPE : la question parle de politique, religion, armes ?
   → On refuse poliment.

2. QUESTION MÉDICALE : la question touche à la santé ?
   → On laisse passer MAIS on ajoute un disclaimer (avertissement).

Flux :
  Question → check_guardrails() → None (OK, on continue)
                                 → message de refus (STOP)
  
  Question → is_medical_question() → True (ajouter disclaimer)
                                    → False (pas de disclaimer)
"""

# Contenu dangereux bloqué avant tout appel au LLM.
# Ne pas élargir cette liste — la restriction de domaine est gérée
# par le RAG + le system prompt, pas par des mots-clés.
# "suicide" is handled separately below to allow prevention/support questions.
HARMFUL_KEYWORDS = [
    "se suicider", "se tuer",
    "arme", "fusil", "bombe", "explosif", "attentat",
    "assassiner", "tuer quelqu'un",
]

# If the question about "suicide" contains one of these words it's a prevention
# question (education context) — let it through to the RAG.
SUICIDE_PREVENTION_CONTEXT = [
    "prévention", "prévenir", "aide", "aider", "soutien",
    "signe", "signaux", "risque", "comment", "ressource",
]

RESPONSE_HARMFUL = (
    "Je suis un assistant UNICEF spécialisé dans la santé et la protection "
    "de l'enfance. Je ne peux pas répondre à cette demande. "
    "Si vous traversez une période difficile, parlez-en à un professionnel de santé."
)

# Mots-clés qui déclenchent un DISCLAIMER (avertissement médical)
MEDICAL_KEYWORDS = [
    "vih", "sida", "ist", "grossesse", "contraception", "préservatif",
    "dépistage", "symptôme", "traitement", "maladie", "infection",
    "vaccin", "vaccination", "épidémie", "choléra", "ebola",
    "paludisme", "malaria", "fièvre", "diarrhée", "tuberculose",
    "médicament", "antibiotique", "hôpital", "médecin",
]

# Le disclaimer ajouté aux réponses médicales
MEDICAL_DISCLAIMER = (
    "⚠️ Ces informations sont données à titre éducatif uniquement. "
    "Consultez un professionnel de santé pour un avis médical personnalisé."
)


def check_guardrails(question: str) -> str | None:
    """
    Bloque uniquement le contenu dangereux (armes, automutilation).
    La restriction de domaine est assurée par le RAG + le system prompt :
    si aucun document pertinent n'est trouvé, le LLM répond
    "Je n'ai pas d'information sur ce sujet."
    """
    question_lower = question.lower()

    if "suicide" in question_lower:
        in_prevention_context = any(
            ctx in question_lower for ctx in SUICIDE_PREVENTION_CONTEXT
        )
        if not in_prevention_context:
            return RESPONSE_HARMFUL

    for keyword in HARMFUL_KEYWORDS:
        if keyword in question_lower:
            return RESPONSE_HARMFUL
    return None


def is_medical_question(question: str) -> bool:
    """
    Détecte si la question touche à la santé.
    Si oui, on ajoutera le disclaimer à la réponse.
    
    Exemple :
        is_medical_question("Comment prévenir le VIH ?")  → True
        is_medical_question("Que fait l'UNICEF ?")         → False
    """
    question_lower = question.lower()
    return any(keyword in question_lower for keyword in MEDICAL_KEYWORDS)
