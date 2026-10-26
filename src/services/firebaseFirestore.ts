import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  deleteDoc,
  onSnapshot,
  getDocFromServer,
  Unsubscribe,
} from 'firebase/firestore';
import { auth, db } from './firebaseConfig';
import { OrderDraft } from '../types/pharmacy';

export { db, auth };

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connection on boot as mandated by skill
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
      return false;
    }
    return true;
  }
}

// -------------------------------------------------------------
// Firestore Drafts Sync API
// -------------------------------------------------------------

// Save or sync a draft to Firestore
export async function saveDraftToFirestore(draft: OrderDraft, userId: string): Promise<void> {
  const path = `users/${userId}/drafts/${draft.id}`;
  try {
    const draftPayload = {
      ...draft,
      userId,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'users', userId, 'drafts', draft.id), draftPayload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Fetch all drafts for a user from Firestore
export async function fetchUserDraftsFromFirestore(userId: string): Promise<OrderDraft[]> {
  const path = `users/${userId}/drafts`;
  try {
    const colRef = collection(db, 'users', userId, 'drafts');
    const snapshot = await getDocs(colRef);
    const drafts: OrderDraft[] = [];
    snapshot.forEach((d) => {
      drafts.push(d.data() as OrderDraft);
    });
    return drafts;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

// Delete a draft from Firestore
export async function deleteDraftFromFirestore(draftId: string, userId: string): Promise<void> {
  const path = `users/${userId}/drafts/${draftId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'drafts', draftId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Listen to drafts in real-time
export function subscribeUserDrafts(
  userId: string,
  onUpdate: (drafts: OrderDraft[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const path = `users/${userId}/drafts`;
  const colRef = collection(db, 'users', userId, 'drafts');

  return onSnapshot(
    colRef,
    (snapshot) => {
      const drafts: OrderDraft[] = [];
      snapshot.forEach((d) => {
        drafts.push(d.data() as OrderDraft);
      });
      onUpdate(drafts);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

// Save or update user profile in Firestore
export async function saveUserProfile(user: {
  uid: string;
  email: string | null;
  displayName: string | null;
  pharmacyName?: string;
  phone?: string;
  address?: string;
}): Promise<void> {
  const path = `users/${user.uid}`;
  try {
    const docRef = doc(db, 'users', user.uid);
    const existing = await getDoc(docRef);
    const now = new Date().toISOString();

    const data: any = {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || '',
      updatedAt: now,
    };
    if (user.pharmacyName) data.pharmacyName = user.pharmacyName;
    if (user.phone) data.phone = user.phone;
    if (user.address) data.address = user.address;

    if (!existing.exists()) {
      data.createdAt = now;
    }

    await setDoc(docRef, data, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
