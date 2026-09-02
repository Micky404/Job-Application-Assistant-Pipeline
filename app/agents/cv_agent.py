import hashlib, json, os
from app.core.config import client
from app.models.cv import StructuredCV

CACHE_DIR = "data/cache"

def parse_and_structure_cv(raw_text: str) -> StructuredCV:
    cv_hash = hashlib.sha256(raw_text.encode('utf-8')).hexdigest()
    cache_file = os.path.join(CACHE_DIR, f"{cv_hash}.json")

    if os.path.exists(cache_file):
        with open(cache_file, 'r', encoding='utf-8') as f:
            return StructuredCV.model_validate_json(f.read())

    system_prompt = "Tu es un parseur de CV expert. Convertis le texte brut selon le schéma demandé."

    response = client.beta.chat.completions.parse(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": raw_text}
        ],
        response_format=StructuredCV,
        temperature=0.1
    )

    structured_data = response.choices[0].message.parsed
    with open(cache_file, 'w', encoding='utf-8') as f:
        f.write(structured_data.model_dump_json(indent=2))

    return structured_data