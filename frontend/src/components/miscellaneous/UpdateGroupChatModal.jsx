import React from 'react';
import { ViewIcon } from "@chakra-ui/icons";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  useDisclosure,
  FormControl,
  Input,
  useToast,
  Box,
  IconButton,
  Spinner,
} from "@chakra-ui/react";
import axios from "axios";
import { useState } from "react";
import { ChatState } from "../../Context/ChatProvider";
import UserBadgeItem from "../userAvatar/UserBadgeItem";
import UserListItem from "../userAvatar/UserListItem";

const UpdateGroupChatModal = ({ fetchMessages, fetchAgain, setFetchAgain }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [groupChatName, setGroupChatName] = useState();
  const [search, setSearch] = useState("");
  const [searchResult, setSearchResult] = useState([]);
  const [loading, setLoading] = useState(false);
  const [renameloading, setRenameLoading] = useState(false);
  const toast = useToast();

  const { selectedChat, setSelectedChat, user } = ChatState();

  // All existing functions remain exactly the same
  const handleSearch = async (query) => {
    // ... existing handleSearch implementation
  };

  const handleRename = async () => {
    // ... existing handleRename implementation
  };

  const handleAddUser = async (user1) => {
    // ... existing handleAddUser implementation
  };

  const handleRemove = async (user1) => {
    // ... existing handleRemove implementation
  };

  return (
    <>
      <IconButton 
        d={{ base: "flex" }} 
        icon={<ViewIcon />} 
        onClick={onOpen}
        bgGradient="linear(to-r, #3182ce, #63b3ed)"
        color="white"
        _hover={{
          bgGradient: "linear(to-r, #2c5282, #4299e1)"
        }}
      />

      <Modal onClose={onClose} isOpen={isOpen} isCentered>
        <ModalOverlay 
          bg="blackAlpha.300"
          backdropFilter="blur(10px)"
        />
        <ModalContent
          bg="white"
          boxShadow="xl"
        >
          <ModalHeader
            fontSize="35px"
            fontFamily="'Poppins','sans-serif'"
            d="flex"
            justifyContent="center"
            color="#2b6cb0"
          >
            {selectedChat.chatName}
          </ModalHeader>

          <ModalCloseButton color="#2b6cb0" />
          <ModalBody d="flex" flexDir="column" alignItems="center">
            <Box w="100%" d="flex" flexWrap="wrap" pb={3}>
              {selectedChat.users.map((u) => (
                <UserBadgeItem
                  key={u._id}
                  user={u}
                  admin={selectedChat.groupAdmin}
                  handleFunction={() => handleRemove(u)}
                />
              ))}
            </Box>
            <FormControl d="flex">
              <Input
                placeholder="Chat Name"
                mb={3}
                value={groupChatName}
                onChange={(e) => setGroupChatName(e.target.value)}
                borderColor="#63b3ed"
                _focus={{
                  borderColor: "#3182ce",
                  boxShadow: "0 0 0 1px #3182ce"
                }}
              />
              <Button
                color="white"
                bgGradient="linear(to-r, #3182ce, #63b3ed)"
                ml={1}
                isLoading={renameloading}
                onClick={handleRename}
                _hover={{
                  bgGradient: "linear(to-r, #2c5282, #4299e1)"
                }}
              >
                Update
              </Button>
            </FormControl>
            <FormControl>
              <Input
                placeholder="Add User to group"
                mb={1}
                onChange={(e) => handleSearch(e.target.value)}
                borderColor="#63b3ed"
                _focus={{
                  borderColor: "#3182ce",
                  boxShadow: "0 0 0 1px #3182ce"
                }}
              />
            </FormControl>

            {loading ? (
              <Spinner 
                size="lg" 
                color="#3182ce"
                thickness="4px"
              />
            ) : (
              searchResult?.map((user) => (
                <UserListItem
                  key={user._id}
                  user={user}
                  handleFunction={() => handleAddUser(user)}
                />
              ))
            )}
          </ModalBody>
          <ModalFooter>
            <Button 
              onClick={() => handleRemove(user)} 
              bgGradient="linear(to-r, #e53e3e, #fc8181)"
              color="white"
              _hover={{
                bgGradient: "linear(to-r, #c53030, #fc8181)"
              }}
            >
              Leave Group
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default UpdateGroupChatModal;