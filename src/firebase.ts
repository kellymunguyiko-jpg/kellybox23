import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";

// ─── SERVER 1 (Primary - kellybox-febfa) ─────────────────────────────────────
const firebaseConfig1 = {
  apiKey: "AIzaSyBvYiXoXp2mXN6Mpaq258QqVPxGk8h1lQU",
  authDomain: "kellybox-febfa.firebaseapp.com",
  projectId: "kellybox-febfa",
  storageBucket: "kellybox-febfa.firebasestorage.app",
  messagingSenderId: "214725221173",
  appId: "1:214725221173:web:d78d419d1081d78ef00a7c",
  measurementId: "G-JF10Q41PE2",
};

// ─── SERVER 2 (Backup - chatting-e7a27) ──────────────────────────────────────
const firebaseConfig2 = {
  apiKey: "AIzaSyDSFgB_d3IKFOuq9yv6WWGVuMmsyzusFCo",
  authDomain: "chatting-e7a27.firebaseapp.com",
  projectId: "chatting-e7a27",
  storageBucket: "chatting-e7a27.firebasestorage.app",
  messagingSenderId: "583334343270",
  appId: "1:583334343270:web:7e710f33718d412f73b3a7",
  measurementId: "G-CZPFXELQ9V",
};

// ─── Initialize Apps ──────────────────────────────────────────────────────────
const app1 = initializeApp(firebaseConfig1, "server1");
const app2 = initializeApp(firebaseConfig2, "server2");

// ─── Exports ──────────────────────────────────────────────────────────────────
export const db   = getFirestore(app1);  // Server 1 DB (primary)
export const db2  = getFirestore(app2);  // Server 2 DB (backup)
export const auth  = getAuth(app1);      // Auth Server 1 (primary login)
export const auth2 = getAuth(app2);      // Auth Server 2 (used for cross-auth writes)

try { getAnalytics(app1); } catch (_) { /* analytics optional */ }
try { getAnalytics(app2); } catch (_) { /* analytics optional */ }

export default app1;
