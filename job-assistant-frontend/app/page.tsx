"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import {
  API_URL,
  fetchApplication,
  mapCandidateInfo,
  saveApplication,
} from "@/lib/api";
import { notifyApplicationsChanged } from "@/lib/applications-sync";
import { coverLetterFileName, formatFrDate, fullReportFileName } from "@/lib/pdf";
import type {
  CandidateInfo,
  CompanyAnalysis,
  CompanyMotivationPitch,
  CoverLetterPDFProps,
  FullReportPDFProps,
  TechnicalProject,
  TechnicalQAPrep,
} from "@/lib/types";

const PdfDownloadActions = dynamic(() => import("@/components/PdfDownloadActions"), {
  ssr: false,
  loading: () => (
    <span className="text-sm font-semibold text-gray-600">Préparation du PDF…</span>
  ),
});

const emptyCandidate: CandidateInfo = {
  candidateName: "",
  candidateEmail: "",
  candidatePhone: "",
  candidateLocation: "",
};

function Dashboard() {
  const searchParams = useSearchParams();
  const [file, setFile] = useState<File | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [candidateInfo, setCandidateInfo] = useState<CandidateInfo>(emptyCandidate);

  const [loadingAll, setLoadingAll] = useState(false);
  const [loadingAgent, setLoadingAgent] = useState<string | null>(null);
  const [parsingCv, setParsingCv] = useState(false);

  const [coverLetter, setCoverLetter] = useState("");
  const [companyInfo, setCompanyInfo] = useState<CompanyAnalysis | null>(null);
  const [project, setProject] = useState<TechnicalProject | null>(null);
  const [motivation, setMotivation] = useState<CompanyMotivationPitch | null>(null);
  const [technicalQa, setTechnicalQa] = useState<TechnicalQAPrep | null>(null);

  const applicationIdRef = useRef<string | null>(null);
  const loadedHistoryIdRef = useRef<string | null>(null);
  const letterTextareaRef = useRef<HTMLTextAreaElement>(null);
  const persistLetterTimeoutRef = useRef<number | null>(null);
  const letterWasGeneratedRef = useRef(false);
  const latestRef = useRef({
    coverLetter,
    companyInfo,
    project,
    motivation,
    technicalQa,
    candidateInfo,
    companyName,
    jobTitle,
    jobDescription,
  });
  latestRef.current = {
    coverLetter,
    companyInfo,
    project,
    motivation,
    technicalQa,
    candidateInfo,
    companyName,
    jobTitle,
    jobDescription,
  };

  const persistApplication = async (snapshot: {
    coverLetter?: string | null;
    companyInfo?: CompanyAnalysis | null;
    project?: TechnicalProject | null;
    motivation?: CompanyMotivationPitch | null;
    technicalQa?: TechnicalQAPrep | null;
    candidateInfo?: CandidateInfo;
    companyName?: string;
    jobTitle?: string;
  }) => {
    const latest = latestRef.current;
    const payload: Parameters<typeof saveApplication>[0] = {
      ...(applicationIdRef.current ? { id: applicationIdRef.current } : {}),
      company_name: snapshot.companyName ?? latest.companyName,
      job_title: snapshot.jobTitle ?? latest.jobTitle,
      job_description: latest.jobDescription,
      created_at: new Date().toISOString(),
      candidate_info: snapshot.candidateInfo ?? latest.candidateInfo,
    };

    if ("coverLetter" in snapshot) payload.cover_letter = snapshot.coverLetter;
    else if (latest.coverLetter) payload.cover_letter = latest.coverLetter;
    if ("companyInfo" in snapshot) payload.company_info = snapshot.companyInfo;
    else if (latest.companyInfo) payload.company_info = latest.companyInfo;
    if ("project" in snapshot) payload.project = snapshot.project;
    else if (latest.project) payload.project = latest.project;
    if ("motivation" in snapshot) payload.motivation = snapshot.motivation;
    else if (latest.motivation) payload.motivation = latest.motivation;
    if ("technicalQa" in snapshot) payload.technical_qa = snapshot.technicalQa;
    else if (latest.technicalQa) payload.technical_qa = latest.technicalQa;

    const hasContent = Boolean(
      payload.cover_letter ||
        payload.company_info ||
        payload.project ||
        payload.motivation ||
        payload.technical_qa,
    );
    if (!hasContent) return;

    try {
      const saved = await saveApplication(payload);
      applicationIdRef.current = saved.id;
      notifyApplicationsChanged();
      return saved;
    } catch (error) {
      console.error(error);
    }
  };

  const applyCandidateFromApi = useCallback((raw: unknown) => {
    const mapped = mapCandidateInfo(raw as CandidateInfo);
    setCandidateInfo(mapped);
    return mapped;
  }, []);

  const parseCv = async (selectedFile: File) => {
    const formData = new FormData();
    formData.append("file", selectedFile);
    const uploadRes = await fetch(`${API_URL}/api/parse-cv`, {
      method: "POST",
      body: formData,
    });
    if (!uploadRes.ok) throw new Error("Erreur lors de l'upload du CV");
    const data = await uploadRes.json();
    applyCandidateFromApi(data.candidate_info);
    return true;
  };

  const uploadCvIfNeeded = async () => {
    if (!file) {
      alert("Veuillez sélectionner un fichier CV au format PDF.");
      return false;
    }
    await parseCv(file);
    return true;
  };

  const handleFileChange = async (selected: File | null) => {
    setFile(selected);
    if (!selected) {
      setCandidateInfo(emptyCandidate);
      return;
    }
    setParsingCv(true);
    try {
      await parseCv(selected);
    } catch {
      alert("Impossible d'extraire les informations du CV.");
    } finally {
      setParsingCv(false);
    }
  };

  const applyJobOffer = (data: { company_name?: string; job_title?: string }) => {
    const nextCompany = (data.company_name || "").trim();
    const nextTitle = (data.job_title || "").trim();
    if (nextCompany) setCompanyName(nextCompany);
    if (nextTitle) setJobTitle(nextTitle);
    return {
      companyName: nextCompany || companyName,
      jobTitle: nextTitle || jobTitle,
    };
  };

  const consumeSseDataLine = (
    line: string,
    onMeta: (meta: { company_name?: string; job_title?: string }) => void,
    onContent: (text: string) => void,
  ) => {
    const trimmed = line.trim();
    if (!trimmed.startsWith("data:")) return;
    const jsonStr = trimmed.replace(/^data:\s?/, "").trim();
    if (!jsonStr) return;

    if (jsonStr.startsWith("__JOB_META__")) {
      try {
        onMeta(JSON.parse(jsonStr.replace("__JOB_META__", "")));
      } catch {
        // ignore malformed meta events
      }
      return;
    }

    try {
      const data = JSON.parse(jsonStr) as { content?: unknown; meta?: { company_name?: string; job_title?: string } };
      if (data.meta) onMeta(data.meta);
      if (typeof data.content === "string" && data.content) onContent(data.content);
    } catch {
      onContent(jsonStr);
    }
  };

  const getPayload = () => ({
    job_description: jobDescription,
  });

  const runCoverLetterAgent = async () => {
    if (!(await uploadCvIfNeeded())) return;
    if (!jobDescription) return alert("La fiche de poste est requise.");

    setLoadingAgent("letter");
    setCoverLetter("");
    let assembled = "";
    let extracted = { companyName, jobTitle };
    try {
      const response = await fetch(
        `${API_URL}/api/generate-cover-letter-stream?cv_file_name=${file?.name}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(getPayload()),
        },
      );

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let sseBuffer = "";

      while (reader) {
        const { value, done } = await reader.read();
        if (done) break;

        sseBuffer += decoder.decode(value, { stream: true });
        const events = sseBuffer.split("\n\n");
        sseBuffer = events.pop() ?? "";

        for (const event of events) {
          consumeSseDataLine(
            event,
            (meta) => {
              extracted = applyJobOffer(meta);
            },
            (text) => {
              assembled += text;
              setCoverLetter(assembled);
            },
          );
        }
      }

      sseBuffer += decoder.decode();
      if (sseBuffer.trim()) {
        consumeSseDataLine(
          sseBuffer,
          (meta) => {
            extracted = applyJobOffer(meta);
          },
          (text) => {
            assembled += text;
            setCoverLetter(assembled);
          },
        );
      }
      latestRef.current = {
        ...latestRef.current,
        coverLetter: assembled,
        companyName: extracted.companyName,
        jobTitle: extracted.jobTitle,
      };
      await persistApplication({
        coverLetter: assembled,
        companyName: extracted.companyName,
        jobTitle: extracted.jobTitle,
      });
    } catch {
      alert("Erreur lors de la génération de la lettre.");
    } finally {
      setLoadingAgent(null);
    }
  };

  const runAnalysisAgent = async (
    agentType: "company" | "project" | "motivation" | "qa" | "all_analysis",
  ) => {
    if (!(await uploadCvIfNeeded())) return;
    if (!jobDescription) return alert("La fiche de poste est requise.");

    setLoadingAgent(agentType);
    try {
      const res = await fetch(
        `${API_URL}/api/analyze-application?cv_file_name=${file?.name}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(getPayload()),
        },
      );
      const data = await res.json();
      if (data.candidate_info) applyCandidateFromApi(data.candidate_info);
      const extracted = applyJobOffer(data);

      const nextCompany =
        agentType === "company" || agentType === "all_analysis"
          ? data.company_info
          : undefined;
      const nextProject =
        agentType === "project" || agentType === "all_analysis"
          ? data.project
          : undefined;
      const nextMotivation =
        agentType === "motivation" || agentType === "all_analysis"
          ? data.motivation
          : undefined;
      const nextQa =
        agentType === "qa" || agentType === "all_analysis"
          ? data.technical_qa
          : undefined;

      if (nextCompany) setCompanyInfo(nextCompany);
      if (nextProject) setProject(nextProject);
      if (nextMotivation) setMotivation(nextMotivation);
      if (nextQa) setTechnicalQa(nextQa);

      latestRef.current = {
        ...latestRef.current,
        companyName: extracted.companyName,
        jobTitle: extracted.jobTitle,
        companyInfo: nextCompany ?? latestRef.current.companyInfo,
        project: nextProject ?? latestRef.current.project,
        motivation: nextMotivation ?? latestRef.current.motivation,
        technicalQa: nextQa ?? latestRef.current.technicalQa,
        candidateInfo: data.candidate_info
          ? mapCandidateInfo(data.candidate_info)
          : latestRef.current.candidateInfo,
      };

      await persistApplication({
        ...(nextCompany ? { companyInfo: nextCompany } : {}),
        ...(nextProject ? { project: nextProject } : {}),
        ...(nextMotivation ? { motivation: nextMotivation } : {}),
        ...(nextQa ? { technicalQa: nextQa } : {}),
        companyName: extracted.companyName,
        jobTitle: extracted.jobTitle,
      });
    } catch {
      alert("Erreur lors de l'analyse.");
    } finally {
      setLoadingAgent(null);
    }
  };

  const runAllPipeline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !jobDescription) {
      return alert("Veuillez fournir un CV et la fiche de poste.");
    }

    applicationIdRef.current = null;
    letterWasGeneratedRef.current = false;
    latestRef.current = {
      ...latestRef.current,
      coverLetter: "",
      companyInfo: null,
      project: null,
      motivation: null,
      technicalQa: null,
      companyName: "",
      jobTitle: "",
    };
    setLoadingAll(true);
    setCoverLetter("");
    setCompanyInfo(null);
    setProject(null);
    setMotivation(null);
    setTechnicalQa(null);
    setCompanyName("");
    setJobTitle("");

    await runAnalysisAgent("all_analysis");
    await runCoverLetterAgent();
    setLoadingAll(false);
  };

  const loadFromHistory = useCallback(async (id: string) => {
    try {
      const application = await fetchApplication(id);
      applicationIdRef.current = application.id;
      setCompanyName(application.company_name || "");
      setJobTitle(application.job_title || "");
      setJobDescription(application.job_description || "");
      setCoverLetter(application.cover_letter || "");
      setCompanyInfo(application.company_info || null);
      setProject(application.project || null);
      setMotivation(application.motivation || null);
      setTechnicalQa(application.technical_qa || null);
      setCandidateInfo(mapCandidateInfo(application.candidate_info));
    } catch {
      alert("Impossible de recharger cette candidature.");
    }
  }, []);

  useEffect(() => {
    const id = searchParams.get("applicationId");
    if (!id || loadedHistoryIdRef.current === id) return;
    loadedHistoryIdRef.current = id;
    void loadFromHistory(id);
  }, [searchParams, loadFromHistory]);

  useEffect(() => {
    const el = letterTextareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(el.scrollHeight, 400)}px`;
  }, [coverLetter]);

  useEffect(() => {
    return () => {
      if (persistLetterTimeoutRef.current) {
        window.clearTimeout(persistLetterTimeoutRef.current);
      }
    };
  }, []);

  const persistEditedLetter = (value: string) => {
    if (persistLetterTimeoutRef.current) {
      window.clearTimeout(persistLetterTimeoutRef.current);
    }
    persistLetterTimeoutRef.current = window.setTimeout(() => {
      void persistApplication({ coverLetter: value });
    }, 600) as unknown as number;
  };

  const handleCoverLetterChange = (value: string) => {
    setCoverLetter(value);
    persistEditedLetter(value);
  };

  const letterProps: CoverLetterPDFProps = {
    candidateName: candidateInfo.candidateName,
    candidateEmail: candidateInfo.candidateEmail,
    candidatePhone: candidateInfo.candidatePhone,
    candidateLocation: candidateInfo.candidateLocation,
    companyName,
    jobTitle,
    letterBody: coverLetter,
    letterDate: formatFrDate(),
  };

  const reportProps: FullReportPDFProps = {
    ...letterProps,
    jobDescription,
    companyInfo,
    project,
    motivation,
    technicalQa,
  };

  const showLetterEditor = Boolean(coverLetter) || loadingAgent === "letter" || letterWasGeneratedRef.current;
  if (coverLetter) letterWasGeneratedRef.current = true;

  const hasAnyResult = Boolean(
    coverLetter || companyInfo || project || motivation || technicalQa || showLetterEditor,
  );

  return (
    <main className="min-h-screen bg-gray-100 p-8 text-black">
      <div className="max-w-6xl mx-auto space-y-8">
        <h1 className="text-4xl font-extrabold text-black">Job Application Assistant</h1>

        <form onSubmit={runAllPipeline} className="bg-white p-6 rounded-xl shadow-md border border-gray-300 space-y-6">
          <div>
            <label className="block text-lg font-bold text-black mb-2">Votre CV (PDF)</label>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => void handleFileChange(e.target.files?.[0] || null)}
              className="w-full p-3 border-2 border-gray-400 rounded-lg text-black bg-white focus:border-black"
            />
            {parsingCv ? (
              <p className="mt-2 text-sm font-semibold text-blue-800">
                Extraction des informations du CV…
              </p>
            ) : candidateInfo.candidateName || candidateInfo.candidateEmail ? (
              <p className="mt-2 text-sm font-semibold text-emerald-800">
                Candidat détecté : {[candidateInfo.candidateName, candidateInfo.candidateEmail, candidateInfo.candidatePhone, candidateInfo.candidateLocation].filter(Boolean).join(" · ")}
              </p>
            ) : null}
          </div>

          <div>
            <label className="block text-lg font-bold text-black mb-2">Fiche de Poste (Job Description)</label>
            <textarea
              rows={6}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Collez la description complète de l'offre ici..."
              className="w-full p-3 border-2 border-gray-400 rounded-lg text-black placeholder-gray-600 bg-white focus:border-black font-medium"
            />
            {companyName || jobTitle ? (
              <p className="mt-2 text-sm font-semibold text-emerald-800">
                Offre détectée : {[jobTitle, companyName].filter(Boolean).join(" · ")}
              </p>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={loadingAll || !!loadingAgent}
            className="w-full bg-blue-700 text-white text-xl font-bold py-4 rounded-xl hover:bg-blue-800 disabled:opacity-50 transition-colors shadow-md"
          >
            {loadingAll ? "⏳ Exécution de toute la pipeline..." : "🚀 Lancer toute la pipeline"}
          </button>

          <div className="pt-4 border-t border-gray-300">
            <p className="text-md font-bold text-black mb-3">Ou lancer un agent spécifique :</p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <button
                type="button"
                onClick={() => void runCoverLetterAgent()}
                disabled={loadingAll || !!loadingAgent}
                className="bg-gray-800 text-white font-bold p-3 rounded-lg hover:bg-black text-sm disabled:opacity-50"
              >
                {loadingAgent === "letter" ? "Génération..." : "✍️ Lettre"}
              </button>

              <button
                type="button"
                onClick={() => void runAnalysisAgent("company")}
                disabled={loadingAll || !!loadingAgent}
                className="bg-gray-800 text-white font-bold p-3 rounded-lg hover:bg-black text-sm disabled:opacity-50"
              >
                {loadingAgent === "company" ? "Recherche..." : "🔍 Recherche Boîte"}
              </button>

              <button
                type="button"
                onClick={() => void runAnalysisAgent("project")}
                disabled={loadingAll || !!loadingAgent}
                className="bg-gray-800 text-white font-bold p-3 rounded-lg hover:bg-black text-sm disabled:opacity-50"
              >
                {loadingAgent === "project" ? "Génération..." : "🛠️ Faux Projet"}
              </button>

              <button
                type="button"
                onClick={() => void runAnalysisAgent("motivation")}
                disabled={loadingAll || !!loadingAgent}
                className="bg-gray-800 text-white font-bold p-3 rounded-lg hover:bg-black text-sm disabled:opacity-50"
              >
                {loadingAgent === "motivation" ? "Génération..." : "🗣️ Pitch"}
              </button>

              <button
                type="button"
                onClick={() => void runAnalysisAgent("qa")}
                disabled={loadingAll || !!loadingAgent}
                className="bg-gray-800 text-white font-bold p-3 rounded-lg hover:bg-black text-sm disabled:opacity-50"
              >
                {loadingAgent === "qa" ? "Génération..." : "🧪 Q&A Technique"}
              </button>
            </div>
          </div>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {showLetterEditor && (
            <div className="bg-white p-6 rounded-xl border-2 border-gray-400 shadow-md md:col-span-2">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-black">✉️ Lettre de Motivation</h2>
                  <p className="mt-1 text-sm font-medium text-slate-600">
                    Vous pouvez modifier le texte ci-dessous avant de générer votre PDF
                  </p>
                </div>
                <PdfDownloadActions
                  letter={letterProps}
                  report={hasAnyResult ? reportProps : null}
                  letterFileName={coverLetterFileName(companyName, jobTitle)}
                  reportFileName={fullReportFileName(companyName, jobTitle)}
                />
              </div>
              <textarea
                ref={letterTextareaRef}
                value={coverLetter}
                onChange={(event) => handleCoverLetterChange(event.target.value)}
                onBlur={(event) => {
                  if (persistLetterTimeoutRef.current) {
                    window.clearTimeout(persistLetterTimeoutRef.current);
                  }
                  void persistApplication({ coverLetter: event.target.value });
                }}
                disabled={loadingAll || loadingAgent === "letter"}
                spellCheck
                placeholder={loadingAgent === "letter" ? "Génération de la lettre en cours…" : "Lettre de motivation"}
                className="w-full min-h-[400px] resize-y overflow-hidden rounded-lg border border-gray-300 bg-white p-5 font-serif text-base leading-relaxed text-black shadow-inner focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-50 disabled:text-slate-700"
              />
            </div>
          )}

          {!showLetterEditor && hasAnyResult && (
            <div className="bg-white p-4 rounded-xl border-2 border-gray-400 shadow-md md:col-span-2 flex justify-end">
              <PdfDownloadActions
                report={reportProps}
                letterFileName={coverLetterFileName(companyName, jobTitle)}
                reportFileName={fullReportFileName(companyName, jobTitle)}
              />
            </div>
          )}

          {companyInfo && (
            <div className="bg-white p-6 rounded-xl border-2 border-gray-400 shadow-md md:col-span-2">
              <h2 className="text-2xl font-bold text-black mb-3">
                🔍 Recherche sur l&apos;entreprise {companyName ? `(${companyName})` : ""}
              </h2>
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-300">
                  <h3 className="font-bold text-black text-lg mb-1">Résumé & Enjeux :</h3>
                  <p className="text-black font-medium">{companyInfo.company_overview}</p>
                </div>

                {companyInfo.key_tech_focus?.length > 0 && (
                  <div>
                    <h3 className="font-bold text-black text-md mb-1">Focus Techniques & IA :</h3>
                    <ul className="list-disc pl-5 text-black font-medium">
                      {companyInfo.key_tech_focus.map((tech, idx) => (
                        <li key={idx}>{tech}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {companyInfo.interview_questions?.length > 0 && (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-300">
                    <h3 className="font-bold text-black text-md mb-2">
                      ❓ Questions stratégiques à poser à la fin de l&apos;entretien :
                    </h3>
                    <ul className="list-disc pl-5 space-y-1 text-black font-semibold">
                      {companyInfo.interview_questions.map((q, idx) => (
                        <li key={idx}>{q}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {project && (
            <div className="bg-white p-6 rounded-xl border-2 border-gray-400 shadow-md">
              <h2 className="text-2xl font-bold text-black mb-2">🛠️ Projet Perso Recommandé</h2>
              <h3 className="text-xl font-extrabold text-blue-900">{project.title}</h3>
              <p className="text-black font-medium my-3">{project.pitch}</p>
              <div className="mt-4">
                <span className="font-bold text-black text-md">Métriques clés :</span>
                <ul className="list-disc pl-5 text-black font-medium mt-1">
                  {project.key_metrics?.map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {motivation && (
            <div className="bg-white p-6 rounded-xl border-2 border-gray-400 shadow-md">
              <h2 className="text-2xl font-bold text-black mb-3">
                🗣️ Pitch : « Pourquoi cette entreprise ? »
              </h2>
              <p className="text-black font-semibold text-lg bg-yellow-100 p-4 rounded-lg border-l-8 border-yellow-500 leading-relaxed">
                « {motivation.spoken_pitch} »
              </p>
            </div>
          )}

          {technicalQa && (
            <div className="bg-white p-6 rounded-xl border-2 border-gray-400 shadow-md md:col-span-2">
              <h2 className="text-2xl font-bold text-black mb-4">🧪 Cartes de révision Technique</h2>
              <div className="space-y-4">
                {technicalQa.questions_and_answers?.map((qa, idx) => (
                  <div key={idx} className="border-b-2 border-gray-300 pb-4">
                    <p className="font-bold text-black text-lg">Q: {qa.question}</p>
                    <p className="text-black font-semibold text-md mt-1">👉 Réponse : {qa.suggested_answer}</p>
                    <p className="text-red-700 font-bold text-sm mt-1">⚠️ Piège : {qa.common_pitfall}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-gray-100 p-8 text-black">
          Chargement de l&apos;assistant…
        </main>
      }
    >
      <Dashboard />
    </Suspense>
  );
}
