import { create } from 'zustand'
import {createJSONStorage, persist} from "zustand/middleware"

const useThemeStore =create(
    persist(
    (set)=>({
        theme:"light",
        setTheme:(theme)=>set({theme}),
    }),
    {
        name:"theme-storage",
        storage:createJSONStorage(()=>localStorage),
    }
    )
)

export default useThemeStore;