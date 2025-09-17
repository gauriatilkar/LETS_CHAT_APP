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
  const location = useLocation(); // <-- MOVE inside the component

  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem("userInfo"));
    setUser(userInfo);

    const publicPaths = ["/", "/forgot-password", "/reset-password"];
    const isPublic = publicPaths.some((path) =>
      location.pathname.includes(path)
    );

    if (!userInfo && !isPublic) {
      navigate("/"); // Redirect only if user not logged in and not on public route
    } else if (userInfo) {
      fetchChats(userInfo.token); // Fetch chats when user info is available
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, location]);

  const fetchChats = async (token) => {
    try {
      const response = await axios.get(`${API_URL}/api/chats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setChats(response.data);
    } catch (error) {
      console.error("Failed to fetch chats", error);
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
