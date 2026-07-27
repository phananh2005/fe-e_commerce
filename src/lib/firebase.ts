import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBCkveWFjrDSai7JFlSX4fJfVbTHFGRS3I",
  authDomain: "e-commerce-7f4c2.firebaseapp.com",
  projectId: "e-commerce-7f4c2",
  storageBucket: "e-commerce-7f4c2.firebasestorage.app",
  messagingSenderId: "89127983725",
  appId: "1:89127983725:web:d11c564a82a25e43fa3d64",
  measurementId: "G-6SVE36QCPN"
};

export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
