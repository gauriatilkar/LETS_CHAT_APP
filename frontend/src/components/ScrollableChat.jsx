import React, { useState } from "react";
import { Avatar } from "@chakra-ui/avatar";
import { Tooltip } from "@chakra-ui/tooltip";
import {
  Box,
  Text,
  Button,
  Badge,
  Image,
  AspectRatio,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  IconButton,
  HStack,
  VStack,
  useToast,
  Textarea,
  useBreakpointValue,
} from "@chakra-ui/react";
import { ViewIcon, CheckIcon, CloseIcon } from "@chakra-ui/icons";
import ScrollableFeed from "react-scrollable-feed";
import {
  isLastMessage,
  isSameSender,
  isSameSenderMargin,
  isSameUser,
} from "../config/ChatLogics";
import { ChatState } from "../Context/ChatProvider";
import MessageContextMenu from "./MessageContextMenu";
import WhatsAppReply from "./ReplyPreview";
import ReadReceiptIndicator from "./ReadReceiptIndicator";
import axios from "axios";

const ScrollableChat = ({
  messages,
  onViewOnceClick,
  onReply,
  onMessageUpdate,
  onMessageDelete,
  selectedChat,
}) => {
  const { user } = ChatState();
  const [viewedMessages, setViewedMessages] = useState(new Set());
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [isEditingLoading, setIsEditingLoading] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [selectedMediaType, setSelectedMediaType] = useState(null);
  const toast = useToast();

  // Mobile responsive values
  const isMobile = useBreakpointValue({ base: true, md: false });
  const avatarSize = useBreakpointValue({ base: "xs", md: "sm" });
  const messagePadding = useBreakpointValue({
    base: "6px 12px",
    md: "8px 15px",
  });
  const borderRadius = useBreakpointValue({ base: "16px", md: "20px" });
  const maxMessageWidth = useBreakpointValue({ base: "85%", md: "75%" });
  const fontSize = useBreakpointValue({ base: "13px", md: "14px" });
  const timestampFontSize = useBreakpointValue({ base: "9px", md: "10px" });

  const API_URL = import.meta.env.VITE_BACKEND_URL;

  // Inline editing functions
  const handleStartEdit = (message) => {
    setEditingMessageId(message._id);
    setEditContent(message.content);
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim()) {
      toast({
        title: "Message cannot be empty",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (
      editContent.trim() ===
      messages.find((m) => m._id === editingMessageId)?.content
    ) {
      setEditingMessageId(null);
      return;
    }

    setIsEditingLoading(true);
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
          "Content-Type": "application/json",
        },
      };

      const { data } = await axios.put(
        `${API_URL}/api/message/edit/${editingMessageId}`,
        { content: editContent.trim() },
        config
      );

      onMessageUpdate(data);
      setEditingMessageId(null);
      toast({
        title: "Message edited successfully",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Error editing message",
        description: error.response?.data?.message || "Something went wrong",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
    setIsEditingLoading(false);
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditContent("");
  };

  // Delete modal functions
  const handleDeleteClick = (message) => {
    setMessageToDelete(message);
    setDeleteModalOpen(true);
  };

  const handleDelete = async (deleteFor) => {
    setDeleteLoading(true);
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
          "Content-Type": "application/json",
        },
      };

      await axios.delete(
        `${API_URL}/api/message/delete/${messageToDelete._id}`,
        {
          ...config,
          data: { deleteFor },
        }
      );

      onMessageDelete(messageToDelete._id, deleteFor);
      setDeleteModalOpen(false);
      setMessageToDelete(null);

      toast({
        title: `Message deleted ${
          deleteFor === "everyone" ? "for everyone" : "for you"
        }`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Error deleting message",
        description: error.response?.data?.message || "Something went wrong",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
    setDeleteLoading(false);
  };

  const handleViewOnceClick = async (messageId) => {
    if (onViewOnceClick) {
      await onViewOnceClick(messageId);
      setViewedMessages((prev) => new Set([...prev, messageId]));
    }
  };

  // Function to check if text contains only emojis
  const isOnlyEmojis = (text) => {
    if (!text || typeof text !== "string") return false;
    const emojiRegex =
      /^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F|\p{Emoji_Modifier_Base}|\s)+$/gu;
    return emojiRegex.test(text.trim());
  };

  // Function to open media in full screen modal
  const openMediaModal = (content, mediaType) => {
    setSelectedMedia(content);
    setSelectedMediaType(mediaType);
    onOpen();
  };

  // Function to check if the content is a Cloudinary URL
  const isCloudinaryUrl = (content) => {
    return content && content.includes("cloudinary.com");
  };

  // Function to determine if it's an image or video URL
  const getMediaTypeFromUrl = (url) => {
    if (!url) return "text";
    const videoExtensions = [".mp4", ".webm", ".ogg", ".mov", ".avi"];
    const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];

    const urlLower = url.toLowerCase();

    if (videoExtensions.some((ext) => urlLower.includes(ext))) {
      return "video";
    } else if (imageExtensions.some((ext) => urlLower.includes(ext))) {
      return "image";
    } else if (urlLower.includes("/video/")) {
      return "video";
    } else if (urlLower.includes("/image/")) {
      return "image";
    }

    return "text";
  };

  // Function to enhance emojis in text content
  const enhanceEmojisInText = (text) => {
    if (!text || typeof text !== "string") return text;

    const emojiRegex =
      /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F|\p{Emoji_Modifier_Base})/gu;

    const parts = text.split(emojiRegex);

    return parts.map((part, index) => {
      if (emojiRegex.test(part)) {
        return (
          <span
            key={index}
            style={{
              fontSize: isMobile ? "1.2em" : "1.4em",
              lineHeight: "1.2",
              display: "inline-block",
              margin: "0 1px",
            }}
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  const renderMessageContent = (message) => {
    const {
      content,
      mediaType,
      isOnlyEmojis: messageIsOnlyEmojis,
      isDeleted,
      deleteType,
    } = message;

    // Show deleted message placeholder
    if (isDeleted && deleteType === "everyone") {
      return (
        <Text fontSize={fontSize} color="gray.500" fontStyle="italic">
          🚫 This message was deleted
        </Text>
      );
    }

    // If message is being edited
    if (editingMessageId === message._id) {
      return (
        <HStack spacing={2} align="flex-start" w="100%">
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSaveEdit();
              } else if (e.key === "Escape") {
                handleCancelEdit();
              }
            }}
            size={isMobile ? "xs" : "sm"}
            bg="rgba(255,255,255,0.9)"
            borderColor="blue.300"
            _focus={{ borderColor: "blue.400" }}
            resize="none"
            minH={isMobile ? "35px" : "40px"}
            maxH={isMobile ? "100px" : "120px"}
            fontSize={fontSize}
            fontFamily="'Poppins', sans-serif"
            placeholder="Edit your message..."
            autoFocus
          />
          <VStack spacing={1}>
            <IconButton
              icon={<CheckIcon />}
              size={isMobile ? "xs" : "sm"}
              colorScheme="green"
              onClick={handleSaveEdit}
              isLoading={isEditingLoading}
              aria-label="Save edit"
            />
            <IconButton
              icon={<CloseIcon />}
              size={isMobile ? "xs" : "sm"}
              variant="ghost"
              onClick={handleCancelEdit}
              aria-label="Cancel edit"
            />
          </VStack>
        </HStack>
      );
    }

    // If it's a media message or Cloudinary URL
    if ((mediaType && mediaType !== "text") || isCloudinaryUrl(content)) {
      const actualMediaType = mediaType || getMediaTypeFromUrl(content);

      if (actualMediaType === "image") {
        return (
          <Box
            position="relative"
            cursor="pointer"
            onClick={() => openMediaModal(content, "image")}
          >
            <Image
              src={content}
              alt="Shared image"
              maxW={isMobile ? "250px" : "300px"}
              maxH={isMobile ? "150px" : "200px"}
              minW={isMobile ? "150px" : "200px"}
              minH={isMobile ? "100px" : "150px"}
              borderRadius={isMobile ? "8px" : "12px"}
              objectFit="cover"
              transition="all 0.2s"
              _hover={{
                transform: isMobile ? "none" : "scale(1.02)",
                boxShadow: isMobile ? "none" : "lg",
              }}
              fallback={
                <Text fontSize={fontSize} color="gray.500">
                  Image failed to load
                </Text>
              }
            />
            <Box
              position="absolute"
              top="4px"
              right="4px"
              bg="blackAlpha.600"
              borderRadius="full"
              p="1"
            >
              <ViewIcon color="white" boxSize={isMobile ? "10px" : "12px"} />
            </Box>
          </Box>
        );
      } else if (actualMediaType === "video") {
        return (
          <Box position="relative">
            <AspectRatio
              ratio={16 / 9}
              maxW={isMobile ? "350px" : "450px"}
              minW={isMobile ? "250px" : "300px"}
            >
              <video
                src={content}
                controls
                preload="metadata"
                style={{
                  borderRadius: isMobile ? "8px" : "12px",
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  cursor: "pointer",
                }}
                onClick={(e) => {
                  e.stopPropagation();
                }}
                onDoubleClick={() => openMediaModal(content, "video")}
              >
                Your browser does not support the video tag.
              </video>
            </AspectRatio>
            <IconButton
              icon={<ViewIcon />}
              size={isMobile ? "xs" : "sm"}
              position="absolute"
              top="8px"
              right="8px"
              bg="blackAlpha.600"
              color="white"
              borderRadius="full"
              _hover={{ bg: "blackAlpha.800" }}
              onClick={() => openMediaModal(content, "video")}
              aria-label="View video in full screen"
            />
          </Box>
        );
      }
    }

    // Check if message contains only emojis
    const onlyEmojis = messageIsOnlyEmojis || isOnlyEmojis(content);

    // Render text content with proper styling for emojis and line breaks
    if (onlyEmojis) {
      return (
        <Text
          fontSize={isMobile ? "2rem" : "2.5rem"}
          lineHeight="1.2"
          whiteSpace="pre-wrap"
          textAlign="center"
          py="4px"
        >
          {content}
        </Text>
      );
    } else {
      return (
        <Text
          fontSize={fontSize}
          lineHeight="1.4"
          whiteSpace="pre-wrap"
          fontFamily="'Poppins', sans-serif"
          textAlign="left"
        >
          {enhanceEmojisInText(content)}
        </Text>
      );
    }
  };

  const handleReply = (message) => {
    onReply(message);
  };

  const handleEdit = (message) => {
    handleStartEdit(message);
  };

  const handleDeleteFromMenu = (message) => {
    handleDeleteClick(message);
  };

  const renderMessage = (m, i) => {
    const isCurrentUser = m.sender._id === user._id;
    const isViewed = viewedMessages.has(m._id) || m.hasBeenViewed;
    const hasViewedBy = m.viewedBy && m.viewedBy.length > 0;
    const onlyEmojis = m.isOnlyEmojis || isOnlyEmojis(m.content);

    // Don't render messages deleted by sender for the sender
    if (m.deletedBySender && isCurrentUser) {
      return null;
    }

    // If it's a view-once message and hasn't been viewed yet by current user
    if (m.isViewOnce && !isViewed && !isCurrentUser && !hasViewedBy) {
      return (
        <div
          style={{
            display: "flex",
            marginBottom: isMobile ? "8px" : "10px",
          }}
          key={m._id}
        >
          {(isSameSender(messages, m, i, user._id) ||
            isLastMessage(messages, i, user._id)) && (
            <Tooltip label={m.sender.name} placement="bottom-start" hasArrow>
              <Avatar
                mt="7px"
                mr={1}
                size={avatarSize}
                cursor="pointer"
                name={m.sender.name}
                src={m.sender.pic}
              />
            </Tooltip>
          )}
          <Box
            bg="purple.50"
            border="2px dashed"
            borderColor="purple.300"
            borderRadius={borderRadius}
            p={isMobile ? 2 : 3}
            maxWidth={maxMessageWidth}
            marginLeft={isSameSenderMargin(messages, m, i, user._id)}
            marginTop={isSameUser(messages, m, i, user._id) ? 3 : 10}
            position="relative"
          >
            <Text fontSize={fontSize} color="purple.600" mb={2}>
              Tap to view this{" "}
              {m.mediaType === "image"
                ? "photo"
                : m.mediaType === "video"
                ? "video"
                : "message"}{" "}
              once
            </Text>
            <Button
              size={isMobile ? "xs" : "sm"}
              colorScheme="purple"
              variant="solid"
              onClick={() => handleViewOnceClick(m._id)}
              borderRadius="full"
              fontSize={isMobile ? "xs" : "sm"}
            >
              👁️ View{" "}
              {m.mediaType === "image"
                ? "Photo"
                : m.mediaType === "video"
                ? "Video"
                : "Message"}
            </Button>
          </Box>
        </div>
      );
    }

    // If it's a view-once message that has been viewed
    if (m.isViewOnce && (isViewed || hasViewedBy)) {
      return (
        <div
          style={{
            display: "flex",
            marginBottom: isMobile ? "8px" : "10px",
          }}
          key={m._id}
        >
          {(isSameSender(messages, m, i, user._id) ||
            isLastMessage(messages, i, user._id)) && (
            <Tooltip label={m.sender.name} placement="bottom-start" hasArrow>
              <Avatar
                mt="7px"
                mr={1}
                size={avatarSize}
                cursor="pointer"
                name={m.sender.name}
                src={m.sender.pic}
                opacity={0.6}
              />
            </Tooltip>
          )}
          <Box
            bg={isCurrentUser ? "#E6FFFA" : "#F7FAFC"}
            borderRadius={borderRadius}
            p={isMobile ? 2 : 3}
            maxWidth="65%"
            marginLeft={isSameSenderMargin(messages, m, i, user._id)}
            marginTop={isSameUser(messages, m, i, user._id) ? 3 : 10}
            opacity={0.8}
            position="relative"
          >
            {!isCurrentUser && isViewed && <Box>{renderMessageContent(m)}</Box>}
            {isCurrentUser && (
              <Text fontSize={fontSize} color="gray.600" fontStyle="italic">
                View once{" "}
                {m.mediaType === "image"
                  ? "photo"
                  : m.mediaType === "video"
                  ? "video"
                  : "message"}{" "}
                sent
              </Text>
            )}
            <Text fontSize={timestampFontSize} color="gray.400" mt={1}>
              {new Date(m.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </Box>
        </div>
      );
    }

    // Regular message rendering
    return (
      <div
        style={{
          display: "flex",
          maxWidth: "100%",
          overflow: "hidden",
          position: "relative",
          marginBottom: isMobile ? "6px" : "8px",
        }}
        key={m._id}
        role="group"
      >
        {(isSameSender(messages, m, i, user._id) ||
          isLastMessage(messages, i, user._id)) && (
          <Tooltip label={m.sender.name} placement="bottom-start" hasArrow>
            <Avatar
              mt="7px"
              mr={1}
              size={avatarSize}
              cursor="pointer"
              name={m.sender.name}
              src={m.sender.pic}
            />
          </Tooltip>
        )}

        <Box
          style={{
            backgroundImage: onlyEmojis
              ? "none"
              : `${
                  m.sender._id === user._id
                    ? "linear-gradient(to right, hsl(217, 52%, 78%), hsl(224, 58%, 79%))"
                    : "linear-gradient(to right, hsl(210, 69%, 90%), hsl(210, 69%, 85%))"
                }`,
            backgroundColor: onlyEmojis ? "transparent" : undefined,
            marginLeft: isSameSenderMargin(messages, m, i, user._id),
            marginTop: isSameUser(messages, m, i, user._id) ? 3 : 10,
            borderRadius: onlyEmojis ? "0" : borderRadius,
            padding: onlyEmojis ? "4px 8px" : messagePadding,
            maxWidth: onlyEmojis ? "auto" : maxMessageWidth,
            position: "relative",
            display: "block",
            wordWrap: "break-word",
            boxShadow: onlyEmojis ? "none" : "sm",
          }}
        >
          {/* Message Context Menu */}
          <MessageContextMenu
            message={m}
            currentUser={user}
            onReply={handleReply}
            onEdit={handleEdit}
            onDelete={handleDeleteFromMenu}
            chatUsers={selectedChat?.users || []}
          />

          {m.isViewOnce && m.sender._id === user._id && !onlyEmojis && (
            <Badge
              colorScheme="purple"
              size="xs"
              mb={1}
              position="absolute"
              top="-8px"
              right="5px"
              fontSize={isMobile ? "7px" : "8px"}
            >
              🔒
            </Badge>
          )}

          {/* WhatsApp Style Reply Indicator */}
          {m.replyTo && (
            <WhatsAppReply replyTo={m.replyTo} currentUser={user} />
          )}

          {/* Message Content */}
          {renderMessageContent(m)}

          {/* Only show timestamp and read receipts for non-emoji-only messages */}
          {!onlyEmojis && (
            <div
              style={{
                fontSize: timestampFontSize,
                color: "rgba(0,0,0,0.5)",
                marginTop: "2px",
                textAlign: "right",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: "4px",
              }}
            >
              <span>
                {new Date(m.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>

              {/* Show read receipts for sent messages */}
              {m.sender._id === user._id && (
                <ReadReceiptIndicator
                  message={m}
                  chatUsers={selectedChat?.users || []}
                  currentUser={user}
                />
              )}

              {/* Show edited indicator */}
              {m.isEdited && (
                <span
                  style={{
                    fontStyle: "italic",
                    fontSize: isMobile ? "8px" : "9px",
                  }}
                >
                  edited
                </span>
              )}
            </div>
          )}
        </Box>
      </div>
    );
  };

  return (
    <>
      <ScrollableFeed
        style={{
          width: "100%",
          overflowX: "hidden",
          overflowY: "auto",
          maxWidth: "100%",
          minWidth: "0",
          padding: isMobile ? "8px" : "12px",
        }}
        className="scrollable-feed"
      >
        {Array.isArray(messages) && messages.map((m, i) => renderMessage(m, i))}
      </ScrollableFeed>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        size={isMobile ? "xs" : "md"}
      >
        <ModalOverlay />
        <ModalContent mx={isMobile ? 4 : "auto"}>
          <Box p={isMobile ? 4 : 6}>
            <Text fontSize={isMobile ? "md" : "lg"} fontWeight="bold" mb={4}>
              Delete Message
            </Text>
            <Text mb={4} color="gray.600" fontSize={isMobile ? "sm" : "md"}>
              Are you sure you want to delete this message?
            </Text>
            <VStack spacing={3}>
              <Button
                w="100%"
                variant="outline"
                colorScheme="red"
                onClick={() => handleDelete("sender")}
                isLoading={deleteLoading}
                size={isMobile ? "sm" : "md"}
              >
                Delete for me
              </Button>
              <Button
                w="100%"
                colorScheme="red"
                onClick={() => handleDelete("everyone")}
                isLoading={deleteLoading}
                size={isMobile ? "sm" : "md"}
              >
                Delete for everyone
              </Button>
              <Button
                w="100%"
                variant="ghost"
                onClick={() => setDeleteModalOpen(false)}
                size={isMobile ? "sm" : "md"}
              >
                Cancel
              </Button>
            </VStack>
          </Box>
        </ModalContent>
      </Modal>

      {/* Full Screen Media Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="full" isCentered>
        <ModalOverlay bg="blackAlpha.900" />
        <ModalContent
          bg="transparent"
          boxShadow="none"
          m={0}
          maxW="100vw"
          maxH="100vh"
        >
          <ModalCloseButton
            color="white"
            size="lg"
            top={isMobile ? "10px" : "20px"}
            right={isMobile ? "10px" : "20px"}
            zIndex={1000}
            bg="blackAlpha.600"
            borderRadius="full"
            _hover={{ bg: "blackAlpha.800" }}
          />
          <ModalBody
            display="flex"
            alignItems="center"
            justifyContent="center"
            p={0}
            w="100vw"
            h="100vh"
          >
            {selectedMediaType === "image" ? (
              <Image
                src={selectedMedia}
                alt="Full size image"
                maxW="95vw"
                maxH="95vh"
                objectFit="contain"
                borderRadius={isMobile ? "4px" : "8px"}
              />
            ) : selectedMediaType === "video" ? (
              <Box
                w="95vw"
                h="95vh"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <video
                  src={selectedMedia}
                  controls
                  autoPlay
                  style={{
                    maxWidth: "100%",
                    maxHeight: "100%",
                    borderRadius: isMobile ? "4px" : "8px",
                    objectFit: "contain",
                  }}
                >
                  Your browser does not support the video tag.
                </video>
              </Box>
            ) : null}
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default ScrollableChat;
