import { initializeApp } from "firebase/app";
import {
  getFirestore,
  serverTimestamp,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy
} from "firebase/firestore";

// Config do seu projeto Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBrQo5ft7rMUTt2Y-8K-wXogc_ymgpCAmU",
  authDomain: "controle-estoquevitalagua.firebaseapp.com",
  projectId: "controle-estoquevitalagua",
  storageBucket: "controle-estoquevitalagua.firebasestorage.app",
  messagingSenderId: "912547368073",
  appId: "1:912547368073:web:6ecf90129a36740bf74a58"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Instância do Firestore
const db = getFirestore(app);

// Exporta tudo que você precisa no ClientForm
export { db, serverTimestamp, collection, addDoc, getDocs, query, orderBy };
