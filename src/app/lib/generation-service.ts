
'use client';

import { Firestore, collection, doc, setDoc, addDoc, serverTimestamp, getDocs, query, where, writeBatch } from 'firebase/firestore';
import { generateSkeletons, PageSkeleton } from './templates';
import { generateBatchContent } from '@/ai/flows/generate-feed-pages';
import { validatePageContent } from './quality-validator';

const AI_CALL_CAP = 10; // Hard limit per run to protect budget

/**
 * Service to handle cost-optimized page generation with strict credit governance.
 */
export async function runGeneration(db: Firestore, project: any, requestedCount: number, onProgress: (p: number) => void) {
  const brandMemory = project.brandMemory;
  const ownerId = project.ownerId;
  const projectId = project.id;

  // 1. Idempotency Check: Get existing brand memory hash
  const currentHash = JSON.stringify(brandMemory).split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0).toString();

  // 2. Create Generation Run Log
  const runRef = await addDoc(collection(db, 'projects', projectId, 'generationRuns'), {
    projectId,
    timestamp: serverTimestamp(),
    status: 'started',
    requestedCount,
    aiCalls: 0,
    tokensUsed: 0,
    brandMemoryHash: currentHash
  });

  try {
    // 3. Generate Deterministic Skeletons
    onProgress(10);
    const allSkeletons = generateSkeletons(brandMemory, requestedCount);
    
    // 4. Skip Idempotent Pages
    const existingPagesSnap = await getDocs(query(collection(db, 'projects', projectId, 'pages'), where('brandMemoryHash', '==', currentHash)));
    const existingSlugs = new Set(existingPagesSnap.docs.map(d => d.data().slug));
    
    const skeletonsToProcess = allSkeletons.filter(s => !existingSlugs.has(s.slug));
    const skippedCount = allSkeletons.length - skeletonsToProcess.length;

    if (skeletonsToProcess.length === 0) {
      await setDoc(runRef, { status: 'completed', generatedCount: 0, skippedCount, aiCalls: 0 }, { merge: true });
      onProgress(100);
      return;
    }

    // 5. Batch Process Skeletons (10 at a time)
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

    // 6. Validate & Save to Firestore in Batches
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
        ownerId,
        slug: skeleton.slug,
        type: skeleton.type,
        seoTitle: skeleton.seoTitle,
        metaDescription: skeleton.metaDescription,
        h1: skeleton.h1,
        sections: res.sections,
        faqs: res.faqs,
        internalLinks: skeleton.internalLinks || [],
        createdAt: serverTimestamp(),
        brandMemoryHash: currentHash,
        contentScore: quality.score,
        validationErrors: quality.errors,
        version: 1
      });
      totalGenerated++;
    }

    await firestoreBatch.commit();

    // 7. Update Project & Run Log
    const projectRef = doc(db, 'projects', projectId);
    await setDoc(projectRef, { 
      lastGenerationHash: currentHash,
      "aiUsage.lastRunCalls": aiCallCount,
      "aiUsage.totalCalls": (project.aiUsage?.totalCalls || 0) + aiCallCount
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
