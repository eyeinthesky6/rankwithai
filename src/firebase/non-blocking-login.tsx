'use client';
import {
  Auth,
  GoogleAuthProvider,
  signInWithRedirect
} from 'firebase/auth';

/** 
 * Initiate Google Sign-In via Redirect.
 * This ensures an "inline" experience where the user remains within the same context 
 * and is redirected back to the application after authentication.
 */
export function initiateGoogleSignIn(authInstance: Auth): void {
  if (!authInstance) {
    console.error('Auth instance not available');
    return;
  }
  
  const provider = new GoogleAuthProvider();
  provider.addScope('profile');
  provider.addScope('email');
  
  try {
    signInWithRedirect(authInstance, provider);
  } catch (error) {
    console.error('Google sign-in redirect error:', error);
  }
}