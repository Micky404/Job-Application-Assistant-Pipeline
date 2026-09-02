from app.core.config import client
from app.models.job import TechnicalQAPrep

def generate_technical_qa(job_description: str) -> TechnicalQAPrep:
    """Génère un jeu de cartes de révision Q&A sur les compétences techniques de la fiche de poste."""
    
    system_prompt = (
        "Tu es un Lead Tech / Senior Engineer qui fait passer des entretiens techniques. "
        "Identifie les technos et concepts clés de la fiche de poste et génère 5 questions techniques "
        "incontournables, avec leurs réponses synthétiques et les pièges classiques à éviter."
    )

    user_prompt = f"--- FICHE DE POSTE ---\n{job_description}"

    response = client.beta.chat.completions.parse(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        response_format=TechnicalQAPrep
    )

    return response.choices[0].message.parsed