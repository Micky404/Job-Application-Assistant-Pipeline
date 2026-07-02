import os
from dotenv import load_dotenv
from pypdf import PdfReader
from openai import OpenAI

# 1. Initialiser le client OpenAI
load_dotenv()
client = OpenAI()

def extract_text_from_pdf(pdf_path):
    """Extrait le texte brut de toutes les pages d'un PDF."""
    if not os.path.exists(pdf_path):
        raise FileNotFoundError(f"Le fichier {pdf_path} est introuvable.")
        
    print(f"📖 Lecture du fichier PDF : {pdf_path}...")
    reader = PdfReader(pdf_path)
    full_text = ""
    
    for page_num, page in enumerate(reader.pages):
        text = page.extract_text()
        if text:
            full_text += text + "\n"
            
    return full_text.strip()

# --- CODE PRINCIPAL ---

# Définis le chemin vers ton propre fichier PDF ici
CV_FILENAME = "/home/mickael/Documents/Job-Application-Assistant-Agent-pipeline/CV_Mickael_PRECIGOUT_.pdf" 

try:
    # Étape A : Extraction du texte brut
    raw_cv_text = extract_text_from_pdf(CV_FILENAME)
    
    if not raw_cv_text:
        print("⚠️ Le PDF semble vide ou est une image scannée (OCR nécessaire).")
        exit()
        
    print(f"✅ Texte extrait avec succès ({len(raw_cv_text)} caractères).")
    
    # Étape B : Structuration par l'IA
    print("⚡ Envoi à l'IA pour structuration au format JSON...")
    
    system_prompt = (
        "Tu es un expert en recrutement. Ton rôle est de prendre du texte brut extrait d'un CV "
        "et de le transformer en un objet JSON structuré et standardisé. "
        "Le JSON doit contenir obligatoirement les clés suivantes : "
        "'identity' (nom, prenom, email, phone, links), "
        "'summary' (court résumé du profil), "
        "'experience' (liste d'objets avec poste, entreprise, dates, description), "
        "'skills' (liste de compétences techniques et humaines) et 'education'."
    )
    
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Voici le texte brut de mon CV :\n\n{raw_cv_text}"}
        ],
        response_format={"type": "json_object"},
        temperature=0.1 # Très bas pour rester fidèle au document d'origine
    )
    
    # Étape C : Résultat
    print("\n🎯 Ton CV a été converti en données structurées JSON :")
    print(response.choices[0].message.content)

except Exception as e:
    print(f"\n❌ Une erreur est survenue : {e}")