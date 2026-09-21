from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import json
import shutil
import os

from app.services.pdf_parser import extract_text_from_pdf
from app.services.application_store import (
    save_application,
    list_applications,
    get_application,
    delete_application,
)
from app.models.application import SaveApplicationRequest
from app.models.job import ProcessJobRequest
from app.agents.cv_agent import parse_and_structure_cv
from app.agents.job_parser_agent import resolve_job_offer
from app.agents.strategy_agent import analyze_match
from app.agents.writer_agent import generate_cover_letter
from app.agents.project_agent import generate_strategic_project
from app.agents.research_agent import research_company_and_prep_questions
from app.agents.motivation_agent import generate_company_motivation
from app.agents.technical_qa_agent import generate_technical_qa

app = FastAPI(title="Job Application Assistant API")

# Configuration CORS pour autoriser ton futur frontend (React/Next.js)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3010",
        "http://127.0.0.1:3010",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "data/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs("data/applications", exist_ok=True)

# --- ROUTES API ---

@app.post("/api/parse-cv")
async def upload_and_parse_cv(file: UploadFile = File(...)):
    """Reçoit un fichier PDF de CV, le sauvegarde et le structure."""
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Le fichier doit être un PDF.")

    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    raw_text = extract_text_from_pdf(file_path)
    cv_data = parse_and_structure_cv(raw_text)
    return {
        "status": "success",
        "cv_data": cv_data,
        "candidate_info": cv_data.candidate_info(),
    }


@app.post("/api/analyze-application")
async def analyze_application(payload: ProcessJobRequest, cv_file_name: str):
    """Exécute l'analyse croisée : Stratégie, Recherche, Projet, Motivation et Q&A."""
    file_path = os.path.join(UPLOAD_DIR, cv_file_name)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="CV non trouvé.")

    offer = resolve_job_offer(payload)

    raw_text = extract_text_from_pdf(file_path)
    cv_data = parse_and_structure_cv(raw_text)

    # Exécution des agents
    strategy = analyze_match(cv_data, payload.job_description)
    company_info = research_company_and_prep_questions(offer.company_name, offer.job_title)
    project = generate_strategic_project(cv_data, strategy, payload.job_description)
    motivation = generate_company_motivation(offer.company_name, payload.job_description, company_info)
    technical_qa = generate_technical_qa(payload.job_description)

    return {
        "strategy": strategy,
        "company_info": company_info,
        "project": project,
        "motivation": motivation,
        "technical_qa": technical_qa,
        "candidate_info": cv_data.candidate_info(),
        "company_name": offer.company_name,
        "job_title": offer.job_title,
        "job_offer": offer,
    }


@app.post("/api/generate-cover-letter-stream")
async def stream_cover_letter(payload: ProcessJobRequest, cv_file_name: str):
    file_path = os.path.join(UPLOAD_DIR, cv_file_name)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="CV non trouvé.")

    offer = resolve_job_offer(payload)

    raw_text = extract_text_from_pdf(file_path)
    cv_data = parse_and_structure_cv(raw_text)
    strategy = analyze_match(cv_data, payload.job_description)

    def event_generator():
        # JSON-encode every SSE payload so native `\n` / `\n\n` in LLM chunks
        # cannot be interpreted as the SSE event delimiter (`data: ...\n\n`).
        yield f"data: {json.dumps({'meta': offer.model_dump()}, ensure_ascii=False)}\n\n"
        for chunk in generate_cover_letter(
            cv_data,
            strategy,
            payload.job_description,
            offer.company_name,
            offer.job_title,
        ):
            payload_json = json.dumps({"content": chunk}, ensure_ascii=False)
            yield f"data: {payload_json}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@app.post("/api/applications/save")
async def save_job_application(payload: SaveApplicationRequest):
    """Crée ou met à jour une candidature et renvoie l'objet complet avec son id."""
    record = save_application(payload.model_dump())
    return {"status": "success", **record}


@app.get("/api/applications")
async def list_job_applications():
    """Renvoie la liste des candidatures enregistrées, de la plus récente à la plus ancienne."""
    return {"status": "success", "applications": list_applications()}


@app.get("/api/applications/{application_id}")
async def get_job_application(application_id: str):
    """Renvoie le détail complet d'une candidature."""
    record = get_application(application_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Candidature introuvable.")
    return {"status": "success", **record}


@app.delete("/api/applications/{application_id}")
async def delete_job_application(application_id: str):
    """Supprime le fichier JSON d'une candidature dans data/applications/."""
    deleted = delete_application(application_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Candidature introuvable.")
    return {"success": True, "id": application_id}
