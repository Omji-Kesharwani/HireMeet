import { SignedIn, SignedOut, SignInButton, SignOutButton, UserButton } from '@clerk/clerk-react'
import React from 'react'
import toast from 'react-hot-toast'

const HomePage = () => {
  return (
     <div>
       <button className='btn btn-secondary' onClick={()=>toast.success("This is a success toast")}></button>
          
          
          <SignedOut>
            <SignInButton>
              <button>Signin</button>
            </SignInButton>
          </SignedOut>


          <SignedIn>
           <SignOutButton/>
          </SignedIn>
          <UserButton/>
     </div>
  )
}

export default HomePage