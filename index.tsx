import React from 'react';
import ReactDOM from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import App from './App';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const CLERK_SIGN_IN_URL = import.meta.env.VITE_CLERK_SIGN_IN_URL || '/sign-in';
const CLERK_SIGN_UP_URL = import.meta.env.VITE_CLERK_SIGN_UP_URL || '/sign-up';

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key");
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      signInUrl={CLERK_SIGN_IN_URL}
      signUpUrl={CLERK_SIGN_UP_URL}
      afterSignInUrl="/"
      afterSignUpUrl="/"
    >
      <App />
    </ClerkProvider>
  </React.StrictMode>
);