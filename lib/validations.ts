/**
 * Shared form validation schemas using Zod.
 * These schemas provide consistent validation across the application.
 */
import { z } from "zod";

// --- User/Profile Schemas ---
export const userProfileSchema = z.object({
  displayName: z.string().min(2, "Name must be at least 2 characters").max(150, "Name too long"),
  email: z.string().email("Invalid email address"),
  bio: z.string().max(5000, "Bio too long").optional(),
  location: z.string().max(200, "Location too long").optional(),
  headline: z.string().max(200, "Headline too long").optional(),
  skills: z.array(z.string().min(1).max(50)).max(50, "Maximum 50 skills").optional(),
  portfolioUrl: z.string().url("Invalid URL").or(z.literal("")).optional(),
  linkedInUrl: z.string().url("Invalid URL").or(z.literal("")).optional(),
  githubUrl: z.string().url("Invalid URL").or(z.literal("")).optional(),
});

export const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(150, "Name too long"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters").max(100, "Password too long"),
  role: z.enum(["volunteer", "organizer"], { message: "Please select a role" }),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// --- Event Schemas ---
export const eventSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(150, "Title too long"),
  description: z.string().min(10, "Description must be at least 10 characters").max(5000, "Description too long"),
  role_needed: z.string().min(2, "Role is required").max(100, "Role too long"),
  location: z.string().min(2, "Location is required").max(150, "Location too long"),
  date: z.string().min(1, "Date is required").max(100, "Date too long"),
  skills: z.array(z.string().min(1).max(50)).max(20, "Maximum 20 skills"),
  volunteers_needed: z.number().int().min(1, "At least 1 volunteer needed").max(500, "Maximum 500 volunteers"),
});

// --- Review Schema ---
export const reviewSchema = z.object({
  rating: z.number().int().min(1, "Rating must be 1-5").max(5, "Rating must be 1-5"),
  comment: z.string().max(2000, "Comment too long").optional(),
});

// --- Skill Schema ---
export const skillSchema = z.string()
  .min(1, "Skill cannot be empty")
  .max(50, "Skill name too long")
  .regex(/^[a-zA-Z0-9\s\-\+\#\.]+$/, "Invalid characters in skill name");

export const skillsArraySchema = z.array(skillSchema).max(50, "Maximum 50 skills");

// --- Application Schema ---
export const applicationSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
});

export const statusUpdateSchema = z.object({
  status: z.enum(["ACCEPTED", "REJECTED"], { message: "Status must be ACCEPTED or REJECTED" }),
});

// --- Type exports ---
export type UserProfile = z.infer<typeof userProfileSchema>;
export type SignupData = z.infer<typeof signupSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type EventData = z.infer<typeof eventSchema>;
export type ReviewData = z.infer<typeof reviewSchema>;
export type ApplicationData = z.infer<typeof applicationSchema>;
export type StatusUpdateData = z.infer<typeof statusUpdateSchema>;

// --- Validation helper ---
export function validateForm<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const path = issue.path.join(".");
    if (!errors[path]) {
      errors[path] = issue.message;
    }
  }
  return { success: false, errors };
}
