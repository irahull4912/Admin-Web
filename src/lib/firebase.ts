
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCrd4pnTO_JjoFpdY_OUqPhet-k_8H6-ko",
  authDomain: "studio-5676793669-2a70d.firebaseapp.com",
  projectId: "studio-5676793669-2a70d",
  storageBucket: "studio-5676793669-2a70d.firebasestorage.app",
  messagingSenderId: "564605611126",
  appId: "1:564605611126:web:70b38e6a060538fc744357",
  measurementId: ""
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { auth, db, googleProvider };
