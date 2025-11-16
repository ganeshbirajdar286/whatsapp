import React from "react";
import { useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import SideBar from "../components/SideBar";
import ChatWindow from "../pages/chatSection/ChatWindow";
import useThemeStore from "../store/themeStore";
import useLayoutStore from "../store/layoutStore";
import useScreenSize from "../hooks/useScreenSize";

function Layout({
  children,
  isThemeDialogOpen,
  toggleThemeDialog,
  isStatusPreviewOpen,
  statusPreviewContent,
}) {
  const { theme } = useThemeStore();
  const { selectedContact, setSelectedContact } = useLayoutStore();
  const { isMobile } = useScreenSize();
  const location = useLocation();

  return (
    <div
      className={`min-h-[100dvh] max-h-[100dvh] overflow-hidden flex ${
        theme === "dark"
          ? "bg-[#111b21] text-white"
          : "bg-gray-100 text-black"
      }`}
    >
      {/* Desktop Sidebar */}
      {!isMobile && (
        <div className="w-16 flex-shrink-0">
          <SideBar />
        </div>
      )}

      {/* MAIN CONTENT */}
      <div className="flex-1 relative flex overflow-hidden h-[100dvh]">
        <AnimatePresence initial={false} mode="wait">
          {/* CHAT LIST (always shown on desktop) */}
          {(!selectedContact || !isMobile) && (
            <motion.div
              key="chatlist"
              initial={{ x: isMobile ? -50 : 0, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: isMobile ? -50 : 0, opacity: isMobile ? 0 : 1 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className={`
                h-full flex-shrink-0 
                ${isMobile ? "w-full" : "w-2/5 max-w-[500px] min-w-[320px]"}
                bg-inherit
              `}
            >
              {children}
            </motion.div>
          )}

          {/* CHAT WINDOW */}
          {(selectedContact || !isMobile) && (
            <motion.div
              key="chatwindow"
              initial={{ x: isMobile ? 50 : 0, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: isMobile ? 50 : 0, opacity: isMobile ? 0 : 1 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className={`
                h-full flex-1 
                ${isMobile ? "absolute inset-0 z-20 bg-inherit" : ""}
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

      {/* ------------------------------ */}
      {/* ⭐ THEME DIALOG (FIXED) ⭐ */}
      {/* ------------------------------ */}
      {isThemeDialogOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm z-50 p-4"
          onClick={toggleThemeDialog}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={(e) => e.stopPropagation()}
            className={`p-6 rounded-lg shadow-xl w-full max-w-sm ${
              theme === "dark"
                ? "bg-[#202c33] text-white"
                : "bg-white text-black"
            }`}
          >
            <h2 className="text-xl font-semibold mb-4 text-center">
              Choose Theme
            </h2>

            <div className="space-y-3">
              {/* Light Theme */}
              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700">
                <input
                  type="radio"
                  name="theme"
                  value="light"
                  checked={theme === "light"}
                  onChange={() =>
                    useThemeStore.getState().setTheme("light")
                  }
                />
                <span>Light</span>
              </label>

              {/* Dark Theme */}
              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700">
                <input
                  type="radio"
                  name="theme"
                  value="dark"
                  checked={theme === "dark"}
                  onChange={() =>
                    useThemeStore.getState().setTheme("dark")
                  }
                />
                <span>Dark</span>
              </label>
            </div>

            <button
              onClick={toggleThemeDialog}
              className="mt-5 w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
            >
              Close
            </button>
          </motion.div>
        </motion.div>
      )}
      {/* ------------------------------ */}
      {/* ⭐ END THEME DIALOG ⭐ */}
      {/* ------------------------------ */}
    </div>
  );
}

export default Layout;
