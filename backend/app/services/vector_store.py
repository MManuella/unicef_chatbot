"""
Vector Store Service — Qdrant + Embeddings.

C'est le moteur de recherche du chatbot. Mais au lieu de chercher
par mots-clés (comme Google), il cherche par SENS.

Comment ça marche :
1. Les documents UNICEF sont découpés en morceaux (chunks)
2. Chaque chunk est transformé en VECTEUR (liste de 1024 nombres)
   par le modèle multilingual-e5-large
3. Les vecteurs sont stockés dans Qdrant
4. Quand l'utilisateur pose une question :
   a. La question est aussi transformée en vecteur
   b. Qdrant compare ce vecteur avec tous les vecteurs stockés
   c. Il retourne les 5 chunks les plus SIMILAIRES par le sens

Exemple :
  Question : "Comment se protéger du VIH ?"
  → Qdrant retourne les morceaux de documents qui parlent de prévention VIH
  → Même si les mots exacts ne sont pas les mêmes !
    (ex: un document qui dit "moyens de prévention contre le virus" sera trouvé)
"""

from langchain_huggingface import HuggingFaceEmbeddings
from langchain_qdrant import QdrantVectorStore
from qdrant_client import QdrantClient
from app.core.config import settings


class VectorStoreService:
    def __init__(self):
        # Le modèle d'embedding : transforme du texte en vecteurs
        # multilingual-e5-large comprend le FRANÇAIS (contrairement
        # aux modèles anglais-only qui sont mauvais pour le RAG en français)
        #self.embeddings = HuggingFaceEmbeddings(
            #model_name=settings.EMBEDDING_MODEL,  # intfloat/multilingual-e5-large
            #model_kwargs={"device": "cpu"},         # CPU suffit pour les embeddings
        #)

        # vector_store.py
        self.embeddings = HuggingFaceEmbeddings(
            model_name=settings.EMBEDDING_MODEL,
            model_kwargs={"device": "cpu"},
            encode_kwargs={
                "batch_size": 32,       # traite les chunks par lots
                "normalize_embeddings": True,
            },
        )
        self.embeddings.embed_query("init") 


        # Connexion à Qdrant : mode fichier local (HF Spaces) ou serveur distant (dev)
        if settings.QDRANT_LOCAL_PATH:
            self.client = QdrantClient(path=settings.QDRANT_LOCAL_PATH)
        else:
            self.client = QdrantClient(
                host=settings.QDRANT_HOST,
                port=settings.QDRANT_PORT,
            )

        # L'interface LangChain pour parler à Qdrant
        self.vector_store = QdrantVectorStore(
            client=self.client,
            collection_name=settings.QDRANT_COLLECTION,  # "unicef_documents"
            embedding=self.embeddings,
        )

    async def similarity_search(self, query: str, k: int = None):
        """
        Cherche les documents les plus similaires à la question.
        
        Paramètres :
        - query : la question de l'utilisateur
        - k : nombre de résultats (défaut: 5)
        
        Retourne : liste de Documents (texte + métadonnées)
        
        Exemple :
            docs = await vector_store.similarity_search("prévention VIH")
            # docs[0].page_content = "Les moyens de prévention du VIH..."
            # docs[0].metadata = {"source": "guide_vih.pdf", "page": 12}
        """
        k = k or settings.TOP_K_RESULTS
        return await self.vector_store.asimilarity_search(query, k=k)
