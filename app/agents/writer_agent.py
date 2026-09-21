from typing import Iterator

from app.core.config import client
from app.models.cv import StructuredCV
from app.agents.strategy_agent import ApplicationStrategy


def _candidate_fields(cv_data: StructuredCV) -> dict[str, str]:
    info = cv_data.candidate_info()
    return {
        "name": info["full_name"],
        "email": info["email"],
        "phone": info["phone"],
        "location": info["location"],
    }


def generate_cover_letter(
    cv_data: StructuredCV,
    strategy: ApplicationStrategy,
    job_description: str,
    company_name: str,
    job_title: str,
) -> Iterator[str]:
    candidate = _candidate_fields(cv_data)
    company = (company_name or "").strip()
    title = (job_title or "").strip()

    identity_lines = [
        f"- Nom du candidat : {candidate['name']}" if candidate["name"] else None,
        f"- Email : {candidate['email']}" if candidate["email"] else None,
        f"- Téléphone : {candidate['phone']}" if candidate["phone"] else None,
        f"- Ville : {candidate['location']}" if candidate["location"] else None,
        f"- Entreprise visée : {company}" if company else None,
        f"- Poste visé : {title}" if title else None,
    ]
    identity_block = "\n".join(line for line in identity_lines if line)

    signature_instruction = (
        f"6. Signature seule, sur sa propre ligne, avec le nom exact du candidat : {candidate['name']}"
        if candidate["name"]
        else "6. Signature seule, sur sa propre ligne (prénom et nom uniquement s'ils sont connus)"
    )

    system_prompt = f"""Tu rédiges uniquement le corps d'une lettre de motivation professionnelle en français.

        INTERDICTIONS STRICTES :
        - N'utilise AUCUN placeholder, crochet, chevron ou variable du type [Nom], [Entreprise], [Poste], XXX, TBD.
        - N'invente aucune information d'identité, d'entreprise ou de poste.
        - N'ajoute PAS d'en-tête : pas de coordonnées, pas d'objet, pas de date (le PDF les affiche déjà).
        - N'utilise PAS de Markdown (pas de #, **, *, listes à puces).
        - Ne coupe JAMAIS un mot avec un tiret de césure. Interdit : Im-mobilien, ac-célérer, dé-veloppeur, expé-rience.
        - N'insère aucun trait d'union en fin de ligne ni au milieu d'un mot qui n'en comporte pas naturellement.

        Informations réelles à employer dans le texte, sans les modifier :
        {identity_block or "- Aucune information complémentaire fournie."}

        MISE EN PAGE OBLIGATOIRE (séparation exacte par \\n\\n) :
        - Sépare CHAQUE bloc par exactement deux retours à la ligne (caractères \\n\\n). Pas de simple \\n entre deux paragraphes.
        - La formule d'appel est isolée seule sur sa ligne : Madame, Monsieur,
        puis immédiatement un double saut de ligne (\\n\\n).
        - Ensuite exactement 3 paragraphes de corps (accroche, expériences/compétences, adéquation au poste), chacun terminé par \\n\\n.
        - La formule de politesse finale est un paragraphe distinct, isolé, précédé et suivi de \\n\\n.
        - {signature_instruction}

        Exemple de structure (respecte les lignes vides) :
        Madame, Monsieur,

        <paragraphe 1>

        <paragraphe 2>

        <paragraphe 3>

        <formule de politesse>

        <signature>
        """

    user_content = (
        f"--- MON CV STRUCTURÉ ---\n{cv_data.model_dump_json(indent=2)}\n\n"
        f"--- FEUILLE DE ROUTE STRATÉGIQUE ---\n{strategy.model_dump_json(indent=2)}\n\n"
        f"--- FICHE DE POSTE COMPLETE ---\n{job_description}"
    )

    response_stream = client.chat.completions.create(
        model="gpt-5",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_content},
        ],
        stream=True,
    )

    for chunk in response_stream:
        text_chunk = chunk.choices[0].delta.content
        if text_chunk:
            yield text_chunk
