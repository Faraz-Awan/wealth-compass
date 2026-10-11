import { z } from "zod";

export const calculatorSchema = z.object({
  currentAge: z.coerce.number().int("Use a whole number").min(18).max(99),
  retirementAge: z.coerce.number().int("Use a whole number").min(19).max(100),
  currentSavings: z.coerce.number().min(0).max(100_000_000),
  annualContribution: z.coerce.number().min(0).max(1_000_000),
  returnRate: z.coerce.number().min(-20, "Use a rate of -20% or higher").max(20, "Use a rate of 20% or lower"),
  inflationRate: z.coerce.number().min(0, "Inflation cannot be negative").max(20, "Use inflation of 20% or lower"),
  increaseType: z.enum(["percent", "amount"]),
  increaseValue: z.coerce.number().min(0, "Increase cannot be negative"),
  contributionTiming: z.enum(["start", "end"]),
}).refine(values => values.retirementAge > values.currentAge, {
  message: "Retirement age must be after current age",
  path: ["retirementAge"],
}).refine(values => values.increaseType !== "percent" || values.increaseValue <= 50, {
  message: "Increase cannot be more than 50%",
  path: ["increaseValue"],
}).refine(values => values.increaseType !== "amount" || values.increaseValue <= values.annualContribution, {
  message: "Increase cannot exceed the initial annual contribution",
  path: ["increaseValue"],
});

export type FormValues = z.infer<typeof calculatorSchema>;
