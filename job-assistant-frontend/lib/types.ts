export interface CandidateInfo {
  candidateName: string;
  candidateEmail: string;
  candidatePhone: string;
  candidateLocation: string;
}

export interface BackendCandidateInfo {
  first_name?: string;
  last_name?: string;
  full_name?: string;
  email?: string;
  phone?: string;
  location?: string;
  candidateName?: string;
  candidateEmail?: string;
  candidatePhone?: string;
  candidateLocation?: string;
}

export interface CompanyAnalysis {
  company_overview: string;
  key_tech_focus: string[];
  interview_questions: string[];
}

export interface TechnicalProject {
  title: string;
  pitch: string;
  target_skill_gap?: string;
  tech_stack?: string[];
  key_metrics: string[];
  talking_points?: string[];
}

export interface CompanyMotivationPitch {
  hook_sentence?: string;
  core_arguments?: string[];
  spoken_pitch: string;
}

export interface TechnicalQAItem {
  question: string;
  expected_concept?: string;
  suggested_answer: string;
  common_pitfall: string;
}

export interface TechnicalQAPrep {
  questions_and_answers: TechnicalQAItem[];
}

export interface CoverLetterPDFProps {
  candidateName: string;
  candidateEmail: string;
  candidatePhone: string;
  candidateLocation: string;
  companyName: string;
  jobTitle: string;
  letterBody: string;
  letterDate?: string;
}

export interface FullReportPDFProps {
  candidateName: string;
  candidateEmail: string;
  candidatePhone: string;
  candidateLocation: string;
  companyName: string;
  jobTitle: string;
  jobDescription?: string;
  letterBody?: string;
  companyInfo?: CompanyAnalysis | null;
  project?: TechnicalProject | null;
  motivation?: CompanyMotivationPitch | null;
  technicalQa?: TechnicalQAPrep | null;
  createdAt?: string;
}

export interface SavedApplicationSummary {
  id: string;
  company_name: string;
  job_title: string;
  created_at: string;
  updated_at?: string;
}

export interface SavedApplication extends SavedApplicationSummary {
  job_description?: string;
  cover_letter?: string | null;
  company_info?: CompanyAnalysis | null;
  project?: TechnicalProject | null;
  motivation?: CompanyMotivationPitch | null;
  technical_qa?: TechnicalQAPrep | null;
  candidate_info?: BackendCandidateInfo | null;
}

export interface SaveApplicationPayload {
  id?: string | null;
  company_name: string;
  job_title: string;
  job_description: string;
  created_at: string;
  cover_letter?: string | null;
  company_info?: CompanyAnalysis | null;
  project?: TechnicalProject | null;
  motivation?: CompanyMotivationPitch | null;
  technical_qa?: TechnicalQAPrep | null;
  candidate_info?: CandidateInfo | BackendCandidateInfo | null;
}
