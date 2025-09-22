import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  IconButton,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Button,
  Text,
  VStack,
  HStack,
  Badge,
  Box,
  MenuItem,
  MenuDivider,
} from "@chakra-ui/react";
import {
  ChevronDownIcon,
  EditIcon,
  DeleteIcon,
  RepeatIcon,
  ViewIcon,
  InfoIcon,
} from "@chakra-ui/icons";

const MessageContextMenu = ({
  message,
  currentUser,
  onReply,
  onDelete,
  onEdit,
  chatUsers,
}) => {
  const [loading, setLoading] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ x: 0, y: 0 });
  const triggerRef = useRef(null);

  const {
    isOpen: isInfoOpen,
    onOpen: onInfoOpen,
    onClose: onInfoClose,
  } = useDisclosure();
  const toast = useToast();

  const isOwnMessage = message.sender._id === currentUser._id;
  const canEdit = isOwnMessage && message.canBeEdited !== false;
  const canDelete = isOwnMessage;

  // Check if message can still be edited (15 minute limit)
  const canEditMessage = () => {
    if (!isOwnMessage || message.isViewOnce) return false;
    const now = new Date();
    const messageTime = new Date(message.createdAt);
    const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);
    return messageTime >= fifteenMinutesAgo;
  };

  const handleMenuOpen = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const dropdownWidth = 150; // Approximate width of dropdown

      // Position dropdown to the left if it would overflow the right edge
      const leftPosition =
        rect.left + dropdownWidth > viewportWidth
          ? rect.left - dropdownWidth + rect.width
          : rect.left;

      setDropdownPosition({
        x: leftPosition,
        y: rect.bottom + 5,
      });
    }
    setIsMenuOpen(true);
  };

  const handleMenuClose = () => {
    setIsMenuOpen(false);
  };

  const handleReply = () => {
    onReply(message);
    handleMenuClose();
  };

  const handleEdit = () => {
    onEdit(message);
    handleMenuClose();
  };

  const handleDelete = () => {
    onDelete(message);
    handleMenuClose();
  };

  const handleInfoOpen = () => {
    onInfoOpen();
    handleMenuClose();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isMenuOpen &&
        !event.target.closest(".context-menu-dropdown") &&
        !event.target.closest(".menu-trigger")
      ) {
        handleMenuClose();
      }
    };

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  // Close dropdown on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (isMenuOpen) {
        handleMenuClose();
      }
    };

    if (isMenuOpen) {
      window.addEventListener("scroll", handleScroll, true);
    }

    return () => {
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [isMenuOpen]);

  return (
    <>
      {/* Trigger Button */}
      <IconButton
        ref={triggerRef}
        className="menu-trigger"
        icon={<ChevronDownIcon />}
        variant="ghost"
        size="xs"
        opacity={0}
        _groupHover={{ opacity: 1 }}
        _hover={{ bg: "rgba(255,255,255,0.2)" }}
        position="absolute"
        top="2px"
        right="2px"
        zIndex={2}
        color="rgba(255,255,255,0.8)"
        onClick={handleMenuOpen}
      />

      {/* Dropdown Menu - renders in portal */}
      {isMenuOpen &&
        createPortal(
          <Box
            className="context-menu-dropdown"
            position="fixed"
            top={`${dropdownPosition.y}px`}
            left={`${dropdownPosition.x}px`}
            zIndex={9999}
            bg="white"
            boxShadow="lg"
            borderRadius="md"
            border="1px solid #E2E8F0"
            py={1}
            minW="150px"
            fontSize="sm"
          >
            {/* Reply option - available for all messages */}
            <Box
              display="flex"
              alignItems="center"
              px={3}
              py={2}
              cursor="pointer"
              _hover={{ bg: "gray.50" }}
              onClick={handleReply}
            >
              <RepeatIcon mr={2} />
              <Text>Reply</Text>
            </Box>

            {/* View message info */}
            <Box
              display="flex"
              alignItems="center"
              px={3}
              py={2}
              cursor="pointer"
              _hover={{ bg: "gray.50" }}
              onClick={handleInfoOpen}
            >
              <InfoIcon mr={2} />
              <Text>Message Info</Text>
            </Box>

            {isOwnMessage && (canEditMessage() || canDelete) && (
              <Box height="1px" bg="gray.200" my={1} />
            )}

            {/* Edit option - only for own messages within 15 minutes */}
            {isOwnMessage && canEditMessage() && (
              <Box
                display="flex"
                alignItems="center"
                px={3}
                py={2}
                cursor="pointer"
                _hover={{ bg: "gray.50" }}
                onClick={handleEdit}
              >
                <EditIcon mr={2} />
                <Text>Edit Message</Text>
              </Box>
            )}

            {/* Delete option - only for own messages */}
            {canDelete && (
              <Box
                display="flex"
                alignItems="center"
                px={3}
                py={2}
                cursor="pointer"
                color="red.500"
                _hover={{ bg: "red.50", color: "red.600" }}
                onClick={handleDelete}
              >
                <DeleteIcon mr={2} />
                <Text>Delete Message</Text>
              </Box>
            )}
          </Box>,
          document.body
        )}

      {/* Message Info Modal */}
      <Modal isOpen={isInfoOpen} onClose={onInfoClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader borderBottom="1px solid #E2E8F0">
            Message Info
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack align="start" spacing={3} py={2}>
              <Text>
                <strong>Sent:</strong>{" "}
                {new Date(message.createdAt).toLocaleString()}
              </Text>
              {message.isEdited && (
                <Text>
                  <strong>Last edited:</strong>{" "}
                  {new Date(message.editedAt).toLocaleString()}
                </Text>
              )}
              {message.mediaType && message.mediaType !== "text" && (
                <Badge colorScheme="blue">Media: {message.mediaType}</Badge>
              )}
              {message.isViewOnce && (
                <Badge colorScheme="purple">View Once Message</Badge>
              )}

              {/* Read receipts for sent messages */}
              {isOwnMessage && message.readBy && message.readBy.length > 0 && (
                <VStack align="start" spacing={1}>
                  <Text fontWeight="bold">Read by:</Text>
                  {message.readBy.map((read, index) => (
                    <Text key={index} fontSize="sm">
                      {new Date(read.readAt).toLocaleString()}
                    </Text>
                  ))}
                </VStack>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter borderTop="1px solid #E2E8F0">
            <Button onClick={onInfoClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default MessageContextMenu;
