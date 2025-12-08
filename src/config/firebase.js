import { initializeApp } from "firebase/app";
import {
  getDatabase,
  ref,
  set,
  get,
  onValue,
  push,
  update,
  remove,
} from "firebase/database";

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCi-XsnFB_0--PMA_xSCwtcZ66ATUAX7_c",
  authDomain: "energysaving-air.firebaseapp.com",
  databaseURL:
    "https://energysaving-air-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "energysaving-air",
  storageBucket: "energysaving-air.firebasestorage.app",
  messagingSenderId: "125415480861",
  appId: "1:125415480861:web:8678e641cdbe7a5fc630f4",
  measurementId: "G-NW7TNV5J1E",
};

const app = initializeApp(FIREBASE_CONFIG);
const database = getDatabase(app);

export { database, ref, set, get, onValue, push, update, remove };
export default app;
