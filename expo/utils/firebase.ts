import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBxeGqRNmlFlDa1vl1x0VqH3ABUGzJMVaU",
  authDomain: "random-quotes-4f33e.firebaseapp.com",
  projectId: "random-quotes-4f33e",
  storageBucket: "random-quotes-4f33e.firebasestorage.app",
  messagingSenderId: "278100417132",
  appId: "1:278100417132:web:91b063f59cdd03e2411649",
  measurementId: "G-EC2X8623DD"
};

// Config is hardcoded, so it is always configured
export const isFirebaseConfigured = true;

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { auth, googleProvider };
