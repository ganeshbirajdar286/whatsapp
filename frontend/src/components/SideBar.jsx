import React from "react";
import { Link, useLocation } from "react-router-dom";
import useScreenSize from "../hooks/useScreenSize";  
import useThemeStore from "../store/themeStore";
import useUserStore from "../store/useUserStore";
import useLayoutStore from "../store/layoutStore";
import { FaWhatsapp, FaCog } from "react-icons/fa";
import { MdRadioButtonChecked } from "react-icons/md";
import { motion } from "framer-motion";

function SideBar() {
  const location = useLocation();
  const { isMobile } = useScreenSize();   // ⭐ FIXED — now accurate on all devices
  const { theme } = useThemeStore();
  const { user } = useUserStore();
  const { activeTab, setActiveTab, selectedContact } = useLayoutStore();

  // set active tab based on route
  React.useEffect(() => {
    if (location.pathname === "/") setActiveTab("chats");
    if (location.pathname === "/user-profile") setActiveTab("profile");
    if (location.pathname === "/setting") setActiveTab("setting");
  }, [location]);

  // hide sidebar on mobile when chat is open
  if (isMobile && selectedContact) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={`
        ${isMobile ? "fixed bottom-0 left-0 right-0 h-16 flex-row justify-around" 
                    : "fixed left-0 top-0 w-16 h-full flex-col justify-between"}
        flex items-center py-4 shadow-lg z-50
        ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-[rgb(239,242,254)] border-gray-300"}
        border-r-2
      `}
    >
      {/* Chats */}
      <Link
        to="/"
        className={`p-2 rounded-full transition-all 
          ${activeTab === "chats" ? "bg-white shadow-md" : ""}`}
      >
        <FaWhatsapp
          className={`h-6 w-6 ${
            activeTab === "chats"
              ? "text-green-600"
              : theme === "dark"
              ? "text-gray-300"
              : "text-gray-900"
          }`}
        />
      </Link>

      {/* Only desktop: push middle icons down */}
      {!isMobile && <div className="flex-grow" />}

      {/* Profile */}
      <Link
        to="/user-profile"
        className={`p-2 rounded-full transition-all 
          ${activeTab === "profile" ? "bg-white shadow-md" : ""}`}
      >
        {user?.profilePicture ? (
          <img
            src={user.profilePicture}
            alt="user"
            className="h-7 w-7 rounded-full object-cover"
          />
        ) : (
          <MdRadioButtonChecked
            className={`h-6 w-6 ${
              activeTab === "profile"
                ? "text-green-600"
                : theme === "dark"
                ? "text-gray-300"
                : "text-gray-900"
            }`}
          />
        )}
      </Link>

      {/* Settings */}
      <Link
        to="/setting"
        className={`p-2 rounded-full transition-all 
          ${activeTab === "setting" ? "bg-white shadow-md" : ""}`}
      >
        <FaCog
          className={`h-6 w-6 ${
            activeTab === "setting"
              ? "text-green-600"
              : theme === "dark"
              ? "text-gray-300"
              : "text-gray-900"
          }`}
        />
      </Link>
    </motion.div>
  );
}

export default SideBar;

