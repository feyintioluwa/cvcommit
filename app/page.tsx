import Link from "next/link";

const steps = [
  {
    number: "01",
    title: "Create your account",
    description:
      "Create your CVCommit account so your CV analysis and unlock access can be managed securely.",
  },
  {
    number: "02",
    title: "Upload your CV",
    description:
      "Upload your existing CV and let CVCommit review your experience, skills, structure, and ATS readiness.",
  },
  {
    number: "03",
    title: "Improve and commit",
    description:
      "See what needs work, unlock AI-powered improvements, and prepare a stronger version of your CV.",
  },
];

const features = [
  ["CV Score", "Understand how strong your CV is at a glance."],
  ["Skill Gaps", "Identify important skills and strengths that may be missing."],
  ["Career Fit", "See how your experience can align with suitable roles."],
  [
    "AI Improvements",
    "Get specific recommendations and rewrites instead of generic advice.",
  ],
  [
    "ATS Readiness",
    "Find issues that could hurt your CV during automated screening.",
  ],
  [
    "Improved CV",
    "Apply selected improvements while keeping your original CV untouched.",
  ],
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-white text-zinc-950">
      <style>{`
        @keyframes cv-fade-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes cv-float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-9px) rotate(-0.25deg); }
        }

        @keyframes cv-glow {
          0%, 100% { transform: scale(1); opacity: .5; }
          50% { transform: scale(1.08); opacity: .85; }
        }

        @keyframes cv-ring {
          from { stroke-dashoffset: 251.2; }
          to { stroke-dashoffset: 45.2; }
        }

        @keyframes cv-bar {
          from { width: 0%; }
        }

        @keyframes cv-shine {
          0% { transform: translateX(-160%) skewX(-18deg); }
          55%, 100% { transform: translateX(300%) skewX(-18deg); }
        }

        .cv-enter {
          opacity: 0;
          animation: cv-fade-up 700ms cubic-bezier(.2,.75,.25,1) forwards;
        }

        .cv-delay-1 { animation-delay: 90ms; }
        .cv-delay-2 { animation-delay: 180ms; }
        .cv-delay-3 { animation-delay: 270ms; }
        .cv-delay-4 { animation-delay: 370ms; }
        .cv-delay-5 { animation-delay: 480ms; }

        .cv-preview {
          animation: cv-float 6s ease-in-out infinite;
          transform-origin: center;
        }

        .cv-soft-glow {
          animation: cv-glow 5s ease-in-out infinite;
        }

        .cv-score-ring {
          stroke-dasharray: 251.2;
          stroke-dashoffset: 251.2;
          animation: cv-ring 1.4s cubic-bezier(.2,.75,.25,1) 700ms forwards;
        }

        .cv-progress {
          animation: cv-bar 1.2s cubic-bezier(.2,.75,.25,1) 850ms both;
        }

        .cv-shine {
          position: relative;
          overflow: hidden;
        }

        .cv-shine::after {
          content: "";
          position: absolute;
          inset: -40% auto -40% -35%;
          width: 28%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255,255,255,.24),
            transparent
          );
          animation: cv-shine 3.8s ease-in-out 1.5s infinite;
          pointer-events: none;
        }

        .cv-card {
          transition:
            transform 260ms ease,
            box-shadow 260ms ease,
            border-color 260ms ease;
        }

        .cv-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 18px 45px rgba(24,24,27,.08);
          border-color: rgb(191 219 254);
        }

        @media (prefers-reduced-motion: reduce) {
          .cv-enter,
          .cv-preview,
          .cv-soft-glow,
          .cv-score-ring,
          .cv-progress,
          .cv-shine::after {
            animation: none !important;
          }

          .cv-enter { opacity: 1 !important; }
          .cv-score-ring { stroke-dashoffset: 45.2; }

          .cv-card,
          .cv-card:hover {
            transform: none;
          }
        }
      `}</style>

      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-8">
        <div className="cv-enter text-2xl font-bold tracking-tight">
          CV<span className="text-blue-600">Commit</span>
        </div>

        <div className="hidden items-center gap-8 text-sm font-medium text-zinc-600 md:flex">
          <a
            href="#how-it-works"
            className="transition hover:text-zinc-950"
          >
            How it works
          </a>
          <a
            href="#features"
            className="transition hover:text-zinc-950"
          >
            Features
          </a>
        </div>

        <div className="cv-enter cv-delay-1 flex items-center gap-3">
          <Link
            href="/login"
            className="hidden rounded-full px-5 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 sm:inline-flex"
          >
            Log in
          </Link>

          <Link
            href="/signup"
            className="rounded-full bg-zinc-950 px-6 py-3 text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-zinc-800 hover:shadow-lg"
          >
            Get Started
          </Link>
        </div>
      </nav>

      <section className="relative mx-auto max-w-7xl px-6 pb-24 pt-20 lg:px-8 lg:pb-32 lg:pt-28">
        <div
          aria-hidden="true"
          className="cv-soft-glow pointer-events-none absolute left-1/2 top-24 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-100/70 blur-3xl sm:h-96 sm:w-96"
        />

        <div className="mx-auto max-w-4xl text-center">
          <div className="cv-enter mb-6 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-600" />
            </span>
            AI-powered CV intelligence
          </div>

          <h1 className="cv-enter cv-delay-1 text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            Check it. Fix it.
            <span className="text-blue-600"> Commit.</span>
          </h1>

          <p className="cv-enter cv-delay-2 mx-auto mt-6 max-w-2xl text-lg leading-8 text-zinc-600 sm:text-xl">
            Upload your CV and let CVCommit analyze your experience, skills,
            strengths, weaknesses, ATS readiness, and opportunities for
            improvement.
          </p>

          <div className="cv-enter cv-delay-3 mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/signup"
              className="cv-shine w-full rounded-full bg-zinc-950 px-7 py-3.5 text-center text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-zinc-800 hover:shadow-xl sm:w-auto"
            >
              Check My CV Free
            </Link>

            <Link
              href="/login"
              className="w-full rounded-full border border-zinc-200 bg-white px-7 py-3.5 text-center text-sm font-semibold text-zinc-700 transition duration-200 hover:-translate-y-0.5 hover:border-zinc-300 hover:bg-zinc-50 sm:w-auto"
            >
              I Already Have an Account
            </Link>
          </div>

          <p className="cv-enter cv-delay-4 mt-4 text-sm text-zinc-500">
            Free CV analysis. Unlock advanced improvements when you are ready.
          </p>
        </div>

        <div className="cv-enter cv-delay-5 mx-auto mt-20 max-w-5xl">
          <div className="cv-preview relative">
            <div
              aria-hidden="true"
              className="absolute inset-x-16 -bottom-7 h-16 rounded-full bg-zinc-300/50 blur-2xl"
            />

            <div className="relative rounded-3xl border border-zinc-200 bg-zinc-50 p-3 shadow-2xl shadow-zinc-200/60">
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-6">
                  <div>
                    <p className="text-sm font-medium text-zinc-500">
                      CV Analysis
                    </p>
                    <h2 className="mt-1 text-xl font-semibold">
                      Your CV Report
                    </h2>
                  </div>

                  <div className="relative h-20 w-20">
                    <svg
                      viewBox="0 0 96 96"
                      className="-rotate-90 h-20 w-20"
                      aria-hidden="true"
                    >
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="7"
                        className="text-blue-100"
                      />
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="7"
                        strokeLinecap="round"
                        className="cv-score-ring text-blue-600"
                      />
                    </svg>

                    <div className="absolute inset-0 flex items-center justify-center text-lg font-bold text-blue-600">
                      82
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  <div className="cv-card rounded-2xl border border-transparent bg-zinc-50 p-5">
                    <p className="text-sm text-zinc-500">CV Score</p>
                    <p className="mt-2 text-2xl font-bold">82/100</p>
                    <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-zinc-200">
                      <div className="cv-progress h-full w-[82%] rounded-full bg-blue-600" />
                    </div>
                  </div>

                  <div className="cv-card rounded-2xl border border-transparent bg-zinc-50 p-5">
                    <p className="text-sm text-zinc-500">Skills Found</p>
                    <p className="mt-2 text-2xl font-bold">14</p>
                    <div className="mt-4 flex gap-1.5">
                      {[0, 1, 2, 3, 4].map((item) => (
                        <span
                          key={item}
                          className="h-1.5 flex-1 rounded-full bg-blue-600/80"
                        />
                      ))}
                    </div>
                  </div>

                  <div className="cv-card rounded-2xl border border-transparent bg-zinc-50 p-5">
                    <p className="text-sm text-zinc-500">ATS Readiness</p>
                    <p className="mt-2 text-2xl font-bold">91%</p>
                    <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-zinc-200">
                      <div className="cv-progress h-full w-[91%] rounded-full bg-blue-600" />
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                      Strength detected
                    </p>
                    <p className="mt-2 text-sm font-medium text-zinc-800">
                      Clear technical skill coverage
                    </p>
                  </div>

                  <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                      Improvement found
                    </p>
                    <p className="mt-2 text-sm font-medium text-zinc-800">
                      Add stronger measurable outcomes
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="how-it-works"
        className="border-t border-zinc-100 bg-zinc-50"
      >
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
              How it works
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              From uploaded CV to a stronger application in minutes.
            </h2>

            <p className="mt-4 text-zinc-600">
              CVCommit helps you understand what is working, what needs
              improvement, and what to change before you apply.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {steps.map((step) => (
              <div
                key={step.number}
                className="cv-card group rounded-3xl border border-zinc-200 bg-white p-7"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-600 transition duration-200 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white">
                  {step.number}
                </span>

                <h3 className="mt-6 text-xl font-semibold">
                  {step.title}
                </h3>

                <p className="mt-3 leading-7 text-zinc-600">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="features"
        className="mx-auto max-w-7xl px-6 py-24 lg:px-8"
      >
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
            Built for better applications
          </p>

          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            More than a CV checker.
          </h2>

          <p className="mt-4 text-zinc-600">
            CVCommit helps you understand your CV, improve weak areas, and
            prepare a stronger version for your next application.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map(([title, description], index) => (
            <div
              key={title}
              className="cv-card group rounded-3xl border border-zinc-200 p-7"
            >
              <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-sm font-bold text-blue-600 transition duration-200 group-hover:rotate-3 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white">
                {String(index + 1).padStart(2, "0")}
              </div>

              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="mt-3 leading-7 text-zinc-600">
                {description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 pb-24 lg:px-8">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl bg-zinc-950 px-6 py-16 text-center text-white sm:px-12">
          <div
            aria-hidden="true"
            className="cv-soft-glow absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-600/20 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="cv-soft-glow absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl"
          />

          <div className="relative">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Your next application deserves
              <br />
              a stronger CV.
            </h2>

            <p className="mx-auto mt-5 max-w-xl text-zinc-400">
              Check your CV for free, understand what needs improvement, and
              commit when you are ready.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="cv-shine inline-block rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-zinc-950 transition duration-200 hover:-translate-y-0.5 hover:bg-zinc-200"
              >
                Check My CV Free
              </Link>

              <Link
                href="/login"
                className="inline-block rounded-full border border-zinc-700 px-7 py-3.5 text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:border-zinc-600 hover:bg-zinc-900"
              >
                Log In
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-zinc-100">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-8 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <p>
            © 2026 CV<span className="text-blue-600">Commit</span>
          </p>
          <p>A product by Tioluwa Designs.</p>
        </div>
      </footer>
    </main>
  );
}