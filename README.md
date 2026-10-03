# CVCommit

### AI-Powered CV Analysis & Career Improvement Platform

CVCommit is a full-stack web application that uses AI to analyze CVs and provide structured feedback on strengths, weaknesses, skills, career positioning, and areas for improvement.

It allows users to upload their CV, processes the document, analyzes its content using AI, and presents the results through an interactive dashboard designed to help users understand and improve their CV.

---

## Key Features

* **CV Upload** — Upload CVs in PDF or DOCX format with file type and size validation.
* **Document Processing** — Extracts text from uploaded CVs for analysis.
* **AI-Powered Analysis** — Uses the Gemini API to analyze CV content and generate structured feedback.
* **CV Scoring** — Evaluates key areas including content and experience, skills relevance, professional positioning, ATS readiness, education, and CV structure.
* **CV Fix** — Provides targeted suggestions and improvements to help users strengthen weak areas identified during analysis.
* **Actionable Recommendations** — Identifies strengths, weaknesses, missing skills, and areas where the CV can be improved.
* **Results Dashboard** — Presents analysis results through a structured and easy-to-understand interface.
* **Secure Server-Side Processing** — Handles AI requests and sensitive API credentials on the server side.
* **Error Handling** — Provides user-friendly handling for API failures and service limitations.
* **Responsive Design** — Designed to work across desktop and mobile devices.

---

## Tech Stack

### Frontend

* **Next.js** — Full-stack React framework and application routing
* **React** — Component-based user interface
* **TypeScript** — Type-safe application development
* **Tailwind CSS** — Responsive and utility-first styling

### Backend

* **Next.js API Routes** — Server-side API endpoints and application logic
* **Node.js** — Server-side JavaScript runtime
* **REST APIs** — Application and third-party service communication

### Database & Authentication

* **Supabase** — Database and authentication services

### AI & Document Processing

* **Google Gemini API** — AI-powered CV analysis and recommendations
* **PDF/DOCX Processing** — CV text extraction and document handling

### Deployment & Development

* **Vercel** — Application deployment and hosting
* **Git & GitHub** — Version control and source-code management

---

## How It Works

CVCommit follows a structured pipeline to transform an uploaded CV into actionable feedback:

1. **Upload CV**
   The user uploads a CV in PDF or DOCX format.

2. **Validate & Process**
   The application validates the file type and size, then extracts the CV's text content.

3. **AI Analysis**
   The extracted content is sent through a server-side analysis workflow using the Gemini API.

4. **CV Evaluation**
   The system evaluates the CV across multiple areas, including:

   * Content & Experience
   * Skills Relevance
   * Professional Positioning
   * ATS Readiness
   * Education
   * CV Structure

5. **Score Generation**
   Individual category scores are processed into an overall CV score.

6. **Insights & Recommendations**
   CVCommit identifies strengths, weaknesses, missing skills, and areas that require improvement.

7. **CV Fix**
   Users receive targeted suggestions for improving identified weaknesses and strengthening their CV.

8. **Results Dashboard**
   The final analysis is presented through an interactive dashboard where users can review their score, breakdown, and recommendations.

---

## Screenshots

Screenshots of the application interface will be added here, including:

* Landing page
* CV upload interface
* AI analysis workflow
* Results dashboard
* CV Fix recommendations

---

## Getting Started

### Prerequisites

Before running CVCommit locally, make sure you have:

* Node.js 18+
* npm
* Git
* A Gemini API key
* A Supabase project

### Installation

1. Clone the repository:

```bash
git clone https://github.com/feyintioluwa/cvcommit.git
```

2. Navigate into the project:

```bash
cd cvcommit
```

3. Install dependencies:

```bash
npm install
```

4. Create a `.env.local` file in the project root and add the required environment variables.

5. Start the development server:

```bash
npm run dev
```

6. Open the application in your browser:

```text
http://localhost:3000
```

---

## Environment Variables

Create a `.env.local` file in the root directory and add the following environment variables:

```env
GEMINI_API_KEY=your_gemini_api_key

NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```

### Notes

* Keep `.env.local` private and never commit it to GitHub.
* Replace the placeholder values with credentials from your own Gemini and Supabase projects.
* Environment variables are used to keep API credentials and service configuration separate from the source code.

---

## Live Demo & Repository

* **Live Demo:** [CVCommit Live URL]
* **GitHub Repository:** https://github.com/feyintioluwa/cvcommit

---

## Project Status

CVCommit is an actively developed project. The current version provides CV upload, document processing, AI-powered analysis, scoring, actionable recommendations, and CV improvement guidance.

Future improvements may include additional career-focused features, expanded analysis capabilities, and further improvements to the user experience.
