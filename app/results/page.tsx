"use client";

import { useEffect, useMemo, useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

type AnalysisIssueSeverity = "high" | "medium" | "low";
type AnalysisIssueEvidenceKind = "cv_text" | "absence" | "pattern";
type AnalysisIssueFixMode =
  | "rewrite"
  | "user_confirmation"
  | "structural";

type AnalysisIssueSectionKey =
  | "header"
  | "summary"
  | "skills"
  | "experience"
  | "education"
  | "certifications"
  | "projects"
  | "languages"
  | "leadership"
  | "awards"
  | "volunteering"
  | "references";

type AnalysisIssue = {
  id: string;
  sectionKey: AnalysisIssueSectionKey;
  category: string;
  title: string;
  problem: string;
  evidence: string;
  evidenceKind: AnalysisIssueEvidenceKind;
  recommendation: string;
  severity: AnalysisIssueSeverity;
  fixMode: AnalysisIssueFixMode;
};

type Analysis = {
  overallScore: number;

  scoreBreakdown: {
    contentExperience: number;
    skillsRelevance: number;
    professionalPositioning: number;
    atsReadiness: number;
    education: number;
    cvStructure: number;
  };

  summary: string;

  strengths: string[];
  weaknesses: string[];
  skills: string[];
  recommendedSkills: string[];

  experienceAssessment: string;
  educationAssessment: string;
  atsAssessment: string;

  improvements: string[];
  recommendedRoles: string[];

  /*
   * Added by the traceable-analysis contract.
   * Optional here only so an older sessionStorage analysis
   * does not crash the Results page during the migration.
   */
  issues?: AnalysisIssue[];
};

type AccountResponse = {
  success?: boolean;
  authenticated?: boolean;
  cvHash?: string | null;
  cvUnlocked?: boolean;
  hasPaidAccess?: boolean;
  error?: string;
};

function isAnalysisIssue(value: unknown): value is AnalysisIssue {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const issue = value as Partial<AnalysisIssue>;

  return (
    typeof issue.id === "string" &&
    typeof issue.sectionKey === "string" &&
    typeof issue.category === "string" &&
    typeof issue.title === "string" &&
    typeof issue.problem === "string" &&
    typeof issue.evidence === "string" &&
    typeof issue.evidenceKind === "string" &&
    typeof issue.recommendation === "string" &&
    typeof issue.severity === "string" &&
    typeof issue.fixMode === "string"
  );
}

function getTraceableIssues(analysis: Analysis): AnalysisIssue[] {
  if (!Array.isArray(analysis.issues)) {
    return [];
  }

  return analysis.issues.filter(isAnalysisIssue);
}

function formatSectionName(sectionKey: AnalysisIssueSectionKey) {
  const labels: Record<AnalysisIssueSectionKey, string> = {
    header: "Header",
    summary: "Professional Summary",
    skills: "Skills",
    experience: "Experience",
    education: "Education",
    certifications: "Certifications",
    projects: "Projects",
    languages: "Languages",
    leadership: "Leadership",
    awards: "Awards",
    volunteering: "Volunteering",
    references: "References",
  };

  return labels[sectionKey];
}

function formatFixMode(fixMode: AnalysisIssueFixMode) {
  if (fixMode === "rewrite") {
    return "CVCommit can rewrite this";
  }

  if (fixMode === "user_confirmation") {
    return "Your confirmation is required";
  }

  return "CVCommit can restructure this";
}

function formatEvidenceKind(evidenceKind: AnalysisIssueEvidenceKind) {
  if (evidenceKind === "cv_text") {
    return "Evidence from your CV";
  }

  if (evidenceKind === "absence") {
    return "Missing information detected";
  }

  return "Pattern detected";
}

export default function ResultsPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [fileName, setFileName] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasPaidAccess, setHasPaidAccess] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadResultsPage() {
      const storedAnalysis = sessionStorage.getItem("careerOSAnalysis");
      const storedFileName = sessionStorage.getItem("careerOSFileName");

      let nextAnalysis: Analysis | null = null;

      if (storedAnalysis) {
        try {
          nextAnalysis = JSON.parse(storedAnalysis) as Analysis;
        } catch (error) {
          console.error("CVCommit failed to load analysis:", error);
        }
      }

      const currentCVHash =
        sessionStorage.getItem("careerOSActiveCVHash")?.trim() ?? "";

      let nextHasPaidAccess = false;

      if (currentCVHash) {
        try {
          const response = await fetch(
            `/api/account?cvHash=${encodeURIComponent(currentCVHash)}`,
            {
              method: "GET",
              cache: "no-store",
            }
          );

          const data = (await response.json()) as AccountResponse;

          if (
            response.ok &&
            data.success === true &&
            data.authenticated === true &&
            data.cvHash === currentCVHash
          ) {
            nextHasPaidAccess = data.hasPaidAccess === true;
          } else if (response.status === 401 || !data.authenticated) {
            console.warn(
              "CVCommit: No authenticated account found for this CV."
            );
          } else {
            console.error(
              "CVCommit: Could not load access for this CV.",
              data.error || "Unknown CV access error."
            );
          }
        } catch (error) {
          console.error("CVCommit CV access error:", error);
        }
      } else {
        console.warn(
          "CVCommit: No active CV hash found while loading results."
        );
      }

      if (cancelled) {
        return;
      }

      setAnalysis(nextAnalysis);

      if (storedFileName) {
        setFileName(storedFileName);
      }

      setHasPaidAccess(nextHasPaidAccess);
      setIsLoaded(true);
    }

    void loadResultsPage();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSignOut() {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      sessionStorage.clear();

      router.replace("/");
      router.refresh();
    } catch (error) {
      console.error("CVCommit sign out error:", error);

      alert("CVCommit could not sign you out. Please try again.");

      setIsSigningOut(false);
    }
  }

  if (!isLoaded) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6">
        <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          </div>

          <h1 className="mt-6 text-2xl font-bold tracking-tight text-zinc-950">
            Loading your analysis
          </h1>

          <p className="mt-3 text-sm leading-6 text-zinc-500">
            Preparing your CVCommit report...
          </p>
        </div>
      </main>
    );
  }

  if (!analysis) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6">
        <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-2xl">
            ?
          </div>

          <h1 className="mt-6 text-2xl font-bold tracking-tight text-zinc-950">
            No analysis found
          </h1>

          <p className="mt-3 text-sm leading-6 text-zinc-500">
            Upload a CV to generate your CVCommit report.
          </p>

          <Link
            href="/upload"
            className="mt-7 inline-flex rounded-xl bg-zinc-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
          >
            Upload your CV
          </Link>
        </div>
      </main>
    );
  }

  const breakdown = analysis.scoreBreakdown;

  const clampScore = (value: number, max: number) => {
    return Math.max(0, Math.min(max, Number(value) || 0));
  };

  const contentExperience = clampScore(breakdown.contentExperience, 25);
  const skillsRelevance = clampScore(breakdown.skillsRelevance, 20);
  const professionalPositioning = clampScore(
    breakdown.professionalPositioning,
    20
  );
  const atsReadiness = clampScore(breakdown.atsReadiness, 15);
  const education = clampScore(breakdown.education, 10);
  const cvStructure = clampScore(breakdown.cvStructure, 10);

  const score =
    contentExperience +
    skillsRelevance +
    professionalPositioning +
    atsReadiness +
    education +
    cvStructure;

  const scoreLabel =
    score >= 80
      ? "Strong CV"
      : score >= 65
        ? "Good foundation"
        : score >= 50
          ? "Needs improvement"
          : "Needs attention";

  const issues = getTraceableIssues(analysis);
  const hasTraceableIssues = issues.length > 0;
  const hasFixAccess = hasPaidAccess;

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950">
      <nav className="sticky top-0 z-20 border-b border-zinc-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="text-xl font-bold tracking-tight sm:text-2xl"
          >
            CV<span className="text-blue-600">Commit</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/upload"
              className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 transition hover:border-zinc-300 hover:bg-zinc-50"
            >
              Analyze another CV
            </Link>

            <button
              type="button"
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSigningOut ? "Signing out..." : "Sign Out"}
            </button>
          </div>
        </div>
      </nav>

      <section className="mx-auto max-w-7xl px-5 pb-20 pt-10 sm:px-6 lg:px-8 lg:pt-14">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-blue-700">
              CVCommit Report
            </div>

            <div
              className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wider ${
                hasFixAccess
                  ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border border-zinc-200 bg-white text-zinc-500"
              }`}
            >
              {hasFixAccess ? "CV Unlocked" : "Free Analysis"}
            </div>

            {hasTraceableIssues && (
              <div className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-amber-700">
                {issues.length} {issues.length === 1 ? "Issue" : "Issues"} Found
              </div>
            )}
          </div>

          <h1 className="mt-5 text-4xl font-bold tracking-tight text-zinc-950 sm:text-5xl lg:text-6xl">
            Your CV analysis
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-500 sm:text-lg">
            A practical assessment of your CV&apos;s strengths, weaknesses,
            positioning, and exact issues CVCommit can trace back to your
            document.
          </p>

          {fileName && (
            <div className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm text-zinc-500 shadow-sm ring-1 ring-zinc-200">
              <span className="font-medium text-zinc-800">File</span>
              <span className="text-zinc-300">•</span>
              <span className="max-w-[250px] truncate">{fileName}</span>
            </div>
          )}
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-5">
          <div className="relative overflow-hidden rounded-3xl bg-zinc-950 p-7 text-white shadow-xl sm:p-8 lg:col-span-2">
            <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-blue-600/20 blur-3xl" />

            <div className="relative">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-400">
                    Overall CV Score
                  </p>

                  <p className="mt-2 text-sm font-semibold text-blue-400">
                    {scoreLabel}
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-sm font-bold">
                  /100
                </div>
              </div>

              <div className="mt-8 flex items-end gap-2">
                <span className="text-7xl font-bold tracking-tight">
                  {score}
                </span>

                <span className="mb-3 text-lg text-zinc-500">/100</span>
              </div>

              <div className="mt-7 h-2.5 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all"
                  style={{ width: `${score}%` }}
                />
              </div>

              <p className="mt-5 text-sm leading-6 text-zinc-400">
                Your score combines six areas that determine the current
                strength and effectiveness of your CV.
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-200 bg-white p-7 shadow-sm sm:p-8 lg:col-span-3">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-blue-600" />

              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
                Executive Summary
              </p>
            </div>

            <p className="mt-7 text-xl font-medium leading-9 tracking-tight text-zinc-800 sm:text-2xl">
              {analysis.summary}
            </p>
          </div>
        </div>

        <section className="mt-5 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
                Score Breakdown
              </p>

              <h2 className="mt-2 text-2xl font-bold tracking-tight text-zinc-950">
                What&apos;s driving your score?
              </h2>
            </div>

            <span className="text-sm font-medium text-zinc-400">
              100 points total
            </span>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <ScoreItem
              title="Content & Experience"
              score={contentExperience}
              max={25}
            />

            <ScoreItem
              title="Skills & Relevance"
              score={skillsRelevance}
              max={20}
            />

            <ScoreItem
              title="Professional Positioning"
              score={professionalPositioning}
              max={20}
            />

            <ScoreItem
              title="ATS Readiness"
              score={atsReadiness}
              max={15}
            />

            <ScoreItem title="Education" score={education} max={10} />

            <ScoreItem title="CV Structure" score={cvStructure} max={10} />
          </div>
        </section>

        <section className="mt-5 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
                Traceable Issues
              </p>

              <h2 className="mt-2 text-2xl font-bold tracking-tight text-zinc-950">
                What CVCommit actually found
              </h2>

              <p className="mt-3 text-sm leading-6 text-zinc-500">
                Every item below is tied to a specific analysis issue. These
                same issue IDs will be carried into Fix, so CVCommit does not
                invent a different problem later.
              </p>
            </div>

            {hasTraceableIssues && (
              <div className="shrink-0 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm">
                <span className="font-bold text-zinc-950">{issues.length}</span>
                <span className="ml-1 text-zinc-500">
                  traceable {issues.length === 1 ? "issue" : "issues"}
                </span>
              </div>
            )}
          </div>

          {hasTraceableIssues ? (
            <div className="mt-8 space-y-4">
              {issues.map((issue, index) => (
                <IssueCard key={issue.id} issue={issue} index={index} />
              ))}
            </div>
          ) : (
            <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <div className="flex gap-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-sm font-bold text-amber-700 shadow-sm ring-1 ring-amber-200">
                  !
                </div>

                <div>
                  <h3 className="font-bold text-zinc-950">
                    This looks like an older cached analysis
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-zinc-600">
                    Traceable issue tracking was not stored in this analysis.
                    Analyze the CV again so CVCommit can generate issue IDs,
                    evidence, and fix instructions using the new contract.
                  </p>

                  <Link
                    href="/upload"
                    className="mt-4 inline-flex rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800"
                  >
                    Analyze again
                  </Link>
                </div>
              </div>
            </div>
          )}
        </section>

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <AnalysisCard
            title="Strengths"
            items={analysis.strengths}
            type="positive"
          />

          <AnalysisCard
            title="Areas to Improve"
            items={analysis.weaknesses}
            type="negative"
          />
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <SkillCard
            title="Your Skills"
            description="Skills identified from your CV."
            items={analysis.skills}
            variant="default"
          />

          <SkillCard
            title="Skills to Develop"
            description="Recommended areas to strengthen."
            items={analysis.recommendedSkills}
            variant="blue"
          />
        </div>

        <section className="mt-5 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
            Career Assessment
          </p>

          <h2 className="mt-2 text-2xl font-bold tracking-tight">
            Where your CV currently stands
          </h2>

          <div className="mt-8 grid gap-8 md:grid-cols-3">
            <Assessment title="Experience" text={analysis.experienceAssessment} />
            <Assessment title="Education" text={analysis.educationAssessment} />
            <Assessment title="ATS Readiness" text={analysis.atsAssessment} />
          </div>
        </section>

        <section className="mt-5 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
            Recommended Roles
          </p>

          <h2 className="mt-2 text-2xl font-bold tracking-tight">
            Roles worth exploring
          </h2>

          <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {analysis.recommendedRoles.map((role, index) => (
              <div
                key={`${role}-${index}`}
                className="group rounded-2xl border border-zinc-200 bg-zinc-50 p-5 transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50/40"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-xs font-bold text-zinc-500 shadow-sm ring-1 ring-zinc-200">
                  {String(index + 1).padStart(2, "0")}
                </div>

                <p className="mt-5 font-semibold leading-6 text-zinc-900">
                  {role}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-5 overflow-hidden rounded-3xl bg-zinc-950 p-6 text-white shadow-xl sm:p-8">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-400">
              Action Plan
            </p>

            <h2 className="mt-2 text-2xl font-bold tracking-tight">
              What you should improve next
            </h2>

            <p className="mt-3 text-sm leading-6 text-zinc-400">
              These high-level actions remain part of the report. The traceable
              issues above are the source of truth that Fix will use.
            </p>
          </div>

          <div className="mt-8 space-y-3">
            {analysis.improvements.map((improvement, index) => (
              <div
                key={`${improvement}-${index}`}
                className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:bg-white/[0.07] sm:p-5"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white">
                  {index + 1}
                </div>

                <p className="pt-1.5 text-sm leading-6 text-zinc-300">
                  {improvement}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section
          className={`mt-5 overflow-hidden rounded-3xl border p-6 shadow-sm sm:p-8 ${
            hasFixAccess
              ? "border-blue-100 bg-blue-50/60"
              : "border-violet-100 bg-gradient-to-br from-violet-50 via-white to-blue-50"
          }`}
        >
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="max-w-2xl">
              <div
                className={`inline-flex items-center rounded-full border bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] ${
                  hasFixAccess
                    ? "border-blue-200 text-blue-700"
                    : "border-violet-200 text-violet-700"
                }`}
              >
                {hasFixAccess ? "CV Unlocked" : "CV Unlock"}
              </div>

              <h2 className="mt-4 text-3xl font-bold tracking-tight text-zinc-950">
                {hasFixAccess
                  ? "Fix the issues CVCommit found"
                  : "Turn this analysis into an improved CV"}
              </h2>

              <p className="mt-3 text-base leading-7 text-zinc-600">
                {hasFixAccess
                  ? hasTraceableIssues
                    ? `CVCommit found ${issues.length} traceable ${
                        issues.length === 1 ? "issue" : "issues"
                      }. Fix will use these exact findings instead of guessing from generic recommendations.`
                    : "This analysis needs to be regenerated with traceable issue tracking before the new Fix workflow can use it safely."
                  : "Your free analysis identifies what needs improvement. Unlock this CV to get AI-assisted rewrites, an improved CV preview, and DOCX/PDF export."}
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <FixFeature text="Fix only detected issues" />
                <FixFeature text="Keep each fix linked to its issue ID" />
                <FixFeature text="Ask before changing unknown facts" />
                <FixFeature text="Download improved DOCX & PDF" />
              </div>
            </div>

            <div className="lg:min-w-[240px]">
              {hasFixAccess ? (
                <>
                  {hasTraceableIssues ? (
                    <Link
                      href="/fix"
                      className="flex w-full items-center justify-center rounded-2xl bg-blue-600 px-6 py-4 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
                    >
                      Fix My CV
                    </Link>
                  ) : (
                    <Link
                      href="/upload"
                      className="flex w-full items-center justify-center rounded-2xl bg-zinc-950 px-6 py-4 text-sm font-bold text-white shadow-lg transition hover:bg-zinc-800"
                    >
                      Analyze Again
                    </Link>
                  )}

                  <p className="mt-3 text-center text-xs text-zinc-500">
                    Permanently unlocked for this CV
                  </p>
                </>
              ) : (
                <>
                  <Link
                    href="/upgrade"
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-zinc-950 px-6 py-4 text-sm font-bold text-white shadow-lg transition hover:bg-zinc-800"
                  >
                    <span>🔒</span>
                    Unlock This CV — ₦7,500
                  </Link>

                  <p className="mt-3 text-center text-xs text-zinc-500">
                    One-time payment · No subscription
                  </p>
                </>
              )}
            </div>
          </div>
        </section>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-3xl border border-zinc-200 bg-white p-6 sm:flex-row sm:p-7">
          <div>
            <h2 className="font-bold text-zinc-950">
              Ready to improve your CV?
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Analyze another version and compare your progress.
            </p>
          </div>

          <Link
            href="/upload"
            className="inline-flex shrink-0 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Analyze another CV
          </Link>
        </div>

        <p className="mt-8 text-center text-xs text-zinc-400">
          Check it. Fix it. Commit.
        </p>
      </section>
    </main>
  );
}

function IssueCard({
  issue,
  index,
}: {
  issue: AnalysisIssue;
  index: number;
}) {
  const severityClasses: Record<AnalysisIssueSeverity, string> = {
    high: "border-red-200 bg-red-50 text-red-700",
    medium: "border-amber-200 bg-amber-50 text-amber-700",
    low: "border-blue-200 bg-blue-50 text-blue-700",
  };

  return (
    <article className="overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50/60">
      <div className="flex flex-col gap-4 border-b border-zinc-200 bg-white p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-950 text-xs font-bold text-white">
            {String(index + 1).padStart(2, "0")}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600">
                {formatSectionName(issue.sectionKey)}
              </span>

              <span className="text-zinc-300">•</span>

              <span className="font-mono text-[11px] text-zinc-400">
                {issue.id}
              </span>
            </div>

            <h3 className="mt-1.5 text-lg font-bold tracking-tight text-zinc-950">
              {issue.title}
            </h3>
          </div>
        </div>

        <span
          className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-bold capitalize ${severityClasses[issue.severity]}`}
        >
          {issue.severity} priority
        </span>
      </div>

      <div className="grid gap-5 p-5 lg:grid-cols-3">
        <IssueDetail
          label="Problem"
          text={issue.problem}
          className="text-zinc-700"
        />

        <IssueDetail
          label={formatEvidenceKind(issue.evidenceKind)}
          text={issue.evidence}
          className={
            issue.evidenceKind === "cv_text"
              ? "font-mono text-[13px] text-zinc-700"
              : "text-zinc-700"
          }
        />

        <IssueDetail
          label="Recommended Fix"
          text={issue.recommendation}
          className="text-zinc-700"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 bg-white px-5 py-3.5">
        <span className="text-xs font-medium text-zinc-400">
          Category: {issue.category}
        </span>

        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            issue.fixMode === "user_confirmation"
              ? "bg-amber-50 text-amber-700"
              : "bg-emerald-50 text-emerald-700"
          }`}
        >
          {formatFixMode(issue.fixMode)}
        </span>
      </div>
    </article>
  );
}

function IssueDetail({
  label,
  text,
  className,
}: {
  label: string;
  text: string;
  className: string;
}) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-400">
        {label}
      </p>

      <p className={`mt-2 whitespace-pre-wrap text-sm leading-6 ${className}`}>
        {text}
      </p>
    </div>
  );
}

function AnalysisCard({
  title,
  items,
  type,
}: {
  title: string;
  items: string[];
  type: "positive" | "negative";
}) {
  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold ${
            type === "positive"
              ? "bg-emerald-50 text-emerald-600"
              : "bg-red-50 text-red-600"
          }`}
        >
          {type === "positive" ? "✓" : "!"}
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-400">
            CV Review
          </p>

          <h2 className="mt-0.5 text-xl font-bold tracking-tight text-zinc-950">
            {title}
          </h2>
        </div>
      </div>

      <div className="mt-7 space-y-4">
        {items.map((item, index) => (
          <div
            key={`${item}-${index}`}
            className="flex gap-3 border-b border-zinc-100 pb-4 last:border-0 last:pb-0"
          >
            <span
              className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                type === "positive"
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-red-50 text-red-600"
              }`}
            >
              {type === "positive" ? "✓" : "!"}
            </span>

            <p className="text-sm leading-6 text-zinc-600">{item}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SkillCard({
  title,
  description,
  items,
  variant,
}: {
  title: string;
  description: string;
  items: string[];
  variant: "default" | "blue";
}) {
  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
        {title}
      </p>

      <p className="mt-2 text-sm text-zinc-500">{description}</p>

      <div className="mt-6 flex flex-wrap gap-2.5">
        {items.length > 0 ? (
          items.map((item, index) => (
            <span
              key={`${item}-${index}`}
              className={
                variant === "blue"
                  ? "rounded-xl border border-blue-100 bg-blue-50 px-3.5 py-2 text-sm font-medium text-blue-700"
                  : "rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-sm font-medium text-zinc-700"
              }
            >
              {item}
            </span>
          ))
        ) : (
          <p className="text-sm text-zinc-500">
            No clear skills were identified.
          </p>
        )}
      </div>
    </div>
  );
}

function Assessment({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="border-l-2 border-zinc-200 pl-5">
      <h3 className="font-semibold text-zinc-950">{title}</h3>

      <p className="mt-3 text-sm leading-7 text-zinc-600">{text}</p>
    </div>
  );
}

function ScoreItem({
  title,
  score,
  max,
}: {
  title: string;
  score: number;
  max: number;
}) {
  const percentage = Math.round((score / max) * 100);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-5">
      <div className="flex items-start justify-between gap-4">
        <h3 className="max-w-[180px] text-sm font-semibold leading-5 text-zinc-900">
          {title}
        </h3>

        <span className="shrink-0 text-sm font-bold text-zinc-900">
          {score}
          <span className="font-medium text-zinc-400">/{max}</span>
        </span>
      </div>

      <div className="mt-5 h-2 overflow-hidden rounded-full bg-zinc-200">
        <div
          className="h-full rounded-full bg-blue-600 transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <p className="mt-2 text-xs font-medium text-zinc-400">
        {percentage}% of available points
      </p>
    </div>
  );
}

function FixFeature({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-white px-4 py-3">
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-600">
        ✓
      </div>

      <span className="text-sm font-medium text-zinc-700">{text}</span>
    </div>
  );
}