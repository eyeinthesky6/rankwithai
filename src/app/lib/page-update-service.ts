'use client';

import { Firestore, doc, runTransaction, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

/**
 * Shared function to atomically update a page and log the action.
 * Consolidates duplicate logic from preview-screen.tsx
 */
export interface PageUpdateOptions {
  db: Firestore;
  projectId: string;
  pageId: string;
  pageData: Record<string, unknown>;
  logEntry: {
    ruleTriggered: string;
    actionTaken: string;
  };
  pageSlug: string;
}

/**
 * Atomically updates a page and logs the action using Firestore transaction.
 * Returns the updated page data for local state updates.
 */
export async function applyPageUpdateWithLog(options: PageUpdateOptions): Promise<Record<string, unknown>> {
  const { db, projectId, pageId, pageData, logEntry, pageSlug } = options;
  
  const pageRef = doc(db, 'projects', projectId, 'pages', pageId);
  const projectRef = doc(db, 'projects', projectId);

  await runTransaction(db, async (transaction) => {
    const fullLogEntry = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      pageSlug,
      ...logEntry
    };
    
    transaction.set(pageRef, pageData);
    transaction.update(projectRef, {
      refreshLogs: arrayUnion(fullLogEntry)
    });
  });

  return pageData;
}

/**
 * Creates a log entry for refresh logs
 */
export function createLogEntry(
  pageSlug: string,
  ruleTriggered: string,
  actionTaken: string
) {
  return {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    pageSlug,
    ruleTriggered,
    actionTaken
  };
}
