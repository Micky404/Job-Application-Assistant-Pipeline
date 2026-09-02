from pydantic import BaseModel, Field
from typing import List

# --- Modèle pour le Faux Projet ---
class TechnicalProject(BaseModel):
    title: str = Field(description="Titre percutant et technique du projet.")
    pitch: str = Field(description="Résumé en 2 phrases du projet et de sa valeur métinement.")
    target_skill_gap: str = Field(description="La compétence clé de l'offre que ce projet vise à crédibiliser.")
    tech_stack: List[str] = Field(description="Technologies, frameworks et outils utilisés (ex: Python, FastAPI, ChromaDB, Docker).")
    key_metrics: List[str] = Field(description="3 métriques chiffrées crédibles à citer à l'oral (ex: 'Latence réduite sous 80ms').")
    talking_points: List[str] = Field(description="3 arguments techniques ou pièges résolus à raconter en entretien.")

# --- Modèle pour la Recherche Entreprise ---
class CompanyAnalysis(BaseModel):
    company_overview: str = Field(description="Résumé des activités récentes et des enjeux stratégiques de l'entreprise.")
    key_tech_focus: List[str] = Field(description="Orientations techniques ou projets IA récents identifiés.")
    interview_questions: List[str] = Field(description="4 questions pertinentes et stratégiques à poser à la fin de l'entretien.")