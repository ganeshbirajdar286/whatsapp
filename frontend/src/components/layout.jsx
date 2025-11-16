import React, { useEffect, useState } from 'react'
import useLayoutStore from '../store/layoutStore'
import { useLocation } from 'react-router-dom'
import useThemeStore from "../store/themeStore"
import SideBar from "../components/SideBar"
import { AnimatePresence } from 'framer-motion'
import ChatWindow from '../pages/chatSection/ChatWindow'
import { motion } from "framer-motion"

function Layout({ children, isThemeDialogOpen, toggleThemeDialog, isStatusPreviewOpen, statusPreviewContent }) {
  const selectedContact = useLayoutStore(state => state.selectedContact)
  const setSelectedContact = useLayoutStore(state => state.setSelectedContact)
  const location = useLocation()
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [isTablet, setIsTablet] = useState(window.innerWidth >= 768 && window.innerWidth < 1024)
  const { theme, setTheme } = useThemeStore();

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      setIsMobile(width < 768)
      setIsTablet(width >= 768 && width < 1024)
    }
    
    handleResize() // Initial check
    window.addEventListener("resize", handleResize)
    window.addEventListener("orientationchange", handleResize)
    
    return () => {
      window.removeEventListener("resize", handleResize)
      window.removeEventListener("orientationchange", handleResize)
    }
  }, [])

  // Prevent body scroll when theme dialog is open
  useEffect(() => {
    if (isThemeDialogOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isThemeDialogOpen])

  // Animation variants
  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction) => ({
      x: direction < 0 ? '100%' : '-100%',
      opacity: 0,
    }),
  }

  return (
    <>
      <div 
        className={`min-h-screen ${
          theme === "dark" ? "bg-[#111b21] text-white" : "bg-gray-100 text-black"
        } flex relative overflow-hidden`}
      >
        {/* Desktop Sidebar - Hidden on mobile */}
        {!isMobile && (
          <div className="flex-shrink-0">
            <SideBar />
          </div>
        )}

        {/* Main Content Area */}
        <div 
          className={`flex-1 flex overflow-hidden ${
            isMobile ? "flex-col" : ""
          }`}
          style={{ 
            height: isMobile ? '100vh' : 'auto',
            maxHeight: '100vh'
          }}
        >
          <AnimatePresence mode="wait" initial={false}>
            {/* Chat List - Show when no contact selected on mobile, always show on desktop/tablet */}
            {(!selectedContact || !isMobile) && (
              <motion.div
                key="chatlist"
                initial={{ x: isMobile ? "-100%" : 0, opacity: isMobile ? 0 : 1 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: isMobile ? "-100%" : 0, opacity: isMobile ? 0 : 1 }}
                transition={{ 
                  type: "tween", 
                  duration: 0.3,
                  ease: "easeInOut"
                }}
                className={`
                  ${isMobile ? "w-full absolute inset-0 z-10" : ""}
                  ${isTablet ? "w-2/5 min-w-[320px]" : ""}
                  ${!isMobile && !isTablet ? "w-2/5 min-w-[360px] max-w-[500px]" : ""}
                  h-full
                  ${isMobile ? "pb-16" : ""}
                  flex-shrink-0
                `}
              >
                {children}
              </motion.div>
            )}

            {/* Chat Window - Show when contact selected or on desktop/tablet */}
            {(selectedContact || !isMobile) && (
              <motion.div
                key="chatwindow"
                initial={{ x: isMobile ? "100%" : 0, opacity: isMobile ? 0 : 1 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: isMobile ? "100%" : 0, opacity: isMobile ? 0 : 1 }}
                transition={{ 
                  type: "tween", 
                  duration: 0.3,
                  ease: "easeInOut"
                }}
                className={`
                  ${isMobile ? "w-full absolute inset-0 z-20" : "flex-1"}
                  h-full
                  ${isMobile ? "pb-16" : ""}
                `}
              >
                <ChatWindow
                  selectedContact={selectedContact}
                  setSelectedContact={setSelectedContact}
                  isMobile={isMobile}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Mobile Bottom Sidebar */}
        {isMobile && (
          <div className="fixed bottom-0 left-0 right-0 z-30">
            <SideBar />
          </div>
        )}

        {/* Theme Dialog Modal */}
        {isThemeDialogOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm z-50 p-4"
            onClick={toggleThemeDialog}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
              className={`
                ${theme === "dark" ? "bg-[#202c33] text-white" : "bg-white text-black"}
                p-4 sm:p-6 md:p-8 
                rounded-lg sm:rounded-xl 
                shadow-2xl 
                w-full max-w-[90vw] sm:max-w-md 
                mx-auto
              `}
            >
              <h2 className="text-lg sm:text-xl md:text-2xl font-semibold mb-4 sm:mb-6 text-center">
                Choose a theme
              </h2>

              <div className="space-y-3 sm:space-y-4">
                <label 
                  className={`
                    flex items-center space-x-3 sm:space-x-4 
                    cursor-pointer 
                    p-3 sm:p-4 
                    rounded-lg 
                    transition-all
                    ${theme === "light" 
                      ? "bg-blue-50 dark:bg-blue-900/30 ring-2 ring-blue-500" 
                      : "hover:bg-gray-100 dark:hover:bg-gray-700"
                    }
                  `}
                >
                  <input
                    type="radio"
                    value="light"
                    checked={theme === "light"}
                    onChange={() => setTheme("light")}
                    className="form-radio h-4 w-4 sm:h-5 sm:w-5 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex items-center flex-1">
                    <span className="text-sm sm:text-base md:text-lg font-medium">
                      Light
                    </span>
                  </div>
                  {theme === "light" && (
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </label>

                <label 
                  className={`
                    flex items-center space-x-3 sm:space-x-4 
                    cursor-pointer 
                    p-3 sm:p-4 
                    rounded-lg 
                    transition-all
                    ${theme === "dark" 
                      ? "bg-blue-50 dark:bg-blue-900/30 ring-2 ring-blue-500" 
                      : "hover:bg-gray-100 dark:hover:bg-gray-700"
                    }
                  `}
                >
                  <input
                    type="radio"
                    value="dark"
                    checked={theme === "dark"}
                    onChange={() => setTheme("dark")}
                    className="form-radio h-4 w-4 sm:h-5 sm:w-5 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex items-center flex-1">
                    <span className="text-sm sm:text-base md:text-lg font-medium">
                      Dark
                    </span>
                  </div>
                  {theme === "dark" && (
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </label>
              </div>

              <button
                onClick={toggleThemeDialog}
                className="
                  mt-4 sm:mt-6 
                  w-full 
                  bg-blue-600 hover:bg-blue-700 active:bg-blue-800
                  text-white 
                  py-2.5 sm:py-3 
                  rounded-lg sm:rounded-xl 
                  font-medium
                  text-sm sm:text-base
                  transition-all duration-200
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                  shadow-lg hover:shadow-xl
                "
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}

        {/* Status Preview Modal (if needed in future) */}
        {isStatusPreviewOpen && statusPreviewContent && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50"
          >
            <div className="max-w-lg w-full p-4">
              {statusPreviewContent}
            </div>
          </motion.div>
        )}
      </div>
    </>
  )
}

export default Layout