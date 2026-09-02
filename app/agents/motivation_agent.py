from app.core.config import client
from app.models.job import CompanyAnalysis, CompanyMotivationPitch

def generate_company_motivation(
    company_name: str,
    job_description: str,
    company_info: CompanyAnalysis
) -> CompanyMotivationPitch:
    """Génère un pitch de motivation fluide pour répondre à 'Pourquoi notre entreprise ?'."""
    
    system_prompt = (
        "Tu es un coach en préparation d'entretien d'embauche. "
        "Ton but est de structurer une réponse orale naturelle, crédible et passionnée "
        "à la question classique : 'Pourquoi souhaitez-vous rejoindre notre entreprise ?'. "
        "Évite la langue de bois et appuie-toi sur les actualités réelles de l'entreprise."
    )

    user_prompt = (
        f"Entreprise: {company_name}\n\n"
        f"--- FICHE DE POSTE ---\n{job_description}\n\n"
        f"--- INFOS & ACTUS ENTREPRISE ---\n{company_info.company_overview}\n"
        f"Projets IA clés : {company_info.key_tech_focus}"
    )

    response = client.beta.chat.completions.parse(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        response_format=CompanyMotivationPitch
    )

    return response.choices[0].message.parsed