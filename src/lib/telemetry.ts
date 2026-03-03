
'use client';

import { initializeFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp, doc, setDoc } from 'firebase/firestore';

export type EventType = 
  | 'auth_login' 
  | 'project_created' 
  | 'brandmemory_saved' 
  | 'generation_started' 
  | 'generation_completed' 
  | 'generation_aborted_budget' 
  | 'page_qa_failed' 
  | 'page_autofixed' 
  | 'ai_action_called' 
  | 'lead_created' 
  | 'domain_requested' 
  | 'domain_verified' 
  | 'domain_activated' 
  | 'feed_page_view' 
  | 'app_page_view';

export async function logEvent(type: EventType, data: { uid?: string, projectId?: string, pageSlug?: string, meta?: any } = {}) {
  const { firestore } = initializeFirebase();
  
  const event = {
    eventType: type,
    ...data,
    createdAt: serverTimestamp(),
    platform: typeof window !== 'undefined' ? (window.innerWidth < 768 ? 'mobile' : 'desktop') : 'unknown'
  };

  try {
    await addDoc(collection(firestore, 'eventLogs'), event);
    
    // Update user profile lastSeen if UID provided
    if (data.uid) {
      const userRef = doc(firestore, 'userProfiles', data.uid);
      await setDoc(userRef, { 
        uid: data.uid,
        lastSeenAt: serverTimestamp() 
      }, { merge: true });
    }
  } catch (e) {
    console.warn('Telemetry log failed:', e);
  }
}
