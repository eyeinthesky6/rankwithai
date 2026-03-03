
'use client';

import { Firestore, collection, doc, setDoc, addDoc, serverTimestamp, getDocs, query, where, writeBatch } from 'firebase/firestore';
import { generateSkeletons, PageSkeleton } from './templates';
import { generateBatchContent } from '@/ai/flows/generate-feed-pages';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * Service to handle cost-optimized page generation.
 */
export async function runGeneration(db: Firestore, project: any, requestedCount: number, onProgress: (p: number) => void) {
  const brandMemory = project.brandMemory;
  const ownerId = project.ownerId;
  const projectId = project.id;

  // 1. Create Generation Run Log
  const runRef = await addDoc(collection(db, 'projects', projectId, 'generationRuns'), {
    projectId,
    timestamp: serverTimestamp(),
    status: 'started',
    requestedCount,
    aiCalls: 0,
    tokensUsed: 0,
    brandMemoryHash: project.lastGenerationHash || 'initial'
  });

  try {
    // 2. Generate Deterministic Skeletons
    onProgress(10);
    const skeletons = generateSkeletons(brandMemory, requestedCount);
    
    // 3. Batch Process Skeletons (10 at a time)
    const BATCH_SIZE = 10;
    const results = [];
    let aiCallCount = 0;

    for (let i = 0; i < skeletons.length; i += BATCH_SIZE) {
      const batchSkeletons = skeletons.slice(i, i + BATCH_SIZE);
      aiCallCount++;
      
      const contentBatch = await generateBatchContent(brandMemory, batchSkeletons);
      results.push(...contentBatch);
      
      onProgress(10 + Math.floor((results.length / skeletons.length) * 80));
    }

    // 4. Save to Firestore in Batches
    onProgress(95);
    const firestoreBatch = writeBatch(db);
    
    for (const res of results) {
      const skeleton = skeletons.find(s => s.slug === res.slug)!;
      const pageId = skeleton.slug; // Stable ID based on slug
      const pageRef = doc(db, 'projects', projectId, 'pages', pageId);
      
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
        createdAt: serverTimestamp(),
        brandMemoryHash: project.lastGenerationHash,
        version: 1
      });
    }

    await firestoreBatch.commit();

    // 5. Update Run Log
    await setDoc(runRef, {
      status: 'completed',
      generatedCount: results.length,
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
