import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Public client config — safe to commit. Real security lives in firestore.rules
// + authorized domains + the API key restrictions in Google Cloud Console.
const firebaseConfig = {
  apiKey: "AIzaSyCuLlvqTZjKi-h7HKOEjL3nHnLWwEraOLI",
  authDomain: "carousel-2a740.firebaseapp.com",
  projectId: "carousel-2a740",
  storageBucket: "carousel-2a740.firebasestorage.app",
  messagingSenderId: "814805521732",
  appId: "1:814805521732:web:af814890ca6c95f6ad7311",
  measurementId: "G-2K3K55GTM1",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
