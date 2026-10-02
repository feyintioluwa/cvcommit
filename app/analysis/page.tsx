"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const stages = [
  "Reading your CV",
  "Identifying your skills",
  "Evaluating your experience",
  "Checking ATS readiness",
  "Building your CV report",
];

type AnalyzeResponse = {
  success?: boolean;
  source?: string;
  analysis?: unknown;
  error?: string;
};

async function createCVHash(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);

  const hashBuffer = await crypto.subtle.digest("SHA-256", data);

  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function readJsonResponse(
  response: Response
): Promise<AnalyzeResponse> {
  const responseText = await response.text();

  if (!responseText.trim()) {
    throw new Error(
      "CVCommit received an empty response from the analysis server."
    );
  }

  try {
    return JSON.parse(responseText) as AnalyzeResponse;
  } catch {
    console.error(
      "CVCommit received a non-JSON response:",
      responseText.slice(0, 1500)
    );

    throw new Error(
      "The CVCommit analysis server returned an invalid response."
    );
  }
}

function clearPreviousCVWorkspace() {
  const keysToRemove = [
    "careerOSAnalysis",
    "careerOSAnalysisSource",
    "careerOSAnalysisHash",
    "careerOSFixes",
    "careerOSImprovedCV",
    "careerOSImprovedCVText",
  ];

  for (const key of keysToRemove) {
    sessionStorage.removeItem(key);
  }
}

export default function AnalysisPage() {
  const router = useRouter();

  const [currentStage, setCurrentStage] = useState(0);

  const analysisStarted = useRef(false);

  useEffect(() => {
    if (analysisStarted.current) {
      return;
    }

    analysisStarted.current = true;

    let stageTimer: ReturnType<typeof setInterval> | null = null;

    async function analyzeCV() {
      const extractedText = sessionStorage.getItem(
        "careerOSExtractedText"
      );

      const fileName =
        sessionStorage.getItem("careerOSFileName") || "";

      if (!extractedText) {
        router.replace("/upload");
        return;
      }

      try {
        /*
         * ---------------------------------------------------------
         * CREATE CV FINGERPRINT
         * ---------------------------------------------------------
         */

        const cvHash = await createCVHash(extractedText);

        const previousActiveHash = sessionStorage.getItem(
          "careerOSActiveCVHash"
        );

        /*
         * Defensive protection:
         *
         * If stale data survives from another CV,
         * clear that workspace before making this
         * CV the active one.
         */
        if (
          previousActiveHash &&
          previousActiveHash !== cvHash
        ) {
          console.warn(
            "CVCommit: Different CV detected. Clearing previous CV workspace."
          );

          clearPreviousCVWorkspace();
        }

        /*
         * This is now the active CV.
         *
         * Internal session-storage keys remain unchanged
         * during the customer-facing rebrand so existing
         * CV isolation behavior keeps working.
         */
        sessionStorage.setItem(
          "careerOSActiveCVHash",
          cvHash
        );

        const cacheKey = `careerOSAnalysis_${cvHash}`;
        const sourceCacheKey = `careerOSAnalysisSource_${cvHash}`;

        const cachedAnalysis =
          sessionStorage.getItem(cacheKey);

        const cachedSource =
          sessionStorage.getItem(sourceCacheKey);

        /*
         * ---------------------------------------------------------
         * CACHED ANALYSIS
         * ---------------------------------------------------------
         */

        if (cachedAnalysis) {
          console.log("CVCommit: Using cached analysis.", {
            cvHash,
          });

          sessionStorage.setItem(
            "careerOSAnalysis",
            cachedAnalysis
          );

          sessionStorage.setItem(
            "careerOSAnalysisSource",
            cachedSource || "cached"
          );

          /*
           * Tie the active analysis to this exact
           * CV fingerprint.
           */
          sessionStorage.setItem(
            "careerOSAnalysisHash",
            cvHash
          );

          sessionStorage.setItem(
            "careerOSFileName",
            fileName
          );

          /*
           * Keep original text because Fix My CV
           * requires it.
           */
          sessionStorage.setItem(
            "careerOSExtractedText",
            extractedText
          );

          router.replace("/results");
          return;
        }

        /*
         * ---------------------------------------------------------
         * VISUAL ANALYSIS PROGRESS
         * ---------------------------------------------------------
         */

        stageTimer = setInterval(() => {
          setCurrentStage((previous) => {
            if (previous >= stages.length - 1) {
              return previous;
            }

            return previous + 1;
          });
        }, 1800);

        /*
         * ---------------------------------------------------------
         * ANALYSIS API
         * ---------------------------------------------------------
         */

        const response = await fetch("/api/analyze", {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            extractedText,
          }),
        });

        if (stageTimer) {
          clearInterval(stageTimer);
          stageTimer = null;
        }

        const data = await readJsonResponse(response);

        if (!response.ok) {
          if (response.status === 429) {
            throw new Error(
              "CVCommit has temporarily reached its AI analysis limit. Please try again later."
            );
          }

          throw new Error(data.error || "Analysis failed.");
        }

        if (!data.analysis) {
          throw new Error(
            "CVCommit received an empty analysis."
          );
        }

        const source =
          typeof data.source === "string"
            ? data.source
            : "unknown";

        console.log(`CVCommit analysis source: ${source}`);

        /*
         * ---------------------------------------------------------
         * SAVE ACTIVE ANALYSIS
         * ---------------------------------------------------------
         */

        const analysisJSON = JSON.stringify(data.analysis);

        sessionStorage.setItem(
          "careerOSAnalysis",
          analysisJSON
        );

        sessionStorage.setItem(
          "careerOSAnalysisSource",
          source
        );

        sessionStorage.setItem(
          "careerOSAnalysisHash",
          cvHash
        );

        sessionStorage.setItem(
          "careerOSActiveCVHash",
          cvHash
        );

        sessionStorage.setItem(
          "careerOSFileName",
          fileName
        );

        /*
         * ---------------------------------------------------------
         * SAVE HASHED CACHE
         * ---------------------------------------------------------
         */

        sessionStorage.setItem(cacheKey, analysisJSON);

        sessionStorage.setItem(sourceCacheKey, source);

        /*
         * Keep the original CV text available
         * for Fix My CV.
         */
        sessionStorage.setItem(
          "careerOSExtractedText",
          extractedText
        );

        setCurrentStage(stages.length - 1);

        router.replace("/results");
      } catch (error) {
        if (stageTimer) {
          clearInterval(stageTimer);
          stageTimer = null;
        }

        console.error("CVCommit analysis error:", error);

        const message =
          error instanceof Error
            ? error.message
            : "We couldn't analyze your CV.";

        alert(message);

        /*
         * Keep extracted CV text so the user
         * can retry without uploading again
         * unnecessarily.
         */
        if (extractedText) {
          sessionStorage.setItem(
            "careerOSExtractedText",
            extractedText
          );
        }

        router.replace("/upload");
      }
    }

    void analyzeCV();

    return () => {
      if (stageTimer) {
        clearInterval(stageTimer);
        stageTimer = null;
      }
    };
  }, [router]);

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950">
      <nav className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center px-6 py-5 lg:px-8">
          <Link
            href="/"
            className="text-2xl font-bold tracking-tight"
          >
            CV<span className="text-blue-600">Commit</span>
          </Link>
        </div>
      </nav>

      <section className="flex min-h-[calc(100vh-81px)] items-center justify-center px-6">
        <div className="w-full max-w-xl text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-50">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
          </div>

          <p className="mt-8 text-sm font-semibold uppercase tracking-wider text-blue-600">
            CVCommit AI
          </p>

          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            Analyzing your CV
          </h1>

          <p className="mx-auto mt-5 max-w-lg text-base leading-7 text-zinc-500">
            We&apos;re reviewing your experience, skills, education,
            structure, and ATS readiness to build your personalized CV
            report.
          </p>

          <div className="mx-auto mt-10 max-w-md rounded-3xl border border-zinc-200 bg-white p-6 text-left shadow-sm">
            {stages.map((stage, index) => {
              const completed = index < currentStage;
              const active = index === currentStage;

              return (
                <div
                  key={stage}
                  className={`flex items-center gap-4 ${
                    index !== stages.length - 1 ? "pb-5" : ""
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                      completed
                        ? "bg-blue-600 text-white"
                        : active
                          ? "bg-blue-50 text-blue-600"
                          : "bg-zinc-100 text-zinc-400"
                    }`}
                  >
                    {completed ? (
                      "✓"
                    ) : active ? (
                      <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-blue-600" />
                    ) : (
                      <span className="h-2 w-2 rounded-full bg-zinc-300" />
                    )}
                  </div>

                  <span
                    className={`text-sm font-medium ${
                      completed || active
                        ? "text-zinc-800"
                        : "text-zinc-400"
                    }`}
                  >
                    {stage}
                  </span>
                </div>
              );
            })}
          </div>

          <p className="mt-6 text-xs text-zinc-400">
            This usually takes a few seconds.
          </p>

          <p className="mt-4 text-xs text-zinc-400">
            Check it. Fix it. Commit.
          </p>
        </div>
      </section>
    </main>
  );
}