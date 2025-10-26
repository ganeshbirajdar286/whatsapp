import React, { useState } from "react";
import useThemeStore from "../../store/themeStore";
import useUserStore from "../../store/useUserStore";
import Layout from "../../components/layout";
import { toast } from "react-toastify"; // ✅ add toast import if using react-toastify
import { FaComment, FaQuestionCircle, FaUser } from "react-icons/fa";
import { logoutUser } from "../services/user.services";

function Settinng() {
  const [isThemeDialogopen, setIsThemeDialogOpen] = useState(false);
  const { theme } = useThemeStore();
  const { user, clearUser } = useUserStore();

  const toggleThemeDialog = () => {
    setIsThemeDialogOpen(!isThemeDialogopen);
  };

  const handelLogout = async () => {
    try {
      await logoutUser();
      clearUser();
      toast.success("User logged out successfully");
    } catch (error) {
      console.error("Failed to logout", error);
    }
  };

  return (
    <>
      <Layout
        isThemeDialogOpen={isThemeDialogopen}
        toggleThemeDialog={toggleThemeDialog}
      />

      {/* Main container */}
      <div
        className={` h-screen absolute top-0 left-20   pt-10 ${
          theme === "dark"
            ? "bg-[rgb(17,27,33)] text-white"
            : "bg-white text-black"
        }`}
      >
        <div
          className={`w-[400px] border rounded-2xl shadow-lg p-6 ${
            theme === "dark" ? "border-gray-600" : "border-gray-200"
          }`}
        >
          <h1 className="text-2xl font-semibold mb-6 text-center">Settings</h1>

          {/* User Info */}
          <div
            className={`flex items-center gap-4 p-3 ${
              theme === "dark" ? "hover:bg-[#202c33]" : "hover:bg-gray-100"
            }`}
          >
            <img
              src={user.profilePicture}
              alt="profile"
              className="w-14 h-14 rouded-full  "
            />
            <div className="">
              <h2 className="font-semibold">{user?.username}</h2>
              <p className="text-sm text-gray-400">{user?.about}</p>
            </div>
          </div>

          {/* menu items */}
          <div className="h-[calc(100vh-280px)] overflow-y-auto">
            <div className="space-y-1">
              {[
                { icon: FaUser, label: "Account", href: "/user-profile" },
                { icon: FaComment, label: "Chats", href: "/" },
                { icon: FaQuestionCircle, label: "Help", href: "/help" },
              ].map((item, index) => (
                <a
                  key={index}
                  href={item.href}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer
          ${theme === "dark" ? "hover:bg-[#202c33]" : "hover:bg-gray-100"}
        `}
                >
                  <item.icon className="text-lg" />
                  <span>{item.label}</span>
                </a>
              ))}
              {/* Actions */}{" "}
              <div className="flex flex-col gap-3">
                {" "}
                <button
                  onClick={toggleThemeDialog}
                  className={`py-2 px-4 rounded-xl ${
                    theme === "dark"
                      ? "bg-gray-700 hover:bg-gray-600"
                      : "bg-gray-200 hover:bg-gray-300"
                  }`}
                >
                  {" "}
                  Change Theme{" "}
                </button>
                <button
                  onClick={handelLogout}
                  className="py-2 px-4 rounded-xl bg-red-500 text-white hover:bg-red-600"
                >
                  {" "}
                  Logout{" "}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Settinng;
