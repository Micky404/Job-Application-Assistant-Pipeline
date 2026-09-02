from app.services.pdf_parser import extract_text_from_pdf
from app.agents.cv_agent import parse_and_structure_cv
from app.agents.research_agent import research_company_and_prep_questions
from app.agents.motivation_agent import generate_company_motivation
from app.agents.technical_qa_agent import generate_technical_qa

def run():
    # ... Tes étapes précédentes (Parsing, Research...)
    company_name = "Banque de France"
    job_desc = "Développeur IA / Architecte RAG..."
    
    # 1. Recherche entreprise
    company_info = research_company_and_prep_questions(company_name, "Développeur IA")

    # 2. Agent Motivation
    print("\n🗣️ [Motivation Agent] Génération du pitch 'Pourquoi cette entreprise'...")
    motivation = generate_company_motivation(company_name, job_desc, company_info)
    print(f"Pitch à l'oral : {motivation.spoken_pitch}")

    # 3. Agent Q&A Technique
    print("\n🧪 [Technical QA Agent] Génération des questions techniques...")
    qa_prep = generate_technical_qa(job_desc)
    for idx, item in enumerate(qa_prep.questions_and_answers, 1):
        print(f"\nQ{idx}: {item.question}")
        print(f"👉 Réponse : {item.suggested_answer}")
        print(f"⚠️ Piège : {item.common_pitfall}")

if __name__ == "__main__":
    run()