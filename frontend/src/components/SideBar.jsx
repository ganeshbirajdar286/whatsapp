import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import useThemeStore from "../store/themeStore";
import useUserStore from "../store/useUserStore";
import useLayoutStore from "../store/layoutStore";
import { Link } from "react-router-dom";
import { FaWhatsapp } from "react-icons/fa";
import { motion } from "framer-motion";
import { MdRadioButtonChecked } from "react-icons/md";
import { FaCog } from "react-icons/fa";

function SideBar() {
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const { theme, setTheme } = useThemeStore();
  const { user } = useUserStore();
  const { activeTab, setActiveTab, selectedContact } = useLayoutStore();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (location.pathname === "/") {
      setActiveTab("chats");
    } else if (location.pathname === "/status") {
      setActiveTab("status");
    } else if (location.pathname === "/user-profile") {
      setActiveTab("profile");
    } else if (location.pathname === "/setting") {
      setActiveTab("setting");
    }
  }, [location, setActiveTab]);

  if (isMobile && selectedContact) {
    return null;
  }

  const sideBarContent = (
    <>
      <Link
        to="/"
        className={`${isMobile ? "" : "mb-8"}  ${
          activeTab === "chats" && "bg-gray-300 shadow-sm  p-2  rounded-full "
        } focus:outline-none`}
      >
        <FaWhatsapp
          className={`h-6 w-6 ${
            activeTab === "chats"
              ? theme === "dark"
                ? "text-gray-800 "
                : " "
              : theme === "dark"
              ? "text-gray-300"
              : "text-gray-800"
          }`}
        />
      </Link>

      <Link
        to="/status"
        className={`${isMobile ? "" : "mb-8"}  ${
          activeTab === "status" && "bg-gray-300 shadow-sm  p-2  rounded-full "
        } focus:outline-none`}
      >
        <MdRadioButtonChecked
          className={`h-6 w-6 ${
            activeTab === "chats"
              ? theme === "dark"
                ? "text-gray-800 "
                : " "
              : theme === "dark"
              ? "text-gray-300"
              : "text-gray-800"
          }`}
        />
      </Link>
      {!isMobile && <div className="flex-grow"></div>}
      <Link
        to="/user-profile"
        className={`${isMobile ? "" : "mb-8"}  ${
          activeTab === "profile" && "bg-gray-300 shadow-sm  p-2  rounded-full "
        } focus:outline-none`}
      >
        {user?.profilePicture ? (
          <img
            src={user?.profilePicture}
            alt="user"
            className="h-6 w-6  rounded-full"
          />
        ) : (
          <MdRadioButtonChecked
            className={`h-6 w-6 ${
              activeTab === "chats"
                ? theme === "dark"
                  ? "text-gray-800 "
                  : " "
                : theme === "dark"
                ? "text-gray-300"
                : "text-gray-800"
            }`}
          />
        )}
      </Link>
      <Link
        to="/setting"
        className={`${isMobile ? "" : "mb-8"}  ${
          activeTab === "setting" && "bg-gray-300 shadow-sm  p-2  rounded-full "
        } focus:outline-none`}
      >
        <FaCog
          className={`h-6 w-6 ${
            activeTab === "chats"
              ? theme === "dark"
                ? "text-gray-800 "
                : " "
              : theme === "dark"
              ? "text-gray-300"
              : "text-gray-800"
          }`}
        />
      </Link>
    </>
  );
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className={`${
          isMobile
            ? "fixed bottom-0 left-0 right-0 h-16"
            : "w-16 h-screen border-r-2"
        } ${
          theme === "dark"
            ? "bg-gray-800 border-gray-600"
            : "bg-[rgb(239,242,254)] border-gray-300"
        } bg-opacity-90  flex items-center py-4 shadow-lg ${
          isMobile ? "flex-row justify-around" : "flex-col justify-between"
        } `}
      >
        {sideBarContent}
      </motion.div>
    </>
  );
}

export default SideBar;
