'use client';
import {
  Auth,
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult
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

/**
 * Handle the redirect result after returning from Google OAuth.
 * This processes the authentication credentials when the user is redirected back 
 * to the application after signing in with Google.
 */
export async function handleRedirectResult(authInstance: Auth): Promise<void> {
  if (!authInstance) {
    console.error('Auth instance not available');
    return;
  }

  try {
    const result = await getRedirectResult(authInstance);
    if (result) {
      // User successfully signed in via redirect
      console.log('Google sign-in result:', result.user?.email);
    }
  } catch (error) {
    console.error('Error getting redirect result:', error);
    // Re-throw so caller can handle appropriately
    throw error;
  }
}