import { initializeApp, setLogLevel } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut, User } from 'firebase/auth';
import { initializeFirestore, doc, setDoc, getDoc, collection, query, where, getDocs, onSnapshot, addDoc, serverTimestamp, deleteDoc, memoryLocalCache } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Silence Firebase SDK logs
try {
  setLogLevel('silent');
} catch (e) {
  console.warn("Could not set Firebase log level to silent:", e);
}

// Safely intercept and filter out connection/offline warnings from standard console outputs
// as these are expected when browsers restrict third-party partitioned cookies in iframes.
const filterFirestoreWarnings = () => {
  const originalWarn = console.warn;
  const originalError = console.error;

  const shouldIgnore = (args: any[]) => {
    return args.some(arg => 
      typeof arg === 'string' && (
        arg.includes('Could not reach Cloud Firestore backend') ||
        arg.includes('@firebase/firestore') ||
        arg.includes('connection failed') ||
        arg.includes('The operation could not be completed') ||
        arg.includes('offline mode')
      )
    );
  };

  console.warn = function (...args: any[]) {
    if (shouldIgnore(args)) return;
    originalWarn.apply(console, args);
  };

  console.error = function (...args: any[]) {
    if (shouldIgnore(args)) return;
    originalError.apply(console, args);
  };
};

try {
  filterFirestoreWarnings();
} catch (e) {
  // safe fallback
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  localCache: memoryLocalCache(),
}, firebaseConfig.firestoreDatabaseId);

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
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
