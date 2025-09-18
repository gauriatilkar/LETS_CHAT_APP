import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

const ChatContext = createContext();

const ChatProvider = ({ children }) => {
  const [selectedChat, setSelectedChat] = useState();
  const [user, setUser] = useState();
  const [notification, setNotification] = useState([]);
  const [chats, setChats] = useState([]);

  const navigate = useNavigate();
  const location = useLocation();

  const API_URL = import.meta.env.VITE_BACKEND_URL;



  useEffect(() => {
    // Debug: Check localStorage before parsing
    const rawUserInfo = localStorage.getItem("userInfo");

    let userInfo = null;
    try {
      userInfo = JSON.parse(rawUserInfo);
    } catch (error) {
      console.error("Error parsing userInfo from localStorage:", error);
    }

    setUser(userInfo);

    const publicPaths = ["/", "/forgot-password", "/reset-password"];
    const isPublic = publicPaths.some((path) =>
      location.pathname.includes(path)
    );

 ;

    if (!userInfo && !isPublic) {
      navigate("/");
    } 
  }, [navigate, location]);

  const fetchChats = async (token) => {

    

   

    const url = `${API_URL}/api/chat`;
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

   

    try {
      const response = await axios.get(url, { headers });
      setChats(response.data);
    } catch (error) {
      console.error("Error object:", error);


    }
  };

 

  return (
    <ChatContext.Provider
      value={{
        selectedChat,
        setSelectedChat,
        user,
        setUser,
        notification,
        setNotification,
        chats,
        setChats,
        fetchChats,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const ChatState = () => {
  return useContext(ChatContext);
};

export default ChatProvider;
