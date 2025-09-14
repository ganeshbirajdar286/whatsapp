import { create } from 'zustand'
import {persist} from "zustand/middleware"

const useLoginStore =create(
    persist(
    (set)=>({
        step:1,
        userPhoneData:null,
        setStep:(step)=>set({step}),
        setUserPhoneData:(data)=>set({userPhoneData:data}),
        resetLoginState:()=>set({step:1,userPhoneData:null}),
    }),
    {
        name:"login-storage",
        partialize:(state)=>({   //It receives the whole store state and should return an object containing only the values you want saved to local storage.
        // Anything not returned by partialize will not be persisted and on page refresh will revert to your store’s initial/default value.  
            step:state.step,
            userPhoneData:state.userPhoneData,
        })
    }
    )
)

export default useLoginStore;