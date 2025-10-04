import { create } from 'zustand'
import  {createJSONStorage, persist } from "zustand/middleware"

const useUserStore = create(
   persist(
      (set)=>({
          user:null, 
          isAuthenticated:false,
         setUser:(userData)=>set({user:userData,isAuthenticated:true}),//updates both user and isAuthenticated: true
          clearUser:()=>set({user:null,isAuthenticated:false}), //resets everything back to logged-out state
      }),
      {
          name:"user-storage", //the key used in localStorage
          storage:createJSONStorage(()=>localStorage)  // tells Zustand where to save. By default it uses localStorage, but you could switch to sessionStorage or even custom storage.
      }
      )
)

export default useUserStore;

// set mean  
//Creates a new state object by merging this into the old state
//Marks the store as updated
//Triggers re-renders in components that use this store
//So set(...) is the mechanism to notify Zustand.
//  How set works internally
// Think of set like React’s useState setter.
// setState(newValue) in React → re-renders the component
// set(newState) in Zustand → updates the store & re-renders any subscribed components

