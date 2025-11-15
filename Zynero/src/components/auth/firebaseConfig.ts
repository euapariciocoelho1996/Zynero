// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// NOTA: É uma prática de segurança mover chaves de API para variáveis de ambiente
// (ex: process.env.REACT_APP_FIREBASE_API_KEY) em um projeto real.
const firebaseConfig = {
  apiKey: "AIzaSyDwoLYaNkPSl0Get0_d5xlMYoCNPgDGYY0",
  authDomain: "zynero-1b0da.firebaseapp.com",
  projectId: "zynero-1b0da",
  storageBucket: "zynero-1b0da.firebasestorage.app",
  messagingSenderId: "92198903128",
  appId: "1:92198903128:web:f4fb5492103d4768f1592d",
  measurementId: "G-PM4VC7ZQLW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
getAnalytics(app); // Inicializa analytics (mesmo que não seja usado diretamente)

// Inicializar e exportar os serviços do Firebase
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;