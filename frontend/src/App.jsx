import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { SignedIn, SignedOut, SignInButton, SignOutButton, UserButton } from '@clerk/clerk-react';
function App() {


  return (
   <>
   <h1>Welcome to HireMeet</h1>
   <SignedOut>
    <SignInButton mode='modal' >
      <button>Sign In</button>
    </SignInButton>
   </SignedOut>
   
   <SignedIn>
    <SignOutButton />
   </SignedIn>

  <UserButton />
   </>
  )
}

export default App
