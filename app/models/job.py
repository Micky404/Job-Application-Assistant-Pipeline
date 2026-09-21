from pydantic import BaseModel, Field
from typing import List, Optional

# --- Modèle pour le Faux Projet ---
class TechnicalProject(BaseModel):
    title: str = Field(description="Titre percutant et technique du projet.")
    pitch: str = Field(description="Résumé en 2 phrases du projet et de sa valeur métier.")
    target_skill_gap: str = Field(description="La compétence clé de l'offre que ce projet vise à crédibiliser.")
    tech_stack: List[str] = Field(description="Technologies, frameworks et outils utilisés (ex: Python, FastAPI, ChromaDB, Docker).")
    key_metrics: List[str] = Field(description="3 métriques chiffrées crédibles à citer à l'oral (ex: 'Latence réduite sous 80ms').")
    talking_points: List[str] = Field(description="3 arguments techniques ou pièges résolus à raconter en entretien.")

# --- Modèle pour la Recherche Entreprise ---
class CompanyAnalysis(BaseModel):
    company_overview: str = Field(description="Résumé des activités récentes et des enjeux stratégiques de l'entreprise.")
    key_tech_focus: List[str] = Field(description="Orientations techniques ou projets IA récents identifiés.")
    interview_questions: List[str] = Field(description="4 questions pertinentes et stratégiques à poser à la fin de l'entretien.")

# --- Modèle pour le Pitch de Motivation ---
class CompanyMotivationPitch(BaseModel):
    hook_sentence: str = Field(
        description="Une phrase d'accroche percutante qui fait le lien entre tes valeurs/projets et l'entreprise."
    )
    core_arguments: List[str] = Field(
        description="3 arguments clés expliquant pourquoi tu veux travailler spécifiquement chez eux."
    )
    spoken_pitch: str = Field(
        description="Le pitch complet de 45 secondes, rédigé au style parlé, prêt à être répété à l'oral."
    )

# --- Modèle pour la préparation Q&A Technique ---
class TechnicalQAItem(BaseModel):
    question: str = Field(description="La question technique susceptible d'être posée.")
    expected_concept: str = Field(description="Le concept clé ou l'élément de cours à restituer.")
    suggested_answer: str = Field(description="Exemple de réponse concise et précise à l'oral.")
    common_pitfall: str = Field(description="Le piège classique à éviter dans la réponse.")

class TechnicalQAPrep(BaseModel):
    questions_and_answers: List[TechnicalQAItem] = Field(
        description="Liste de 5 questions/réponses techniques ciblées sur la fiche de poste."
    )


class JobOffer(BaseModel):
    company_name: str = Field(
        description="Nom exact de l'entreprise recruteuse tel qu'il apparaît dans l'offre. Si introuvable, utiliser 'Entreprise'."
    )
    job_title: str = Field(
        description="Intitulé précis du poste. Si introuvable, utiliser 'Poste visé'."
    )


class ProcessJobRequest(BaseModel):
    job_description: str
    company_name: Optional[str] = None
    job_title: Optional[str] = None
