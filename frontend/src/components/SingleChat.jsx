import React from "react";
import { FormControl } from "@chakra-ui/form-control";
import { Textarea } from "@chakra-ui/react";
import { Box, Text, VStack, HStack, AspectRatio } from "@chakra-ui/layout";
import { Image } from "@chakra-ui/react";
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
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Progress,
  Flex,
  CloseButton,
} from "@chakra-ui/react";
import { getSender, getSenderFull } from "../config/ChatLogics";
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { ArrowBackIcon, LockIcon, AttachmentIcon } from "@chakra-ui/icons";
import { FiImage, FiVideo, FiCamera } from "react-icons/fi";
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
  const [isViewOnceEnabled, setIsViewOnceEnabled] = useState(false);

  // Media handling states
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [showMediaOptions, setShowMediaOptions] = useState(false);

  const fileInputRef = useRef();
  const textareaRef = useRef();
  const { isOpen, onOpen, onClose } = useDisclosure();
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

  // Helper function to check if text contains only emojis
  const isOnlyEmojis = (text) => {
    const emojiRegex =
      /^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F|\p{Emoji_Modifier_Base})+$/gu;
    return emojiRegex.test(text.trim());
  };

  // Handle file selection
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select a file smaller than 50MB",
          status: "error",
          duration: 3000,
          isClosable: true,
          position: "bottom",
        });
        return;
      }

      // Validate file type
      const validTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
        "video/mp4",
        "video/webm",
        "video/ogg",
        "video/mov",
        "video/avi",
      ];

      if (!validTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please select an image or video file",
          status: "error",
          duration: 3000,
          isClosable: true,
          position: "bottom",
        });
        return;
      }

      setSelectedMedia(file);
      setMediaType(file.type.startsWith("image/") ? "image" : "video");

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setMediaPreview(e.target.result);
        onOpen(); // Open preview modal
      };
      reader.readAsDataURL(file);
    }
    setShowMediaOptions(false);
  };

  // Upload media to Cloudinary
  const uploadToCloudinary = async (file) => {
    return new Promise((resolve, reject) => {
      const data = new FormData();
      data.append("file", file);
      data.append("upload_preset", "chat-app"); // Use your upload preset

      // Determine the cloudinary endpoint based on file type
      const isVideo = file.type.startsWith("video/");
      const cloudinaryUrl = isVideo
        ? "https://api.cloudinary.com/v1_1/dwdhel37o/video/upload"
        : "https://api.cloudinary.com/v1_1/dwdhel37o/image/upload";

      // Use XMLHttpRequest to track upload progress
      const xhr = new XMLHttpRequest();

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded * 100) / event.total);
          setUploadProgress(progress);
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          resolve(response.secure_url);
        } else {
          reject(new Error("Upload failed"));
        }
      };

      xhr.onerror = () => {
        reject(new Error("Upload failed"));
      };

      xhr.open("POST", cloudinaryUrl);
      xhr.send(data);
    });
  };

  // Send media message
  const sendMediaMessage = async () => {
    if (!selectedMedia) return;

    setIsUploading(true);
    try {
      // Upload to Cloudinary first
      const mediaUrl = await uploadToCloudinary(selectedMedia);

      // Send message with media URL
      const config = {
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
      };

      const { data } = await axios.post(
        `${API_URL}/api/message`,
        {
          content: mediaUrl, // Store the Cloudinary URL as content
          chatId: selectedChat._id,
          isViewOnce: isViewOnceEnabled,
          mediaType: mediaType, // Add media type to distinguish from text
        },
        config
      );

      // Emit socket event
      socket.emit("new message", data);
      setMessages([...messages, data]);

      // Reset states
      setSelectedMedia(null);
      setMediaPreview(null);
      setMediaType(null);
      setIsViewOnceEnabled(false);
      setUploadProgress(0);
      onClose();

      toast({
        title: `${
          mediaType === "image" ? "Image" : "Video"
        } sent successfully!`,
        status: "success",
        duration: 2000,
        isClosable: true,
        position: "bottom",
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error.response?.data?.message || "Failed to send media",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Updated sendMessage function to handle Shift+Enter
  const sendMessage = async (event) => {
    // If Shift+Enter is pressed, allow line break (don't send message)
    if (event.shiftKey && event.key === "Enter") {
      return; // Let the default behavior happen (add new line)
    }

    // If just Enter is pressed (without Shift), send the message
    if (event.key === "Enter" && newMessage.trim()) {
      event.preventDefault(); // Prevent default to avoid adding new line
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
        const isViewOnce = isViewOnceEnabled;
        const onlyEmojis = isOnlyEmojis(messageContent);

        setNewMessage("");
        setIsViewOnceEnabled(false);

        const { data } = await axios.post(
          `${API_URL}/api/message`,
          {
            content: messageContent,
            chatId: selectedChat,
            isViewOnce: isViewOnce,
            isOnlyEmojis: onlyEmojis, // Add this field to identify emoji-only messages
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
    // Focus back to textarea
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

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

  // Close media preview
  const closeMediaPreview = () => {
    setSelectedMedia(null);
    setMediaPreview(null);
    setMediaType(null);
    setUploadProgress(0);
    onClose();
  };

  // Auto-resize textarea
  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  };

  useEffect(() => {
    socket = io(ENDPOINT);
    socket.emit("setup", user);
    socket.on("connected", () => setSocketConnected(true));
    socket.on("typing", () => setIsTyping(true));
    socket.on("stop typing", () => setIsTyping(false));

    socket.on("message viewed", ({ messageId, userId }) => {
      if (userId !== user._id) {
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

        setTimeout(() => {
          setMessages((prevMessages) =>
            prevMessages.filter((msg) => msg._id !== messageId)
          );
        }, 5000);
      }
    });

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

  useEffect(() => {
    adjustTextareaHeight();
  }, [newMessage]);

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
                    currentUser={user}
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

              <Box display="flex" alignItems="flex-end" gap="2">
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

                {/* Media Attachment Options */}
                <Popover
                  isOpen={showMediaOptions}
                  onClose={() => setShowMediaOptions(false)}
                  placement="top"
                >
                  <PopoverTrigger>
                    <IconButton
                      aria-label="Attach media"
                      icon={<AttachmentIcon />}
                      onClick={() => setShowMediaOptions(!showMediaOptions)}
                      variant="ghost"
                      colorScheme="gray"
                      borderRadius="full"
                      _hover={{ bg: "gray.100" }}
                      size="md"
                    />
                  </PopoverTrigger>
                  <PopoverContent w="200px" p={2}>
                    <VStack spacing={1}>
                      <Button
                        leftIcon={<FiImage />}
                        variant="ghost"
                        justifyContent="flex-start"
                        w="100%"
                        onClick={() => {
                          fileInputRef.current.accept = "image/*";
                          fileInputRef.current.click();
                        }}
                        _hover={{ bg: "blue.50" }}
                      >
                        Photo
                      </Button>
                      <Button
                        leftIcon={<FiVideo />}
                        variant="ghost"
                        justifyContent="flex-start"
                        w="100%"
                        onClick={() => {
                          fileInputRef.current.accept = "video/*";
                          fileInputRef.current.click();
                        }}
                        _hover={{ bg: "blue.50" }}
                      >
                        Video
                      </Button>
                      <Button
                        leftIcon={<FiCamera />}
                        variant="ghost"
                        justifyContent="flex-start"
                        w="100%"
                        onClick={() => {
                          fileInputRef.current.accept = "image/*,video/*";
                          fileInputRef.current.click();
                        }}
                        _hover={{ bg: "blue.50" }}
                      >
                        Camera
                      </Button>
                    </VStack>
                  </PopoverContent>
                </Popover>

                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: "none" }}
                  onChange={handleFileSelect}
                />

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

                {/* Textarea for message input */}
                <Textarea
                  ref={textareaRef}
                  variant="filled"
                  bg="white"
                  placeholder={
                    isViewOnceEnabled
                      ? "Type your disappearing message..."
                      : "Type a message... "
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
                  minH="50px"
                  maxH="120px"
                  resize="none"
                  rows={1}
                  overflow="hidden"
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
                  size="md"
                />
              </Box>
            </FormControl>
          </Box>

          {/* Media Preview Modal */}
          <Modal isOpen={isOpen} onClose={closeMediaPreview} size="xl">
            <ModalOverlay bg="blackAlpha.800" />
            <ModalContent maxW="600px" bg="white">
              <ModalHeader>
                <Flex alignItems="center" justifyContent="space-between">
                  <Text>
                    Send {mediaType === "image" ? "Photo" : "Video"}
                    {isViewOnceEnabled && (
                      <Badge ml={2} colorScheme="purple">
                        View Once 🔒
                      </Badge>
                    )}
                  </Text>
                  <CloseButton onClick={closeMediaPreview} />
                </Flex>
              </ModalHeader>

              <ModalBody pb={6}>
                <VStack spacing={4}>
                  {/* Media Preview */}
                  <Box
                    w="100%"
                    maxH="400px"
                    bg="gray.50"
                    borderRadius="lg"
                    overflow="hidden"
                    position="relative"
                  >
                    {mediaType === "image" ? (
                      <Image
                        src={mediaPreview}
                        alt="Preview"
                        w="100%"
                        h="auto"
                        maxH="400px"
                        objectFit="contain"
                      />
                    ) : (
                      <AspectRatio ratio={16 / 9} maxH="400px">
                        <video
                          src={mediaPreview}
                          controls
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "contain",
                          }}
                        />
                      </AspectRatio>
                    )}
                  </Box>

                  {/* Upload Progress */}
                  {isUploading && (
                    <Box w="100%">
                      <Text fontSize="sm" color="gray.600" mb={2}>
                        Uploading to Cloudinary... {uploadProgress}%
                      </Text>
                      <Progress
                        value={uploadProgress}
                        colorScheme="blue"
                        borderRadius="full"
                      />
                    </Box>
                  )}

                  {/* View Once Toggle */}
                  <HStack w="100%" justifyContent="space-between">
                    <Button
                      leftIcon={<LockIcon />}
                      variant={isViewOnceEnabled ? "solid" : "outline"}
                      colorScheme="purple"
                      onClick={toggleViewOnceMode}
                      size="sm"
                    >
                      {isViewOnceEnabled
                        ? "View Once Enabled"
                        : "Enable View Once"}
                    </Button>
                  </HStack>

                  {/* Action Buttons */}
                  <HStack spacing={4} w="100%" justifyContent="flex-end">
                    <Button
                      variant="ghost"
                      onClick={closeMediaPreview}
                      disabled={isUploading}
                    >
                      Cancel
                    </Button>
                    <Button
                      colorScheme={isViewOnceEnabled ? "purple" : "blue"}
                      onClick={sendMediaMessage}
                      isLoading={isUploading}
                      loadingText="Sending..."
                      leftIcon={<ArrowBackIcon transform="rotate(90deg)" />}
                    >
                      Send
                    </Button>
                  </HStack>
                </VStack>
              </ModalBody>
            </ModalContent>
          </Modal>
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
