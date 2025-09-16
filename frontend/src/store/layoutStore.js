import { create } from 'zustand'
import {createJSONStorage,persist} from "zustand/middleware"

const useLayoutStore =create(
    persist(
       (set)=>({
           activeTab:"chats",
           selectedContact:null,
           setSelectedContact:(contact)=>set({selectedContact:contact}),
           setActiveTab:(tab)=>set({activeTab:tab})
       }),
       {
           name:"layout-storage",
           storage:createJSONStorage(()=>localStorage),
       }
       )
)

export default useLayoutStore;