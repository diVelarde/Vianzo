import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { Timestamp } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
const serviceAccount = JSON.parse(readFileSync('./config/whispernet-a172b.json', 'utf8'));

const app = initializeApp({
  credential: cert(serviceAccount)
});

export const db = getFirestore(app);
export const auth = getAuth(app);
export { Timestamp };