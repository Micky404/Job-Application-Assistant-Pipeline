from app.services.pdf_parser import extract_text_from_pdf
from app.agents.cv_agent import parse_and_structure_cv
from app.agents.strategy_agent import analyze_match
from app.agents.project_agent import generate_strategic_project
from app.agents.research_agent import research_company_and_prep_questions

def run():
    # 1. Parsing CV
    raw_text = extract_text_from_pdf("data/uploads/CV_Mickael_PRECIGOUT_.pdf")
    cv_data = parse_and_structure_cv(raw_text)
    
    # Mock fiche de poste
    job_desc = "Développeur IA / RAG à la Banque de France..."
    
    # 2. Stratégie
    strategy = analyze_match(cv_data, job_desc)
    
    # 3. Génération du Faux Projet
    print("\n🛠️ [Project Agent] Génération de l'idée de projet...")
    project = generate_strategic_project(cv_data, strategy, job_desc)
    print(f"Projet proposé : {project.title}")
    print(f"Pitch : {project.pitch}")
    print(f"Métriques : {project.key_metrics}")

    # 4. Recherche Entreprise
    print("\n🌐 [Research Agent] Recherche web sur l'entreprise...")
    company_info = research_company_and_prep_questions("Banque de France", "Développeur IA")
    print(f"Aperçu : {company_info.company_overview}")
    print(f"Questions à poser : {company_info.interview_questions}")

if __name__ == "__main__":
    run()