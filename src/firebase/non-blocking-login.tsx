'use client';
import {
  Auth,
  GoogleAuthProvider,
  signInWithRedirect,
  signInWithPopup
} from 'firebase/auth';

/** Initiate Google Sign-In (redirect flow - recommended for mobile/compat). */
export function initiateGoogleSignIn(authInstance: Auth): void {
  if (!authInstance) {
    console.error('Auth instance not available');
    return;
  }
  
  const provider = new GoogleAuthProvider();
  // Add any additional scopes if needed
  provider.addScope('profile');
  provider.addScope('email');
  
  // Use popup as fallback since redirect may have issues in some environments
  try {
    signInWithPopup(authInstance, provider).catch((error) => {
      console.error('Popup failed, trying redirect:', error);
      signInWithRedirect(authInstance, provider);
    });
  } catch (error) {
    console.error('Google sign-in error:', error);
  }
}