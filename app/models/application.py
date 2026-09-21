from typing import Any, Optional

from pydantic import BaseModel, Field


class SaveApplicationRequest(BaseModel):
    id: Optional[str] = None
    company_name: str = ""
    job_title: str = ""
    job_description: str = ""
    created_at: Optional[str] = None
    cover_letter: Optional[str] = None
    company_info: Optional[dict[str, Any]] = None
    project: Optional[dict[str, Any]] = None
    motivation: Optional[dict[str, Any]] = None
    technical_qa: Optional[dict[str, Any]] = None
    candidate_info: Optional[dict[str, Any]] = Field(
        default=None,
        description="Coordonnées extraites du CV (nom, email, téléphone, ville).",
    )
