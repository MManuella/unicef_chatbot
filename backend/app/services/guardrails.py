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

# Mots-clés qui déclenchent un REFUS (question hors-scope)
OUT_OF_SCOPE_KEYWORDS = [
    "politique", "élection", "parti", "président", "vote",
    "religion", "dieu", "église", "mosquée", "prière",
    "arme", "fusil", "bombe", "explosif",
    "drogue", "cannabis", "cocaïne",
    "suicide",
]

# Message de refus poli
RESPONSE_OUT_OF_SCOPE = (
    "Je suis un assistant UNICEF spécialisé dans la santé, l'hygiène et "
    "les programmes UNICEF. Je ne suis pas en mesure de répondre à cette "
    "question. Puis-je vous aider sur un autre sujet ?"
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
    Vérifie si la question est autorisée.
    
    Retourne :
    - None → la question est OK, on peut continuer
    - str  → message de refus, on s'arrête là
    
    Exemple :
        check_guardrails("Comment prévenir le VIH ?")    → None (OK)
        check_guardrails("Quel parti politique choisir ?") → message de refus
    """
    question_lower = question.lower()

    for keyword in OUT_OF_SCOPE_KEYWORDS:
        if keyword in question_lower:
            return RESPONSE_OUT_OF_SCOPE

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
