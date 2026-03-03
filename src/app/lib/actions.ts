'use server';

import { db, Project } from "./db";
import { suggestBrandMemory, SuggestBrandMemoryInput } from "@/ai/flows/suggest-brand-memory-flow";
import { generateFeedPages, GenerateFeedPagesInput } from "@/ai/flows/generate-feed-pages";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createProjectAction(formData: FormData) {
  const name = formData.get('name') as string;
  const website = formData.get('website') as string;
  const niche = formData.get('niche') as string;

  if (!name || !website || !niche) throw new Error("Missing fields");

  const project = await db.createProject({ name, website, niche });
  
  revalidatePath('/');
  redirect(`/projects/${project.id}`);
}

export async function suggestMemoryAction(projectId: string) {
  const project = await db.getProjectById(projectId);
  if (!project) throw new Error("Project not found");

  const input: SuggestBrandMemoryInput = {
    businessName: project.name,
    website: project.website,
    niche: project.niche,
  };

  const suggested = await suggestBrandMemory(input);
  await db.updateProject(projectId, { brandMemory: suggested });
  
  revalidatePath(`/projects/${projectId}`);
  return suggested;
}

export async function updateBrandMemoryAction(projectId: string, brandMemory: any) {
  await db.updateProject(projectId, { brandMemory });
  revalidatePath(`/projects/${projectId}`);
}

export async function generateFeedAction(projectId: string) {
  const project = await db.getProjectById(projectId);
  if (!project || !project.brandMemory) throw new Error("Missing project or brand memory");

  const input: GenerateFeedPagesInput = {
    projectName: project.name,
    website: project.website,
    niche: project.niche,
    brandMemory: project.brandMemory,
  };

  const pages = await generateFeedPages(input);
  await db.updateProject(projectId, { pages });
  
  revalidatePath(`/projects/${projectId}`);
  return pages;
}

export async function deleteProjectAction(projectId: string) {
  await db.deleteProject(projectId);
  revalidatePath('/');
  redirect('/');
}
