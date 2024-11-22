// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA_y0weqnMH4SYRHbub-9ApLWmkA_3XU04",
  authDomain: "document-extraction-f154b.firebaseapp.com",
  projectId: "document-extraction-f154b",
  storageBucket: "document-extraction-f154b.firebasestorage.app",
  messagingSenderId: "241337960405",
  appId: "1:241337960405:web:b729097b80165c6b1b1f5c",
  measurementId: "G-52Z24TLL9G",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
