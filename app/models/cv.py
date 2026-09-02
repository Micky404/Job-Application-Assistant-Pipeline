from pydantic import BaseModel
from typing import List, Optional

class Identity(BaseModel):
    nom: Optional[str] = None
    prenom: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    links: List[str] = []

class Experience(BaseModel):
    poste: str
    entreprise: str
    dates: str
    description: str

class StructuredCV(BaseModel):
    identity: Identity
    summary: str
    experience: List[Experience]
    skills: List[str]
    education: List[str]