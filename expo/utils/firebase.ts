import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBxeGqRNmlFlDa1vl1x0VqH3ABUGzJMVaU",
  authDomain: "random-quotes-4f33e.firebaseapp.com",
  projectId: "random-quotes-4f33e",
  storageBucket: "random-quotes-4f33e.firebasestorage.app",
  messagingSenderId: "278100417132",
  appId: "1:278100417132:web:f7b24170df6ee729411649",
  measurementId: "G-XCRYP78EXV"
};

// Config is hardcoded, so it is always configured
export const isFirebaseConfigured = true;

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { auth, googleProvider };
