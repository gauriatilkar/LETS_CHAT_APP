import React, { useState } from "react";
import { Avatar } from "@chakra-ui/avatar";
import { Tooltip } from "@chakra-ui/tooltip";
import { Box, Text, Button, Badge } from "@chakra-ui/react";
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

  const handleViewOnceClick = async (messageId) => {
    if (onViewOnceClick) {
      await onViewOnceClick(messageId);
      setViewedMessages((prev) => new Set([...prev, messageId]));
    }
  };

  const renderMessage = (m, i) => {
    const isCurrentUser = m.sender._id === user._id;
    const isViewed = viewedMessages.has(m._id) || m.hasBeenViewed;
    const hasViewedBy = m.viewedBy && m.viewedBy.length > 0;

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
              🔒 View Once
            </Badge>
            <Text fontSize="sm" color="purple.600" mb={2}>
              Tap to view this message once
            </Text>
            <Button
              size="sm"
              colorScheme="purple"
              variant="solid"
              onClick={() => handleViewOnceClick(m._id)}
              borderRadius="full"
            >
              👁️ View Message
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
            maxWidth="75%"
            marginLeft={isSameSenderMargin(messages, m, i, user._id)}
            marginTop={isSameUser(messages, m, i, user._id) ? 3 : 10}
            opacity={0.8}
            position="relative"
          >
            <Badge colorScheme="gray" size="sm" mb={2}>
              🔓 {isCurrentUser ? "Sent as View Once" : "Viewed Once"}
            </Badge>
            {!isCurrentUser && isViewed && (
              <Text fontSize="sm" color="gray.600">
                {m.content}
              </Text>
            )}
            {isCurrentUser && (
              <Text fontSize="sm" color="gray.600" fontStyle="italic">
                View once message sent
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
        <span
          style={{
            backgroundImage: `${
              m.sender._id === user._id
                ? "linear-gradient(to right, hsl(217, 52%, 78%), hsl(224, 58%, 79%))"
                : "linear-gradient(to right, hsl(120, 69%, 90%), hsl(120, 69%, 85%))"
            }`,
            marginLeft: isSameSenderMargin(messages, m, i, user._id),
            marginTop: isSameUser(messages, m, i, user._id) ? 3 : 10,
            borderRadius: "20px",
            padding: "8px 15px",
            maxWidth: "75%",
            position: "relative",
            display: "block",
            wordWrap: "break-word",
          }}
        >
          {m.isViewOnce && m.sender._id === user._id && (
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
          {m.content}
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
        </span>
      </div>
    );
  };

  return (
    <ScrollableFeed>
      {Array.isArray(messages) && messages.map((m, i) => renderMessage(m, i))}
    </ScrollableFeed>
  );
};

export default ScrollableChat;
