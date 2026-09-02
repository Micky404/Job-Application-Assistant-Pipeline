import os
from tavily import TavilyClient
from app.core.config import client
from app.models.job import CompanyAnalysis

# Initialisation du client Tavily
tavily_client = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))


def research_company_and_prep_questions(company_name: str, job_title: str) -> CompanyAnalysis:
    """Effectue une recherche en ligne via Tavily et génère une analyse + questions d'entretien."""
    
    # 1. Recherche en ligne avec Tavily
    query = f"actualités projets IA technologie {company_name}"
    search_response = tavily_client.search(query=query, search_depth="basic", max_results=4)
    
    # Extraction du contenu des résultats
    context_text = "\n\n".join([f"Source: {r['url']}\nContenu: {r['content']}" for r in search_response.get("results", [])])

    # 2. Analyse et synthèse via LLM
    system_prompt = (
        "Tu es un consultant en préparation d'entretiens d'embauche. "
        "À partir des résultats de recherche web sur une entreprise et de l'intitulé du poste, "
        "analyse l'actualité de l'entreprise et génère des questions stratégiques à poser en entretien."
    )

    user_prompt = (
        f"Entreprise: {company_name}\n"
        f"Poste: {job_title}\n\n"
        f"--- RÉSULTATS DE RECHERCHE WEB ---\n{context_text}"
    )

    response = client.beta.chat.completions.parse(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        response_format=CompanyAnalysis,
        temperature=0.3
    )

    return response.choices[0].message.parsed