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
} from "@chakra-ui/react";
import { ViewIcon } from "@chakra-ui/icons";
import ScrollableFeed from "react-scrollable-feed";
import {
  isLastMessage,
  isSameSender,
  isSameSenderMargin,
  isSameUser,
} from "../config/ChatLogics";
import { ChatState } from "../Context/ChatProvider";

const ScrollableChat = ({ messages, onViewOnceClick }) => {
  const { user } = ChatState();
  const [viewedMessages, setViewedMessages] = useState(new Set());
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [selectedMediaType, setSelectedMediaType] = useState(null);

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

    // Regular expression to match emojis
    const emojiRegex =
      /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F|\p{Emoji_Modifier_Base})/gu;

    // Split text by emojis and wrap emojis in spans
    const parts = text.split(emojiRegex);

    return parts.map((part, index) => {
      if (emojiRegex.test(part)) {
        return (
          <span
            key={index}
            style={{
              fontSize: "1.4em",
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
    const { content, mediaType, isOnlyEmojis: messageIsOnlyEmojis } = message;

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
              maxW="300px"
              maxH="200px"
              minW="200px"
              minH="150px"
              borderRadius="12px"
              objectFit="cover"
              transition="all 0.2s"
              _hover={{
                transform: "scale(1.02)",
                boxShadow: "lg",
              }}
              fallback={
                <Text fontSize="sm" color="gray.500">
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
              <ViewIcon color="white" boxSize="12px" />
            </Box>
          </Box>
        );
      } else if (actualMediaType === "video") {
        return (
          <Box position="relative">
            <AspectRatio ratio={16 / 9} maxW="450px" minW="300px">
              <video
                src={content}
                controls
                preload="metadata"
                style={{
                  borderRadius: "12px",
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
              size="sm"
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
      // For emoji-only messages, use large size
      return (
        <Text
          fontSize="2.5rem"
          lineHeight="1.2"
          whiteSpace="pre-wrap"
          textAlign="center"
          py="4px"
        >
          {content}
        </Text>
      );
    } else {
      // For mixed content, enhance emojis within the text
      return (
        <Text
          fontSize="14px"
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

  const renderMessage = (m, i) => {
    const isCurrentUser = m.sender._id === user._id;
    const isViewed = viewedMessages.has(m._id) || m.hasBeenViewed;
    const hasViewedBy = m.viewedBy && m.viewedBy.length > 0;
    const onlyEmojis = m.isOnlyEmojis || isOnlyEmojis(m.content);

    // If it's a view-once message and hasn't been viewed yet by current user
    if (m.isViewOnce && !isViewed && !isCurrentUser && !hasViewedBy) {
      return (
        <div style={{ display: "flex", marginBottom: "10px" }} key={m._id}>
          {(isSameSender(messages, m, i, user._id) ||
            isLastMessage(messages, i, user._id)) && (
            <Tooltip label={m.sender.name} placement="bottom-start" hasArrow>
              <Avatar
                mt="7px"
                mr={1}
                size="sm"
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
            borderRadius="20px"
            p={3}
            maxWidth="75%"
            marginLeft={isSameSenderMargin(messages, m, i, user._id)}
            marginTop={isSameUser(messages, m, i, user._id) ? 3 : 10}
            position="relative"
          >
            <Badge colorScheme="purple" size="sm" mb={2}>
              🔒 View Once{" "}
              {m.mediaType && m.mediaType !== "text" ? `(${m.mediaType})` : ""}
            </Badge>
            <Text fontSize="sm" color="purple.600" mb={2}>
              Tap to view this{" "}
              {m.mediaType === "image"
                ? "photo"
                : m.mediaType === "video"
                ? "video"
                : "message"}{" "}
              once
            </Text>
            <Button
              size="sm"
              colorScheme="purple"
              variant="solid"
              onClick={() => handleViewOnceClick(m._id)}
              borderRadius="full"
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
        <div style={{ display: "flex", marginBottom: "10px" }} key={m._id}>
          {(isSameSender(messages, m, i, user._id) ||
            isLastMessage(messages, i, user._id)) && (
            <Tooltip label={m.sender.name} placement="bottom-start" hasArrow>
              <Avatar
                mt="7px"
                mr={1}
                size="sm"
                cursor="pointer"
                name={m.sender.name}
                src={m.sender.pic}
                opacity={0.6}
              />
            </Tooltip>
          )}
          <Box
            bg={isCurrentUser ? "#E6FFFA" : "#F7FAFC"}
            borderRadius="20px"
            p={3}
            maxWidth="65%"
            marginLeft={isSameSenderMargin(messages, m, i, user._id)}
            marginTop={isSameUser(messages, m, i, user._id) ? 3 : 10}
            opacity={0.8}
            position="relative"
          >
            <Badge colorScheme="gray" size="sm" mb={2}>
              🔓 {isCurrentUser ? "Sent as View Once" : "Viewed Once"}{" "}
              {m.mediaType && m.mediaType !== "text" ? `(${m.mediaType})` : ""}
            </Badge>
            {!isCurrentUser && isViewed && <Box>{renderMessageContent(m)}</Box>}
            {isCurrentUser && (
              <Text fontSize="sm" color="gray.600" fontStyle="italic">
                View once{" "}
                {m.mediaType === "image"
                  ? "photo"
                  : m.mediaType === "video"
                  ? "video"
                  : "message"}{" "}
                sent
              </Text>
            )}
            <Text fontSize="xs" color="gray.400" mt={1}>
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
      <div style={{ display: "flex", marginBottom: "10px" }} key={m._id}>
        {(isSameSender(messages, m, i, user._id) ||
          isLastMessage(messages, i, user._id)) && (
          <Tooltip label={m.sender.name} placement="bottom-start" hasArrow>
            <Avatar
              mt="7px"
              mr={1}
              size="sm"
              cursor="pointer"
              name={m.sender.name}
              src={m.sender.pic}
            />
          </Tooltip>
        )}
        <Box
          style={{
            // Only apply background for non-emoji-only messages
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
            borderRadius: onlyEmojis ? "0" : "20px",
            padding: onlyEmojis ? "4px 8px" : "8px 15px",
            maxWidth: onlyEmojis ? "auto" : "75%",
            position: "relative",
            display: "block",
            wordWrap: "break-word",
            boxShadow: onlyEmojis ? "none" : "sm",
          }}
        >
          {m.isViewOnce && m.sender._id === user._id && !onlyEmojis && (
            <Badge
              colorScheme="purple"
              size="xs"
              mb={1}
              position="absolute"
              top="-8px"
              right="5px"
              fontSize="8px"
            >
              🔒
            </Badge>
          )}

          {/* Render the actual content (text, image, or video) */}
          {renderMessageContent(m)}

          {/* Only show timestamp for non-emoji-only messages */}
          {!onlyEmojis && (
            <div
              style={{
                fontSize: "10px",
                color: "rgba(0,0,0,0.5)",
                marginTop: "2px",
                textAlign: "right",
              }}
            >
              {new Date(m.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          )}
        </Box>
      </div>
    );
  };

  return (
    <>
      <ScrollableFeed>
        {Array.isArray(messages) && messages.map((m, i) => renderMessage(m, i))}
      </ScrollableFeed>

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
            top="20px"
            right="20px"
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
                borderRadius="8px"
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
                    borderRadius: "8px",
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
