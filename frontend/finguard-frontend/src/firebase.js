// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// Optional: only use analytics if you're in a browser environment
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAR5AT8xQvmieUQsJEYAml_A-gQNUEvH9Q",
  authDomain: "finguard-6ef6c.firebaseapp.com",
  projectId: "finguard-6ef6c",
  storageBucket: "finguard-6ef6c.firebasestorage.app",
  messagingSenderId: "443585744466",
  appId: "1:443585744466:web:00abf94f61763edc82198b",
  measurementId: "G-65PHFR1BQY"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);

// Optional: use analytics if needed
if (typeof window !== 'undefined') {
  getAnalytics(app);
}
