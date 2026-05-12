# ============================================================
# 1. SYSTEM PROMPT
# C'est l'identité de l'IA. Ce texte est envoyé AVANT chaque
# question de l'utilisateur. Le LLM le suit comme des règles.
# ============================================================

SYSTEM_PROMPT = """Tu es un assistant virtuel de l'UNICEF, spécialisé dans les conseils 
aux populations sur les thématiques de santé, éducation et protection de l'enfance.

RÈGLES IMPORTANTES :
1. Base tes réponses principalement sur les documents fournis dans le contexte.
2. Si le contexte ne couvre pas entièrement la question, complète avec tes connaissances générales fiables sur la santé publique, tout en restant précis et factuel.
3. Ne donne JAMAIS de diagnostic médical. Oriente toujours vers un professionnel de santé.
4. Ajoute systématiquement un avertissement pour les questions médicales sensibles.
5. Réponds en français sauf si l'utilisateur utilise une autre langue.
6. Sois bienveillant, accessible et utilise un langage simple.
7. N'utilise JAMAIS de formatage Markdown : pas de **, pas de *, pas de #, pas de listes avec - ou *. Écris en texte brut uniquement, avec des phrases complètes.

AVERTISSEMENT À INCLURE POUR LES QUESTIONS MÉDICALES :
"Ces informations sont données à titre éducatif uniquement. Consultez un professionnel de santé pour un avis médical personnalisé."
"""


# ============================================================
# 2. RAG PROMPT TEMPLATE
# Ce template est rempli à chaque question. On y injecte :
# - {context} : les morceaux de documents trouvés dans Qdrant
# - {question} : la question de l'utilisateur
# ============================================================


# ============================================================
RAG_PROMPT_TEMPLATE = """Contexte issu des documents UNICEF :
{context}

Question de l'utilisateur : {question}

Instructions :
- Utilise le contexte ci-dessus en priorité pour répondre.
- Si le contexte ne couvre pas entièrement la question, complète avec tes connaissances générales fiables sur la santé publique et l'éducation.
- Ne dis PAS "le contexte ne contient pas cette information" si tu connais la réponse par tes connaissances générales.
- Réponds en texte brut, sans aucun formatage Markdown (pas de **, pas de *, pas de #).
- Sois précis, factuel et bienveillant.
"""

# ============================================================
# 3. TOPIC STARTERS (comme PhiloGPT)

# ============================================================
# 3. TOPIC STARTERS (comme PhiloGPT)
# Chaque thématique a un message d'introduction que l'IA
# envoie quand l'utilisateur clique sur un sujet.
# C'est ce qui permet à l'IA de "lancer" une discussion.
# ============================================================

TOPIC_STARTERS = {
    "sante_reproductive": {
        "title": "Santé Reproductive",
        "starter_message": (
            "Bonjour ! Je suis là pour répondre à vos questions sur "
            "la santé reproductive. Que souhaitez-vous savoir sur la "
            "planification familiale, la grossesse, ou les soins prénataux ?"
        ),
        # Niveau 2 : Sous-thèmes (boutons qui apparaissent après le clic)
        # Chaque sous-thème a un label court (bouton) + un prompt complet
        "sub_topics": [
            {
                "label": "Contraception",       # ← texte affiché sur le bouton
                "prompt": (                      # ← question mise dans le champ de saisie
                    "Quels sont les différents moyens de contraception "
                    "disponibles et comment choisir celui qui me convient ?"
                ),
            },
            {
                "label": "Grossesse",
                "prompt": (
                    "Comment se déroule le suivi de grossesse et quels "
                    "sont les examens importants à faire ?"
                ),
            },
            {
                "label": "Soins prénataux",
                "prompt": (
                    "Quels sont les soins prénataux essentiels pour "
                    "assurer la santé de la mère et du bébé ?"
                ),
            },
        ],
        # Thématiques liées (pour suggérer d'autres discussions)
        "related_topics": ["vih_ist", "hygiene"],
    },
    "vih_ist": {
        "title": "VIH / IST",
        "starter_message": (
            "Bonjour ! Parlons de la prévention et du dépistage du VIH "
            "et des infections sexuellement transmissibles. "
            "Comment puis-je vous aider ?"
        ),
        "sub_topics": [
            {
                "label": "Prévention",
                "prompt": (
                    "Quels sont les moyens de prévention du VIH et des IST "
                    "et comment les utiliser au quotidien ?"
                ),
            },
            {
                "label": "Dépistage",
                "prompt": (
                    "Comment et où peut-on se faire dépister pour le VIH "
                    "et les IST ? Est-ce gratuit et confidentiel ?"
                ),
            },
            {
                "label": "Traitement",
                "prompt": (
                    "Quels sont les traitements disponibles pour les personnes "
                    "vivant avec le VIH ? Comment y accéder ?"
                ),
            },
        ],
        "related_topics": ["sante_reproductive", "epidemie"],
    },
    "epidemie": {
        "title": "Conseils Épidémie",
        "starter_message": (
            "Bonjour ! En période d'épidémie, il est essentiel d'adopter "
            "les bons réflexes. Quelle est votre question sur les mesures "
            "de prévention ?"
        ),
        "sub_topics": [
            {
                "label": "Gestes barrières",
                "prompt": (
                    "Quels sont les gestes barrières essentiels à adopter "
                    "en période d'épidémie pour se protéger et protéger les autres ?"
                ),
            },
            {
                "label": "Protéger les enfants",
                "prompt": (
                    "Comment protéger les enfants pendant une épidémie ? "
                    "Quelles précautions spécifiques prendre pour eux ?"
                ),
            },
            {
                "label": "Symptômes",
                "prompt": (
                    "Que faire si je présente des symptômes pendant une "
                    "épidémie ? Vers qui me tourner et comment réagir ?"
                ),
            },
        ],
        "related_topics": ["hygiene", "vih_ist"],
    },
    "activites_unicef": {
        "title": "Activités UNICEF",
        "starter_message": (
            "Bonjour ! Souhaitez-vous en savoir plus sur les programmes "
            "et activités de l'UNICEF ? Je suis là pour vous informer."
        ),
        "sub_topics": [
            {
                "label": "Programmes",
                "prompt": (
                    "Quels sont les principaux programmes que l'UNICEF "
                    "mène actuellement dans ma région ?"
                ),
            },
            {
                "label": "Aide aux enfants",
                "prompt": (
                    "Comment l'UNICEF aide-t-elle concrètement les enfants "
                    "en matière de santé, d'éducation et de protection ?"
                ),
            },
            {
                "label": "Participer",
                "prompt": (
                    "Comment puis-je participer aux actions de l'UNICEF "
                    "ou contribuer en tant que bénévole ?"
                ),
            },
        ],
        "related_topics": ["epidemie", "hygiene"],
    },
    "hygiene": {
        "title": "Hygiène & Assainissement",
        "starter_message": (
            "Bonjour ! L'hygiène est essentielle pour prévenir les maladies. "
            "Que souhaitez-vous savoir sur les bonnes pratiques d'hygiène ?"
        ),
        "sub_topics": [
            {
                "label": "Lavage des mains",
                "prompt": (
                    "Comment bien se laver les mains ? Quand et pourquoi "
                    "est-ce si important pour la santé ?"
                ),
            },
            {
                "label": "Eau potable",
                "prompt": (
                    "Comment purifier l'eau de boisson à la maison ? "
                    "Quelles méthodes sont les plus efficaces et accessibles ?"
                ),
            },
            {
                "label": "Hygiène alimentaire",
                "prompt": (
                    "Quelles sont les règles d'hygiène alimentaire essentielles "
                    "pour éviter les maladies d'origine alimentaire ?"
                ),
            },
        ],
        "related_topics": ["epidemie", "sante_reproductive"],
    },
}
