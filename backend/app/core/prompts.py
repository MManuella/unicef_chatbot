# ============================================================
# 1. SYSTEM PROMPT
# C'est l'identité de l'IA. Ce texte est envoyé AVANT chaque
# question de l'utilisateur. Le LLM le suit comme des règles.
# ============================================================

SYSTEM_PROMPT = """Tu es un assistant virtuel de l'UNICEF, spécialisé exclusivement dans les conseils 
aux populations sur les thématiques de santé, éducation et protection de l'enfance.

RÈGLES IMPORTANTES :
1. Réponds UNIQUEMENT en te basant sur les documents UNICEF fournis dans le contexte.
2. Si la question ne concerne pas la santé, l'éducation, la nutrition, ou les programmes UNICEF, réponds exactement : "Je ne peux pas répondre à cette question car je ne connais pas la réponse ."
3. Si le contexte fourni ne contient pas d'information suffisante pour répondre, réponds exactement : "Je n'ai pas d'information sur ce sujet."
4. Ne JAMAIS utiliser tes connaissances générales pour compléter une réponse hors des documents fournis.
5. Ne donne JAMAIS de diagnostic médical. Oriente toujours vers un professionnel de santé.
6. Ajoute systématiquement un avertissement pour les questions médicales sensibles.
7. Réponds en français sauf si l'utilisateur utilise une autre langue.
8. Sois bienveillant, accessible et utilise un langage simple.
9. Formate tes réponses en Markdown : écris UNE phrase d'introduction en **gras** (uniquement cette phrase, pas le reste), puis une liste numérotée pour les points (1. 2. 3.). N'utilise le gras que pour les noms de médicaments ou conditions médicales importants dans le corps de la liste. Ne mets JAMAIS en gras des phrases entières ou des explications.

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

Instructions STRICTES :
- Réponds UNIQUEMENT en te basant sur le contexte ci-dessus.
- Si le contexte ne contient pas d'information pertinente pour répondre à cette question, réponds : "Je n'ai pas d'information sur ce sujet."
- N'utilise JAMAIS tes connaissances générales pour compléter ou remplacer le contexte.
- Ne réponds pas aux questions sans rapport avec la santé, l'éducation, la nutrition ou les programmes UNICEF.
- Commence par une UNIQUE phrase d'introduction en **gras** (ex: **Pour gérer les douleurs pendant vos règles, voici quelques remèdes efficaces :**)
- Puis liste les points avec 1. 2. 3. en texte normal. Gras uniquement pour les noms de médicaments (ex: **paracétamol**).
- Sois précis, factuel et bienveillant.
"""

# ============================================================
# 3. TOPIC STARTERS (comme PhiloGPT)
# Chaque thématique a un message d'introduction que l'IA
# envoie quand l'utilisateur clique sur un sujet.
# C'est ce qui permet à l'IA de "lancer" une discussion.
# ============================================================

TOPIC_STARTERS = {
    "vih_sida": {
        "title": "VIH / SIDA",
        "starter_message": (
            "Bonjour ! Je suis là pour répondre à vos questions sur le VIH et le SIDA : "
            "transmission, prévention, dépistage et vie avec le virus. "
            "Comment puis-je vous aider ?"
        ),
        "sub_topics": [
            {
                "label": "Transmission",
                "prompt": "Comment se transmet le VIH et quels comportements permettent de s'en protéger ?",
            },
            {
                "label": "Dépistage",
                "prompt": "Comment et où peut-on se faire dépister pour le VIH ? Est-ce gratuit et confidentiel ?",
            },
            {
                "label": "Traitement",
                "prompt": "Quels sont les traitements disponibles pour les personnes vivant avec le VIH ? Comment y accéder ?",
            },
            {
                "label": "PrEP",
                "prompt": "Qu'est-ce que la PrEP et comment fonctionne-t-elle pour prévenir le VIH ?",
            },
        ],
        "related_topics": ["ist", "sante_reproductive"],
    },
    "sante_reproductive": {
        "title": "Santé reproductive",
        "starter_message": (
            "Bonjour ! Je suis là pour répondre à vos questions sur la santé reproductive : "
            "contraception, planification familiale, grossesse et droits. "
            "Que souhaitez-vous savoir ?"
        ),
        "sub_topics": [
            {
                "label": "Contraception",
                "prompt": "Quels sont les différents moyens de contraception disponibles et comment choisir celui qui me convient ?",
            },
            {
                "label": "Grossesse",
                "prompt": "Comment se déroule le suivi de grossesse et quels sont les examens importants à faire ?",
            },
            {
                "label": "Planification familiale",
                "prompt": "Qu'est-ce que la planification familiale et quels services sont disponibles près de chez moi ?",
            },
            {
                "label": "Droits reproductifs",
                "prompt": "Quels sont mes droits en matière de santé reproductive et sexuelle ?",
            },
        ],
        "related_topics": ["vih_sida", "hygiene_menstruelle"],
    },
    "hygiene_menstruelle": {
        "title": "Hygiène menstruelle",
        "starter_message": (
            "Bonjour ! Je suis là pour répondre à vos questions sur la gestion de l'hygiène menstruelle : "
            "produits, douleurs, tabous et droits des jeunes filles. "
            "Comment puis-je vous aider ?"
        ),
        "sub_topics": [
            {
                "label": "Produits hygiéniques",
                "prompt": "Quels produits peut-on utiliser pendant les règles et comment les utiliser correctement ?",
            },
            {
                "label": "Douleurs menstruelles",
                "prompt": "Comment gérer les douleurs pendant les règles ? Quels remèdes sont efficaces ?",
            },
            {
                "label": "Cycles irréguliers",
                "prompt": "Est-il normal d'avoir des cycles irréguliers et quand faut-il consulter un médecin ?",
            },
            {
                "label": "Briser les tabous",
                "prompt": "Comment parler des règles sans tabou et sensibiliser son entourage ?",
            },
        ],
        "related_topics": ["sante_reproductive", "sante_mentale"],
    },
    "sante_mentale": {
        "title": "Santé mentale",
        "starter_message": (
            "Bonjour ! Je suis là pour vous accompagner sur les questions de santé mentale : "
            "stress, anxiété, dépression et bien-être psychologique. "
            "Que souhaitez-vous savoir ?"
        ),
        "sub_topics": [
            {
                "label": "Dépression",
                "prompt": "Quels sont les signes de la dépression et comment obtenir de l'aide ?",
            },
            {
                "label": "Anxiété & stress",
                "prompt": "Comment gérer le stress et l'anxiété au quotidien ?",
            },
            {
                "label": "Soutien psychologique",
                "prompt": "Où trouver un soutien psychologique près de chez moi ?",
            },
            {
                "label": "Aider un proche",
                "prompt": "Comment aider un ami ou un proche qui souffre mentalement ?",
            },
        ],
        "related_topics": ["hygiene_menstruelle", "ist"],
    },
    "ist": {
        "title": "IST",
        "starter_message": (
            "Bonjour ! Je suis là pour répondre à vos questions sur les infections sexuellement transmissibles : "
            "types, symptômes, prévention et traitement. "
            "Comment puis-je vous aider ?"
        ),
        "sub_topics": [
            {
                "label": "Types d'IST",
                "prompt": "Quelles sont les IST les plus courantes chez les jeunes et comment les reconnaître ?",
            },
            {
                "label": "Prévention",
                "prompt": "Comment se protéger efficacement contre les IST ?",
            },
            {
                "label": "Dépistage",
                "prompt": "Peut-on avoir une IST sans le savoir ? À quelle fréquence se faire dépister ?",
            },
            {
                "label": "Traitement",
                "prompt": "Les IST peuvent-elles être guéries complètement ? Quels traitements existent ?",
            },
        ],
        "related_topics": ["vih_sida", "sante_reproductive"],
    },
    "epidemie": {
        "title": "Conseils pratiques épidémies",
        "starter_message": (
            "Bonjour ! En période d'épidémie, il est essentiel d'adopter les bons réflexes. "
            "Je suis là pour répondre à vos questions sur la prévention et la gestion des épidémies."
        ),
        "sub_topics": [
            {
                "label": "Gestes barrières",
                "prompt": "Quels sont les gestes barrières essentiels à adopter en période d'épidémie ?",
            },
            {
                "label": "Symptômes",
                "prompt": "Que faire si je présente des symptômes pendant une épidémie ? Vers qui me tourner ?",
            },
            {
                "label": "Protéger sa famille",
                "prompt": "Comment protéger sa famille et ses proches pendant une épidémie ?",
            },
            {
                "label": "Épidémie vs pandémie",
                "prompt": "Quelle est la différence entre une épidémie et une pandémie ?",
            },
        ],
        "related_topics": ["vih_sida", "ist"],
    },
}
