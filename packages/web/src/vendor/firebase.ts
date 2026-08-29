import { getAnalytics } from "firebase/analytics"
import { initializeApp } from "firebase/app"
import { getAuth, GithubAuthProvider, GoogleAuthProvider, OAuthProvider } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

export const actionCodeSettings = {
  // URL you want to redirect back to. The domain (www.example.com) for this
  // URL must be in the authorized domains list in the Firebase Console.
  url: import.meta.env.PROD
    ? "https://crate.network/email-sign-in"
    : "http://localhost:3000/email-sign-in",
  handleCodeInApp: true,
}

export const app = initializeApp({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.MEASUREMENT_ID,
})

export const analytics = getAnalytics(app)
export const auth = getAuth(app)
export const db = getFirestore(app)

export const providers = {
  google: new GoogleAuthProvider(),
  github: new GithubAuthProvider(),
  apple: new OAuthProvider("apple.com"),
}
