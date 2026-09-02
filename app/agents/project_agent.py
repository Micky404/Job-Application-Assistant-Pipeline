from app.core.config import client
from app.models.cv import StructuredCV
from app.models.job import TechnicalProject
from app.agents.strategy_agent import ApplicationStrategy

def generate_strategic_project(
    cv_data: StructuredCV,
    strategy: ApplicationStrategy,
    job_description: str
) -> TechnicalProject:
    """Génère une idée de projet perso technique pour combler les compétences manquantes."""
    
    system_prompt = (
        "Tu es un Lead Tech et Architecte Software. Ton rôle est de concevoir une idée de projet "
        "personnel ultra-crédible et réaliste pour un candidat. Ce projet doit cibler en priorité "
        "les compétences manquantes identifiées dans la stratégie pour rassurer le recruteur."
    )

    user_prompt = (
        f"--- COMPETENCES A COMBLE ---\n{strategy.missing_skills_to_address}\n\n"
        f"--- FICHE DE POSTE ---\n{job_description}\n\n"
        f"--- COMPÉTENCES DU CV ---\n{cv_data.skills}"
    )

    response = client.beta.chat.completions.parse(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        response_format=TechnicalProject,
        temperature=0.4
    )

    return response.choices[0].message.parsed