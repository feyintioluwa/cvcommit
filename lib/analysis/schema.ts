import { z } from "zod";

export const scoreBreakdownSchema = z.object({
  contentExperience: z.number().int().min(0).max(25),
  skillsRelevance: z.number().int().min(0).max(20),
  professionalPositioning: z.number().int().min(0).max(20),
  atsReadiness: z.number().int().min(0).max(15),
  education: z.number().int().min(0).max(10),
  cvStructure: z.number().int().min(0).max(10),
});

export const analysisSchema = z.object({
  overallScore: z.number().int().min(0).max(100),

  scoreBreakdown: scoreBreakdownSchema,

  summary: z.string(),

  strengths: z.array(z.string()),

  weaknesses: z.array(z.string()),

  skills: z.array(z.string()),

  recommendedSkills: z.array(z.string()),

  experienceAssessment: z.string(),

  educationAssessment: z.string(),

  atsAssessment: z.string(),

  improvements: z.array(z.string()),

  recommendedRoles: z.array(z.string()),
});

export type AnalysisResult = z.infer<typeof analysisSchema>;