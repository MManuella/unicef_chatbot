"""
Script d'ingestion — Indexation des documents UNICEF dans Qdrant.

Ce script est exécuté UNE SEULE FOIS (ou à chaque ajout de nouveaux documents).
Il ne fait pas partie de l'API, c'est un script à lancer manuellement.

Ce qu'il fait, étape par étape :
1. CHARGER   : Lire tous les fichiers PDF/TXT/DOCX du dossier data/documents/
2. DÉCOUPER  : Couper chaque document en petits morceaux (chunks) de 512 tokens
3. EMBEDDER  : Transformer chaque chunk en vecteur (1024 nombres)
4. STOCKER   : Enregistrer les vecteurs dans Qdrant

Pourquoi découper en chunks ?
- Un PDF de 50 pages ne rentre pas dans le contexte du LLM
- On ne veut pas envoyer tout le document, juste les passages pertinents
- Les petits chunks permettent une recherche plus précise

Lancer le script :
    cd backend
    python -m app.ingestion.ingest
"""

import os
from langchain_community.document_loaders import (
    PyPDFLoader,
    TextLoader,
    Docx2txtLoader,
)
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_qdrant import QdrantVectorStore
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams

from app.core.config import settings

# Dossier contenant les documents UNICEF
DOCUMENTS_DIR = os.path.join(
    os.path.dirname(__file__), "..", "..", "data", "documents"
)

# Quel loader utiliser selon le type de fichier
LOADER_MAP = {
    ".pdf": PyPDFLoader,    # Fichiers PDF
    ".txt": TextLoader,      # Fichiers texte
    ".docx": Docx2txtLoader, # Fichiers Word
}


def load_documents(directory: str):
    """
    Étape 1 : CHARGER les documents.
    
    Parcourt le dossier, détecte le type de chaque fichier,
    et utilise le bon loader pour le lire.
    """
    documents = []
    abs_dir = os.path.abspath(directory)

    if not os.path.exists(abs_dir):
        print(f"  ERREUR : Le dossier {abs_dir} n'existe pas !")
        return documents

    for filename in os.listdir(abs_dir):
        ext = os.path.splitext(filename)[1].lower()
        loader_cls = LOADER_MAP.get(ext)

        if loader_cls:
            filepath = os.path.join(abs_dir, filename)
            loader = loader_cls(filepath)
            docs = loader.load()

            # Ajouter le nom du fichier dans les métadonnées
            # (pour le bouton "Sources" dans le frontend)
            for doc in docs:
                doc.metadata["source"] = filename

            documents.extend(docs)
            print(f"   Chargé : {filename} ({len(docs)} pages/sections)")
        elif filename != ".gitkeep":
            print(f"   Ignoré : {filename} (format non supporté)")

    return documents


def chunk_documents(documents):
    """
    Étape 2 : DÉCOUPER en chunks.
    
    On utilise RecursiveCharacterTextSplitter qui essaie de couper :
    1. D'abord aux doubles sauts de ligne (entre paragraphes)
    2. Puis aux sauts de ligne simples
    3. Puis aux phrases (". ")
    4. Puis aux espaces
    5. En dernier recours, au milieu d'un mot
    
    chunk_size = 512 tokens → taille de chaque morceau
    chunk_overlap = 50 tokens → chevauchement entre morceaux
    (pour ne pas couper une idée en plein milieu)
    """
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=settings.CHUNK_SIZE,       # 512
        chunk_overlap=settings.CHUNK_OVERLAP,  # 50
        separators=["\n\n", "\n", ". ", " ", ""],
    )
    chunks = splitter.split_documents(documents)
    print(f"  Total : {len(chunks)} chunks créés")
    return chunks


def ingest():
    """Pipeline d'ingestion complet."""
    print("=" * 50)
    print("  INGESTION DES DOCUMENTS UNICEF")
    print("=" * 50)

    # ── Étape 1 : Charger ──
    print("\n Étape 1 : Chargement des documents...")
    documents = load_documents(DOCUMENTS_DIR)
    if not documents:
        print("\n   Aucun document trouvé !")
        print(f"  Placez vos fichiers PDF/TXT/DOCX dans :")
        print(f"  {os.path.abspath(DOCUMENTS_DIR)}")
        return

    # ── Étape 2 : Découper ──
    print("\n Étape 2 : Découpage en chunks...")
    chunks = chunk_documents(documents)

    # ── Étape 3 : Embeddings + Stockage ──
    print("\n Étape 3 : Création des embeddings...")
    print(f"  Modèle : {settings.EMBEDDING_MODEL}")
    print("  (le premier lancement télécharge le modèle, ~2 Go)")

    embeddings = HuggingFaceEmbeddings(
        model_name=settings.EMBEDDING_MODEL,
        model_kwargs={"device": "cpu"},
    )

    # ── Étape 4 : Stocker dans Qdrant ──
    print("\n Étape 4 : Stockage dans Qdrant...")

    # Mode fichier local (QDRANT_LOCAL_PATH défini) ou serveur distant
    if settings.QDRANT_LOCAL_PATH:
        print(f"  Mode local : {settings.QDRANT_LOCAL_PATH}")
        client = QdrantClient(path=settings.QDRANT_LOCAL_PATH)
    else:
        print(f"  Mode serveur : {settings.QDRANT_HOST}:{settings.QDRANT_PORT}")
        client = QdrantClient(host=settings.QDRANT_HOST, port=settings.QDRANT_PORT)

    # recreate_collection() supprimé depuis qdrant-client 1.7.0
    # → supprimer si elle existe, puis créer
    existing = [c.name for c in client.get_collections().collections]
    if settings.QDRANT_COLLECTION in existing:
        client.delete_collection(settings.QDRANT_COLLECTION)

    client.create_collection(
        collection_name=settings.QDRANT_COLLECTION,
        vectors_config=VectorParams(
            size=384,              # Dimension de multilingual-e5-small
            distance=Distance.COSINE,
        ),
    )

    if settings.QDRANT_LOCAL_PATH:
        # Mode local : utiliser le client directement
        QdrantVectorStore.from_documents(
            documents=chunks,
            embedding=embeddings,
            collection_name=settings.QDRANT_COLLECTION,
            client=client,
        )
    else:
        QdrantVectorStore.from_documents(
            documents=chunks,
            embedding=embeddings,
            collection_name=settings.QDRANT_COLLECTION,
            url=f"http://{settings.QDRANT_HOST}:{settings.QDRANT_PORT}",
        )

    print("\n" + "=" * 50)
    print(f"   INGESTION TERMINÉE")
    print(f"  {len(documents)} documents → {len(chunks)} chunks indexés")
    print(f"  Collection : {settings.QDRANT_COLLECTION}")
    print("=" * 50)


if __name__ == "__main__":
    ingest()
