
import { initializeFirebase } from '@/firebase';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  deleteDoc, 
  serverTimestamp,
  Firestore,
  addDoc
} from 'firebase/firestore';

export interface Project {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  website: string;
  niche: string;
  createdAt: any;
  brandMemory?: any;
  lastGenerationHash?: string;
}

export interface ProjectPage {
  id: string;
  projectId: string;
  ownerId: string;
  slug: string;
  type: string;
  seoTitle: string;
  metaDescription: string;
  h1: string;
  sections: any[];
  faqs: any[];
  internalLinks: string[];
  createdAt: any;
  brandMemoryHash: string;
}

export class FirestoreDB {
  private db: Firestore;

  constructor() {
    const { firestore } = initializeFirebase();
    this.db = firestore;
  }

  async getAllProjects(ownerId: string): Promise<Project[]> {
    const q = query(collection(this.db, 'projects'), where('ownerId', '==', ownerId), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
  }

  async getProjectById(id: string): Promise<Project | null> {
    const docRef = doc(this.db, 'projects', id);
    const snap = await getDoc(docRef);
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as Project) : null;
  }

  async getProjectBySlug(slug: string): Promise<Project | null> {
    const q = query(collection(this.db, 'projects'), where('slug', '==', slug));
    const snap = await getDocs(q);
    return snap.empty ? null : ({ id: snap.docs[0].id, ...snap.docs[0].data() } as Project);
  }

  async createProject(data: Omit<Project, 'id' | 'createdAt' | 'slug'>): Promise<Project> {
    const id = Math.random().toString(36).substring(7);
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const projectRef = doc(this.db, 'projects', id);
    const project = {
      ...data,
      id,
      slug,
      createdAt: serverTimestamp(),
    };
    await setDoc(projectRef, project);
    return project as any;
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<void> {
    const projectRef = doc(this.db, 'projects', id);
    await setDoc(projectRef, updates, { merge: true });
  }

  async deleteProject(id: string): Promise<void> {
    await deleteDoc(doc(this.db, 'projects', id));
  }

  async getPages(projectId: string): Promise<ProjectPage[]> {
    const q = query(collection(this.db, 'projects', projectId, 'pages'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProjectPage));
  }

  async savePages(projectId: string, pages: any[]): Promise<void> {
    for (const page of pages) {
      const pageId = page.id || Math.random().toString(36).substring(7);
      const pageRef = doc(this.db, 'projects', projectId, 'pages', pageId);
      await setDoc(pageRef, { ...page, id: pageId, projectId, createdAt: serverTimestamp() });
    }
  }
}

export const db = new FirestoreDB();
