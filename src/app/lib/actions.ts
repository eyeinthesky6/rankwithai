
'use server';

import { db } from "./db";
import { suggestBrandMemory, SuggestBrandMemoryInput } from "@/ai/flows/suggest-brand-memory-flow";
import { generateFeedPages, GenerateFeedPagesInput } from "@/ai/flows/generate-feed-pages";
import { refreshContent, RefreshContentInput } from "@/ai/flows/refresh-content-flow";
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
  await db.updateProject(projectId, { brandMemory: { ...suggested, companyName: project.name } });
  
  revalidatePath(`/projects/${projectId}`);
  return suggested;
}

export async function updateBrandMemoryAction(projectId: string, brandMemory: any) {
  await db.updateProject(projectId, { brandMemory });
  revalidatePath(`/projects/${projectId}`);
}

export async function generateFeedAction(projectId: string, count: number = 10) {
  const project = await db.getProjectById(projectId);
  if (!project || !project.brandMemory) throw new Error("Missing project or brand memory");

  const input: GenerateFeedPagesInput = {
    brandMemory: project.brandMemory as any,
    count,
  };

  const pages = await generateFeedPages(input);
  await db.updateProject(projectId, { pages });
  
  revalidatePath(`/projects/${projectId}`);
  return pages;
}

export async function processMetricsAction(projectId: string, metrics: any[]) {
  const project = await db.getProjectById(projectId);
  if (!project || !project.pages) throw new Error("Project or pages not found");

  const updatedPages = [...project.pages];
  const logs: any[] = [];

  for (const metric of metrics) {
    const pageIndex = updatedPages.findIndex(p => p.slug === metric.slug);
    if (pageIndex === -1) {
      // Rule 3: New query discovery -> could queue new page here
      // For MVP, we'll just log it
      continue;
    }

    const page = updatedPages[pageIndex];
    let needsRefresh = false;
    let refreshType: 'CTR' | 'RANK' = 'CTR';
    let reason = "";

    // Rule 1: CTR < 1% and impressions > 200 -> rewrite meta
    if (metric.ctr < 0.01 && metric.impressions > 200) {
      needsRefresh = true;
      refreshType = 'CTR';
      reason = `Low CTR (${(metric.ctr * 100).toFixed(2)}%) with high impressions.`;
    } 
    // Rule 2: Rank drop > 5 positions
    else if (metric.positionChange < -5) {
      needsRefresh = true;
      refreshType = 'RANK';
      reason = `Significant rank drop (${metric.positionChange} positions).`;
    }

    if (needsRefresh) {
      const input: RefreshContentInput = {
        currentTitle: page.seoTitle,
        currentMeta: page.metaDescription,
        currentFaqs: page.faqs || [],
        brandMemory: project.brandMemory,
        targetMetric: refreshType,
        queries: metric.queries,
      };

      const refreshResult = await refreshContent(input);

      // Versioning: Store original in history
      const version = {
        timestamp: new Date().toISOString(),
        seoTitle: page.seoTitle,
        metaDescription: page.metaDescription,
        faqs: page.faqs,
        reason,
      };

      const newHistory = [...(page.history || []), version];
      
      updatedPages[pageIndex] = {
        ...page,
        seoTitle: refreshResult.seoTitle || page.seoTitle,
        metaDescription: refreshResult.metaDescription || page.metaDescription,
        faqs: refreshResult.faqs || page.faqs,
        history: newHistory,
      };

      logs.push({
        id: Math.random().toString(36).substring(7),
        projectId,
        timestamp: new Date().toISOString(),
        pageSlug: page.slug,
        ruleTriggered: refreshType,
        metricValue: reason,
        actionTaken: refreshType === 'CTR' ? 'Meta Rewrite' : 'FAQ Refresh',
      });
    }
  }

  if (logs.length > 0) {
    await db.updateProject(projectId, { 
      pages: updatedPages,
      refreshLogs: [...(project.refreshLogs || []), ...logs]
    });
  }

  revalidatePath(`/projects/${projectId}`);
  return logs;
}

export async function deleteProjectAction(projectId: string) {
  await db.deleteProject(projectId);
  revalidatePath('/');
  redirect('/');
}
