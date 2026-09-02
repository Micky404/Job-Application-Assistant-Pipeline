import json
from pydantic import BaseModel, Field
from typing import List
from app.core.config import client
from app.models.cv import StructuredCV

# Schéma de sortie pour garantir la structure de la feuille de route
class ApplicationStrategy(BaseModel):
    key_points_to_highlight: List[str] = Field(
        description="Les expériences et compétences du CV qui matchent le plus avec le poste."
    )
    missing_skills_to_address: List[str] = Field(
        description="Comment aborder ou valoriser les compétences demandées moins maîtrisées."
    )
    recommended_tone: str = Field(
        description="Le ton à adopter (ex: corporate, technique, dynamique, etc.)."
    )

def analyze_match(cv_data: StructuredCV, job_description: str) -> ApplicationStrategy:
    """Analyse l'adéquation entre le CV structuré et la fiche de poste."""
    system_prompt = (
        "Tu es un recruteur stratégique. Tu compares le CV de l'utilisateur (au format JSON) "
        "avec la description du poste. Tu dois générer une feuille de route pour l'agent rédacteur."
    )
    
    # Conversion de l'objet Pydantic CV en JSON pour le prompt
    cv_json_str = cv_data.model_dump_json(indent=2)
    user_prompt = f"--- CV JSON ---\n{cv_json_str}\n\n--- FICHE DE POSTE ---\n{job_description}"

    response = client.beta.chat.completions.parse(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        response_format=ApplicationStrategy,
        temperature=0.3
    )

    return response.choices[0].message.parsed