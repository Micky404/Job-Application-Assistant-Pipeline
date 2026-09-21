from pydantic import BaseModel, Field
from typing import List, Optional


class Identity(BaseModel):
    nom: Optional[str] = Field(default=None, description="Nom de famille du candidat")
    prenom: Optional[str] = Field(default=None, description="Prénom du candidat")
    email: Optional[str] = Field(default=None, description="Adresse e-mail")
    phone: Optional[str] = Field(default=None, description="Numéro de téléphone")
    ville: Optional[str] = Field(
        default=None,
        description="Ville ou localisation du candidat (ex: Paris, Lyon, Bordeaux)",
    )
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

    def candidate_info(self) -> dict:
        prenom = (self.identity.prenom or "").strip()
        nom = (self.identity.nom or "").strip()
        full_name = f"{prenom} {nom}".strip()
        return {
            "first_name": prenom,
            "last_name": nom,
            "full_name": full_name,
            "email": (self.identity.email or "").strip(),
            "phone": (self.identity.phone or "").strip(),
            "location": (self.identity.ville or "").strip(),
        }
