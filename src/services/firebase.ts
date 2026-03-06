import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyD5i5XyCnqfx0dfjY33604Q-8nomvtdKzs",
  authDomain: "cinestream-dcb53.firebaseapp.com",
  databaseURL: "https://cinestream-dcb53-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "cinestream-dcb53",
  storageBucket: "cinestream-dcb53.firebasestorage.app",
  messagingSenderId: "642161803952",
  appId: "1:642161803952:web:06b83d59caea4ce0f2f175",
  measurementId: "G-81SDBNDQ5H"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
