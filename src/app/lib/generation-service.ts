
'use client';

import { Firestore, collection, doc, setDoc, addDoc, serverTimestamp, getDocs, query, where, writeBatch, updateDoc, increment, runTransaction } from 'firebase/firestore';
import { generateSkeletons, PageSkeleton } from './templates';
import { generateBatchContent } from '@/ai/flows/generate-feed-pages';
import { validatePageContent } from './quality-validator';

const AI_CALL_CAP = 10; // Batch generation cap
const REPAIR_DAILY_CAP = 5; // Individual repair cap per day

/**
 * Service to handle cost-optimized page generation with strict credit governance.
 */
export async function runGeneration(db: Firestore, project: any, requestedCount: number, onProgress: (p: number) => void) {
  const brandMemory = project.brandMemory;
  const ownerUid = project.ownerUid;
  const projectId = project.id;

  if (!ownerUid) {
    throw new Error("Project owner identity missing. Cannot generate pages.");
  }

  const currentHash = JSON.stringify(brandMemory).split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0).toString();

  const runRef = await addDoc(collection(db, 'projects', projectId, 'generationRuns'), {
    projectId,
    ownerUid,
    timestamp: serverTimestamp(),
    status: 'started',
    requestedCount,
    aiCalls: 0,
    tokensUsed: 0,
    brandMemoryHash: currentHash
  });

  try {
    onProgress(10);
    const allSkeletons = generateSkeletons(brandMemory, requestedCount);
    
    const existingPagesSnap = await getDocs(query(collection(db, 'projects', projectId, 'pages'), where('brandMemoryHash', '==', currentHash)));
    const existingSlugs = new Set(existingPagesSnap.docs.map(d => d.data().slug));
    
    const skeletonsToProcess = allSkeletons.filter(s => !existingSlugs.has(s.slug));
    const skippedCount = allSkeletons.length - skeletonsToProcess.length;

    if (skeletonsToProcess.length === 0) {
      await setDoc(runRef, { status: 'completed', generatedCount: 0, skippedCount, aiCalls: 0 }, { merge: true });
      onProgress(100);
      return;
    }

    const BATCH_SIZE = 10;
    const results = [];
    let aiCallCount = 0;

    for (let i = 0; i < skeletonsToProcess.length; i += BATCH_SIZE) {
      if (aiCallCount >= AI_CALL_CAP) {
        await setDoc(runRef, { status: 'aborted', abortReason: 'AI Call Cap Reached' }, { merge: true });
        break;
      }

      const batchSkeletons = skeletonsToProcess.slice(i, i + BATCH_SIZE);
      aiCallCount++;
      
      const contentBatch = await generateBatchContent(brandMemory, batchSkeletons);
      results.push(...contentBatch);
      
      onProgress(10 + Math.floor((results.length / skeletonsToProcess.length) * 80));
    }

    onProgress(95);
    const firestoreBatch = writeBatch(db);
    let totalGenerated = 0;
    
    for (const res of results) {
      const skeleton = skeletonsToProcess.find(s => s.slug === res.slug)!;
      const pageId = skeleton.slug;
      const pageRef = doc(db, 'projects', projectId, 'pages', pageId);
      
      const quality = validatePageContent(res);
      
      firestoreBatch.set(pageRef, {
        projectId,
        ownerUid,
        slug: skeleton.slug,
        type: skeleton.type,
        seoTitle: skeleton.seoTitle,
        metaDescription: skeleton.metaDescription,
        h1: skeleton.h1,
        // AI-optimized fields
        summary: res.summary || '',
        quickAnswer: res.quickAnswer || '',
        keyQuestions: res.keyQuestions || [],
        sections: res.sections,
        faqs: res.faqs,
        internalLinks: skeleton.internalLinks || [],
        createdAt: serverTimestamp(),
        brandMemoryHash: currentHash,
        contentScore: quality.score,
        validationErrors: quality.issues,
        version: 1,
        isStale: false,
        isPublic: true 
      });
      totalGenerated++;
    }

    await firestoreBatch.commit();

    const projectRef = doc(db, 'projects', projectId);
    await setDoc(projectRef, { 
      lastGenerationHash: currentHash,
      "aiUsage.lastRunCalls": aiCallCount,
      "aiUsage.totalCalls": increment(aiCallCount)
    }, { merge: true });

    await setDoc(runRef, {
      status: 'completed',
      generatedCount: totalGenerated,
      skippedCount,
      aiCalls: aiCallCount,
      completedAt: serverTimestamp()
    }, { merge: true });

    onProgress(100);
  } catch (e: any) {
    console.error("Generation failed:", e);
    await setDoc(runRef, {
      status: 'failed',
      errors: [e.message || "Unknown error"]
    }, { merge: true });
    throw e;
  }
}

/**
 * Checks budget and logs individual AI usage for repairs using atomic transaction.
 */
export async function checkAndLogRepairBudget(db: Firestore, project: any, actionType: string, pageSlug: string) {
  const projectRef = doc(db, 'projects', project.id);
  const ownerUid = project.ownerUid;
  const today = new Date().toISOString().split('T')[0];

  // Use transaction to atomically check and update budget
  await runTransaction(db, async (transaction) => {
    const projectSnap = await transaction.get(projectRef);
    
    if (!projectSnap.exists()) {
      throw new Error("Project not found");
    }
    
    const projectData = projectSnap.data();
    const usage = projectData.aiUsage || {};
    const lastRepairDate = usage.lastRepairDate;
    const dailyRepairCount = usage.dailyRepairCount || 0;

    // Check budget atomically within transaction
    if (lastRepairDate === today && dailyRepairCount >= REPAIR_DAILY_CAP) {
      throw new Error(`Daily AI repair limit (${REPAIR_DAILY_CAP}) reached for this project.`);
    }

    // Log usage
    const usageLogRef = addDoc(collection(db, 'projects', project.id, 'aiUsageLogs'), {
      projectId: project.id,
      ownerUid,
      actionType,
      pageSlug,
      tokensEstimated: 500, // Static estimate for UX
      createdAt: serverTimestamp()
    });

    // Update project counters atomically
    const updates: any = {
      "aiUsage.totalCalls": increment(1),
      "aiUsage.lastRepairDate": today
    };
    
    // Only increment dailyRepairCount if it's today
    if (lastRepairDate === today) {
      updates["aiUsage.dailyRepairCount"] = increment(1);
    } else {
      // First repair of the day - reset counter to 1
      updates["aiUsage.dailyRepairCount"] = 1;
    }
    
    transaction.update(projectRef, updates);
  });
}
