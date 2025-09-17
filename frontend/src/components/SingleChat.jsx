import React from "react";
import { FormControl } from "@chakra-ui/form-control";
import { Input } from "@chakra-ui/input";
import { Box, Text } from "@chakra-ui/layout";
import "./styles.css";
import {
  IconButton,
  Spinner,
  useToast,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Button,
  Badge,
  Tooltip,
} from "@chakra-ui/react";
import { getSender, getSenderFull } from "../config/ChatLogics";
import { useEffect, useState } from "react";
import axios from "axios";
import { ArrowBackIcon, LockIcon } from "@chakra-ui/icons";
import ProfileModal from "./miscellaneous/ProfileModal";
import ScrollableChat from "./ScrollableChat";
import Lottie from "react-lottie";
import animationData from "../animations/typing.json";
import EmojiPicker from "emoji-picker-react";

import io from "socket.io-client";
import UpdateGroupChatModal from "./miscellaneous/UpdateGroupChatModal";
import { ChatState } from "../Context/ChatProvider";

const ENDPOINT = import.meta.env.VITE_BACKEND_URL;

var socket, selectedChatCompare;

const SingleChat = ({ fetchAgain, setFetchAgain }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [socketConnected, setSocketConnected] = useState(false);
  const [typing, setTyping] = useState(false);
  const [istyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isViewOnceEnabled, setIsViewOnceEnabled] = useState(false); // New state for view-once toggle
  const toast = useToast();

  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: animationData,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice",
    },
  };

  const { selectedChat, setSelectedChat, user, notification, setNotification } =
    ChatState();

  const API_URL = import.meta.env.VITE_BACKEND_URL;

  const fetchMessages = async () => {
    if (!selectedChat) return;

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };

      setLoading(true);

      const { data } = await axios.get(
        `${API_URL}/api/message/${selectedChat._id}`,
        config
      );
      setMessages(data);
      setLoading(false);

      socket.emit("join chat", selectedChat._id);
    } catch (error) {
      toast({
        title: "Error Occured!",
        description: "Failed to Load the Messages",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
    }
  };

  const sendMessage = async (event) => {
    if (event.key === "Enter" && newMessage) {
      await handleSendMessage();
    }
  };

  const handleSendMessage = async () => {
    if (newMessage.trim()) {
      socket.emit("stop typing", selectedChat._id);
      try {
        const config = {
          headers: {
            "Content-type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
        };

        const messageContent = newMessage.trim();
        const isViewOnce = isViewOnceEnabled; // Use the toggle state

        setNewMessage("");
        setIsViewOnceEnabled(false); // Reset the toggle after sending

        const { data } = await axios.post(
          `${API_URL}/api/message`,
          {
            content: messageContent,
            chatId: selectedChat,
            isViewOnce: isViewOnce,
          },
          config
        );

        socket.emit("new message", data);
        setMessages([...messages, data]);

        if (isViewOnce) {
          toast({
            title: "View Once Message Sent! 🔒",
            description: "This message can only be viewed once",
            status: "info",
            duration: 3000,
            isClosable: true,
            position: "bottom",
          });
        }
      } catch (error) {
        toast({
          title: "Error Occurred!",
          description: "Failed to send the Message",
          status: "error",
          duration: 5000,
          isClosable: true,
          position: "bottom",
        });
      }
    }
  };

  const handleViewOnceMessage = async (messageId) => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };

      const { data } = await axios.get(
        `${API_URL}/api/message/view-once/${messageId}`,
        config
      );

      // Update the message in the local state
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg._id === messageId
            ? {
                ...msg,
                content: data.content,
                hasBeenViewed: true,
                viewedBy: data.viewedBy || [],
              }
            : msg
        )
      );

      // Emit socket event to update other users
      socket.emit("message viewed", {
        messageId,
        chatId: selectedChat._id,
        userId: user._id,
      });

      toast({
        title: "Message Viewed",
        description: "This message will disappear shortly",
        status: "info",
        duration: 2000,
        isClosable: true,
        position: "bottom",
      });

      // Remove the message after 5 seconds to allow reading time
      setTimeout(() => {
        setMessages((prevMessages) =>
          prevMessages.filter((msg) => msg._id !== messageId)
        );
      }, 5000);
    } catch (error) {
      toast({
        title: "Error!",
        description: error.response?.data?.message || "Failed to view message",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "bottom",
      });
    }
  };

  const handleEmojiClick = (emojiObject) => {
    setNewMessage((prev) => prev + emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  // Toggle view-once mode
  const toggleViewOnceMode = () => {
    setIsViewOnceEnabled(!isViewOnceEnabled);
    if (!isViewOnceEnabled) {
      toast({
        title: "View Once Mode Enabled 🔒",
        description: "Your next message will disappear after being viewed",
        status: "info",
        duration: 2000,
        isClosable: true,
        position: "bottom",
      });
    }
  };

  useEffect(() => {
    socket = io(ENDPOINT);
    socket.emit("setup", user);
    socket.on("connected", () => setSocketConnected(true));
    socket.on("typing", () => setIsTyping(true));
    socket.on("stop typing", () => setIsTyping(false));

    // Listen for view-once message events
    socket.on("message viewed", ({ messageId, userId }) => {
      if (userId !== user._id) {
        // Update message state to show it's been viewed
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg._id === messageId
              ? {
                  ...msg,
                  hasBeenViewed: true,
                  viewedBy: [...(msg.viewedBy || []), userId],
                }
              : msg
          )
        );

        // Remove the message after 5 seconds
        setTimeout(() => {
          setMessages((prevMessages) =>
            prevMessages.filter((msg) => msg._id !== messageId)
          );
        }, 5000);
      }
    });

    // Cleanup function
    return () => {
      socket.off("connected");
      socket.off("typing");
      socket.off("stop typing");
      socket.off("message viewed");
    };
  }, [user]);

  useEffect(() => {
    fetchMessages();
    selectedChatCompare = selectedChat;
  }, [selectedChat]);

  useEffect(() => {
    socket.on("message recieved", (newMessageRecieved) => {
      if (
        !selectedChatCompare ||
        selectedChatCompare._id !== newMessageRecieved.chat._id
      ) {
        if (!notification.includes(newMessageRecieved)) {
          setNotification([newMessageRecieved, ...notification]);
          setFetchAgain(!fetchAgain);
        }
      } else {
        setMessages([...messages, newMessageRecieved]);
      }
    });
  });

  const typingHandler = (e) => {
    setNewMessage(e.target.value);

    if (!socketConnected) return;

    if (!typing) {
      setTyping(true);
      socket.emit("typing", selectedChat._id);
    }
    let lastTypingTime = new Date().getTime();
    var timerLength = 3000;
    setTimeout(() => {
      var timeNow = new Date().getTime();
      var timeDiff = timeNow - lastTypingTime;
      if (timeDiff >= timerLength && typing) {
        socket.emit("stop typing", selectedChat._id);
        setTyping(false);
      }
    }, timerLength);
  };

  return (
    <>
      {selectedChat ? (
        <>
          <Text
            fontSize={{ base: "28px", md: "30px" }}
            pb={3}
            px={2}
            w="100%"
            fontFamily="'Poppins','sans-serif'"
            display="flex"
            color="#2C3E50"
            justifyContent={{ base: "space-between" }}
            alignItems="center"
            borderBottom="1px solid #E0E0E0"
          >
            {messages &&
              (!selectedChat.isGroupChat ? (
                <>
                  {getSender(user, selectedChat.users)}
                  <ProfileModal
                    user={getSenderFull(user, selectedChat.users)}
                  />
                </>
              ) : (
                <>
                  {selectedChat.chatName.toUpperCase()}
                  <UpdateGroupChatModal
                    fetchMessages={fetchMessages}
                    fetchAgain={fetchAgain}
                    setFetchAgain={setFetchAgain}
                  />
                </>
              ))}
          </Text>
          <Box
            display="flex"
            flexDir="column"
            justifyContent="flex-end"
            p={4}
            bg="#F8FAFC"
            w="100%"
            h="100%"
            overflowY="hidden"
          >
            {loading ? (
              <Spinner
                size="xl"
                w={20}
                h={20}
                color="blue.500"
                alignSelf="center"
                margin="auto"
              />
            ) : (
              <div className="messages">
                <ScrollableChat
                  messages={messages}
                  onViewOnceClick={handleViewOnceMessage}
                />
              </div>
            )}

            <FormControl id="first-name" isRequired mt={3}>
              {istyping && (
                <div>
                  <Lottie
                    options={defaultOptions}
                    width={70}
                    style={{ marginBottom: 15, marginLeft: 0 }}
                  />
                </div>
              )}

              {/* View Once Helper Text */}
              {isViewOnceEnabled && (
                <Box
                  mb={2}
                  p={3}
                  bg="purple.50"
                  border="1px solid"
                  borderColor="purple.200"
                  borderRadius="lg"
                  fontSize="sm"
                  color="purple.700"
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <Box display="flex" alignItems="center">
                    <Text fontSize="16px" mr={2}>
                      🔒
                    </Text>
                    <Text fontWeight="medium">
                      View-once mode enabled - message will disappear after
                      viewing
                    </Text>
                  </Box>
                  <Button
                    size="xs"
                    variant="ghost"
                    colorScheme="purple"
                    onClick={() => setIsViewOnceEnabled(false)}
                    _hover={{ bg: "purple.100" }}
                  >
                    Cancel
                  </Button>
                </Box>
              )}

              <Box display="flex" alignItems="center" gap="2">
                {/* Emoji Picker */}
                <Popover
                  isOpen={showEmojiPicker}
                  onClose={() => setShowEmojiPicker(false)}
                  placement="top-start"
                >
                  <PopoverTrigger>
                    <IconButton
                      aria-label="Select emoji"
                      icon={<Text fontSize="20px">😊</Text>}
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      variant="ghost"
                      colorScheme="gray"
                      borderRadius="full"
                      _hover={{ bg: "gray.100" }}
                      size="md"
                    />
                  </PopoverTrigger>
                  <PopoverContent w="350px" p={0}>
                    <EmojiPicker
                      onEmojiClick={handleEmojiClick}
                      width="100%"
                      height="350px"
                      searchDisabled={false}
                      skinTonesDisabled={false}
                      previewConfig={{
                        showPreview: false,
                      }}
                      lazyLoadEmojis={true}
                    />
                  </PopoverContent>
                </Popover>

                {/* View Once Toggle Button */}
                <Tooltip
                  label={
                    isViewOnceEnabled
                      ? "View-once enabled (click to disable)"
                      : "Enable view-once message"
                  }
                  placement="top"
                >
                  <IconButton
                    aria-label="Toggle view-once message"
                    icon={<LockIcon />}
                    onClick={toggleViewOnceMode}
                    variant={isViewOnceEnabled ? "solid" : "ghost"}
                    colorScheme={isViewOnceEnabled ? "purple" : "gray"}
                    borderRadius="full"
                    _hover={{
                      bg: isViewOnceEnabled ? "purple.600" : "gray.100",
                    }}
                    size="md"
                    bg={isViewOnceEnabled ? "purple.500" : "transparent"}
                    color={isViewOnceEnabled ? "white" : "gray.500"}
                    boxShadow={isViewOnceEnabled ? "md" : "none"}
                  />
                </Tooltip>

                <Input
                  variant="filled"
                  bg="white"
                  placeholder={
                    isViewOnceEnabled
                      ? "Type your disappearing message..."
                      : "Type a message..."
                  }
                  value={newMessage}
                  onChange={typingHandler}
                  onKeyDown={sendMessage}
                  borderColor={isViewOnceEnabled ? "purple.200" : "#D1D5DB"}
                  _hover={{
                    borderColor: isViewOnceEnabled ? "purple.300" : "#A0AEC0",
                  }}
                  _focus={{
                    borderColor: isViewOnceEnabled ? "purple.400" : "blue.400",
                    boxShadow: `0 0 5px ${
                      isViewOnceEnabled ? "purple.400" : "blue.400"
                    }`,
                  }}
                  borderRadius="lg"
                  fontFamily="'Poppins', sans-serif"
                  fontSize="16px"
                  color="#34495E"
                  p={4}
                />

                <IconButton
                  colorScheme={isViewOnceEnabled ? "purple" : "blue"}
                  aria-label="Send message"
                  icon={<ArrowBackIcon transform="rotate(90deg)" />}
                  onClick={handleSendMessage}
                  isDisabled={!newMessage.trim()}
                  borderRadius="full"
                  _hover={{
                    bg: isViewOnceEnabled ? "purple.600" : "blue.600",
                  }}
                  boxShadow="base"
                />
              </Box>
            </FormControl>
          </Box>
        </>
      ) : (
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          h="100%"
          bg="#F8FAFC"
          p={6}
        >
          <Text
            fontSize="3xl"
            pb={3}
            fontFamily="'Poppins','sans-serif'"
            fontWeight="medium"
            color="hsl(224, 58%, 25%)"
            textAlign="center"
          >
            Click on a user to start chatting..
          </Text>
        </Box>
      )}
    </>
  );
};

export default SingleChat;
