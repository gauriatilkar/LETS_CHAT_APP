import { useState } from "react";
import {
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
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

  const handleReply = () => {
    onReply(message);
  };

  const handleEdit = () => {
    onEdit(message);
  };

  const handleDelete = () => {
    onDelete(message);
  };

  return (
    <>
      <Menu>
        <MenuButton
          as={IconButton}
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
        />
        <MenuList
          fontSize="sm"
          minW="150px"
          bg="white"
          border="1px solid #E2E8F0"
        >
          {/* Reply option - available for all messages */}
          <MenuItem
            icon={<RepeatIcon />}
            onClick={handleReply}
            _hover={{ bg: "gray.50" }}
          >
            Reply
          </MenuItem>

          {/* View message info */}
          <MenuItem
            icon={<InfoIcon />}
            onClick={onInfoOpen}
            _hover={{ bg: "gray.50" }}
          >
            Message Info
          </MenuItem>

          {isOwnMessage && (canEditMessage() || canDelete) && (
            <MenuDivider borderColor="gray.200" />
          )}

          {/* Edit option - only for own messages within 15 minutes */}
          {isOwnMessage && canEditMessage() && (
            <MenuItem
              icon={<EditIcon />}
              onClick={handleEdit}
              _hover={{ bg: "gray.50" }}
            >
              Edit Message
            </MenuItem>
          )}

          {/* Delete option - only for own messages */}
          {canDelete && (
            <MenuItem
              icon={<DeleteIcon />}
              onClick={handleDelete}
              color="red.500"
              _hover={{ bg: "red.50", color: "red.600" }}
            >
              Delete Message
            </MenuItem>
          )}  
        </MenuList>
      </Menu>

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
