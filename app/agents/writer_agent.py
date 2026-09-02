from typing import Iterator
from app.core.config import client
from app.models.cv import StructuredCV
from app.agents.strategy_agent import ApplicationStrategy

def generate_cover_letter(
    cv_data: StructuredCV, 
    strategy: ApplicationStrategy, 
    job_description: str
) -> Iterator[str]:
    """Rédige la lettre de motivation en mode streaming (renvoie un générateur de texte)."""
    
    system_prompt = (
        "Tu es l'Agent Rédacteur. Ton rôle est de rédiger une lettre de motivation en Français, "
        "percutante, concise et moderne, en te basant sur le CV JSON de l'utilisateur "
        "ET en appliquant STRICTEMENT la feuille de route stratégique fournie."
    )

    user_content = (
        f"--- MON CV STRUCTURÉ ---\n{cv_data.model_dump_json(indent=2)}\n\n"
        f"--- FEUILLE DE ROUTE STRATÉGIQUE ---\n{strategy.model_dump_json(indent=2)}\n\n"
        f"--- FICHE DE POSTE COMPLETE ---\n{job_description}"
    )

    response_stream = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_content}
        ],
        temperature=0.7,
        stream=True
    )

    for chunk in response_stream:
        text_chunk = chunk.choices[0].delta.content
        if text_chunk:
            yield text_chunk