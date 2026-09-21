import hashlib
import os

from app.core.config import client
from app.models.job import JobOffer, ProcessJobRequest

CACHE_DIR = "data/cache"
FALLBACK_COMPANY = "Entreprise"
FALLBACK_TITLE = "Poste visé"


def parse_job_offer(job_description: str) -> JobOffer:
    """Extrait le nom de l'entreprise et l'intitulé du poste depuis la fiche de poste."""
    os.makedirs(CACHE_DIR, exist_ok=True)
    offer_hash = hashlib.sha256(job_description.encode("utf-8")).hexdigest()
    cache_file = os.path.join(CACHE_DIR, f"job_offer_{offer_hash}.json")

    if os.path.exists(cache_file):
        with open(cache_file, encoding="utf-8") as handle:
            return _with_fallbacks(JobOffer.model_validate_json(handle.read()))

    system_prompt = (
        "Tu es un parseur d'offres d'emploi. Extrais uniquement le nom exact de "
        "l'entreprise recruteuse et l'intitulé précis du poste. "
        "N'invente rien. Si une information est absente, utilise les valeurs "
        f"de repli '{FALLBACK_COMPANY}' et '{FALLBACK_TITLE}'."
    )

    response = client.beta.chat.completions.parse(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": job_description},
        ],
        response_format=JobOffer,
        temperature=0.1,
    )

    structured = response.choices[0].message.parsed
    if structured is None:
        structured = JobOffer(company_name=FALLBACK_COMPANY, job_title=FALLBACK_TITLE)
    else:
        structured = _with_fallbacks(structured)

    with open(cache_file, "w", encoding="utf-8") as handle:
        handle.write(structured.model_dump_json(indent=2))

    return structured


def resolve_job_offer(payload: ProcessJobRequest) -> JobOffer:
    """Priorise d'éventuelles valeurs fournies, sinon parse la fiche de poste."""
    parsed = parse_job_offer(payload.job_description)
    company_name = (payload.company_name or "").strip() or parsed.company_name
    job_title = (payload.job_title or "").strip() or parsed.job_title
    return _with_fallbacks(
        JobOffer(company_name=company_name, job_title=job_title)
    )


def _with_fallbacks(offer: JobOffer) -> JobOffer:
    return JobOffer(
        company_name=(offer.company_name or "").strip() or FALLBACK_COMPANY,
        job_title=(offer.job_title or "").strip() or FALLBACK_TITLE,
    )
