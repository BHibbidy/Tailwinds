import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyABr0kmhb717aJsJvDLbKEDcEZzRS681F4",
  authDomain: "pilotlogbook-ad759.firebaseapp.com",
  projectId: "pilotlogbook-ad759",
  storageBucket: "pilotlogbook-ad759.firebasestorage.app",
  messagingSenderId: "153591105825",
  appId: "1:153591105825:web:58a4c59b5ebc2356c59660"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);
