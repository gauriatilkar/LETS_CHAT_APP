
import { Box, Tooltip } from "@chakra-ui/react";
import { CheckIcon } from "@chakra-ui/icons";

const ReadReceiptIndicator = ({ message, chatUsers, currentUser }) => {
  // Only show for messages sent by current user
  if (message.sender._id !== currentUser._id) {
    return null;
  }

  // Don't show for view-once messages
  if (message.isViewOnce) {
    return null;
  }

  const readByCount = message.readBy ? message.readBy.length : 0;
  const totalRecipients = chatUsers.filter(
    (user) => user._id !== currentUser._id
  ).length;

  // WhatsApp logic:
  // Single tick = sent/delivered
  // Double gray ticks = delivered to all recipients
  // Double blue ticks = read by all recipients (in group) or read by recipient (in 1:1)

  const isGroupChat = totalRecipients > 1;
  const allRead = readByCount >= totalRecipients && totalRecipients > 0;

  const getTooltipText = () => {
    if (readByCount === 0) {
      return "Delivered";
    }

    if (isGroupChat) {
      if (allRead) {
        return `Read by all (${readByCount}/${totalRecipients})`;
      } else if (readByCount > 0) {
        return `Read by ${readByCount}/${totalRecipients}`;
      }
    } else {
      // 1:1 chat
      if (readByCount > 0) {
        const readTime = new Date(message.readBy[0].readAt).toLocaleString();
        return `Read at ${readTime}`;
      }
    }

    return "Delivered";
  };

  const renderTicks = () => {
    if (readByCount === 0) {
      // Single gray tick - delivered
      return <CheckIcon boxSize="14px" color="gray.400" />;
    } else if (allRead || (!isGroupChat && readByCount > 0)) {
      // Double blue ticks - read
      return (
        <Box position="relative" display="inline-block" w="20px" h="14px">
          <CheckIcon
            boxSize="14px"
            color="#34B7F1"
            position="absolute"
            left="0"
            top="0"
          />
          <CheckIcon
            boxSize="14px"
            color="#34B7F1"
            position="absolute"
            left="6px"
            top="0"
          />
        </Box>
      );
    } else {
      // Double gray ticks - delivered but not all read (group chat)
      return (
        <Box position="relative" display="inline-block" w="20px" h="14px">
          <CheckIcon
            boxSize="14px"
            color="gray.400"
            position="absolute"
            left="0"
            top="0"
          />
          <CheckIcon
            boxSize="14px"
            color="gray.400"
            position="absolute"
            left="6px"
            top="0"
          />
        </Box>
      );
    }
  };

  return (
    <Tooltip label={getTooltipText()} placement="top" hasArrow fontSize="xs">
      <Box display="inline-flex" alignItems="center" ml={1}>
        {renderTicks()}
      </Box>
    </Tooltip>
  );
};

export default ReadReceiptIndicator;
