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

# Mots-clés qui déclenchent un REFUS immédiat (contenu interdit)
OUT_OF_SCOPE_KEYWORDS = [
    "politique", "élection", "parti", "président", "vote",
    "religion", "dieu", "église", "mosquée", "prière",
    "arme", "fusil", "bombe", "explosif",
    "drogue", "cannabis", "cocaïne",
    "suicide",
    # Cuisine / gastronomie
    "recette", "cuisiner", "vin", "bière", "alcool", "cocktail",
    "restaurant", "gastronomie",
    # Animaux / agriculture hors-santé
    "élever des", "élevage de", "mouche", "insecte",
    "jardinage", "agriculture", "plante",
    # Technologie / autres domaines
    "programmation", "code informatique", "javascript", "python",
    "cinéma", "film", "musique", "sport",
]

# Mots-clés du domaine autorisé (santé, UNICEF, éducation, nutrition)
IN_SCOPE_KEYWORDS = [
    # Santé générale
    "santé", "maladie", "symptôme", "traitement", "médicament",
    "médecin", "hôpital", "clinique", "infirmier",
    # Maladies spécifiques
    "vih", "sida", "ist", "paludisme", "malaria", "tuberculose",
    "choléra", "ebola", "dengue", "covid", "grippe", "diarrhée",
    "fièvre", "infection", "épidémie", "vaccin", "vaccination",
    # Reproduction / maternité
    "grossesse", "accouchement", "allaitement", "contraception",
    "préservatif", "dépistage", "avortement", "menstruation",
    "règles", "fertilité",
    # Nutrition
    "nutrition", "malnutrition", "alimentation", "aliment",
    "eau potable", "hydratation", "carence",
    # Enfance / protection
    "enfant", "enfance", "nourrisson", "bébé", "adolescent",
    "violence", "abus", "protection", "école", "éducation",
    "scolarisation",
    # UNICEF / programmes
    "unicef", "humanitaire", "aide", "programme",
    "hygiène", "assainissement", "eau",
]

# Message de refus poli
RESPONSE_OUT_OF_SCOPE = (
    "Je suis un assistant UNICEF spécialisé dans la santé, l'éducation et "
    "la protection de l'enfance. Je ne suis pas en mesure de répondre à cette "
    "question. Puis-je vous aider sur un sujet de santé, de nutrition ou "
    "des programmes UNICEF ?"
)

RESPONSE_NOT_IN_SCOPE = (
    "Je ne peux pas répondre à cette question car je ne connais pas la réponse."
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

    Logique en 2 couches :
    1. Blacklist : mots explicitement interdits → refus immédiat
    2. Whitelist : si aucun mot du domaine autorisé n'est présent → refus
    """
    question_lower = question.lower()

    # Couche 1 : blacklist — mots interdits
    for keyword in OUT_OF_SCOPE_KEYWORDS:
        if keyword in question_lower:
            return RESPONSE_OUT_OF_SCOPE

    # Couche 2 : whitelist — la question doit toucher au domaine santé/UNICEF
    if not any(keyword in question_lower for keyword in IN_SCOPE_KEYWORDS):
        return RESPONSE_NOT_IN_SCOPE

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
