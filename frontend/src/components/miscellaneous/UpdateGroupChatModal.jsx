import React from "react";
import {
  ViewIcon,
  LinkIcon,
  CopyIcon,
  AddIcon,
  DeleteIcon,
} from "@chakra-ui/icons";
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
  InputGroup,
  InputRightElement,
  useToast,
  Box,
  IconButton,
  Spinner,
  VStack,
  HStack,
  Text,
  Divider,
  Badge,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Tooltip,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from "@chakra-ui/react";
import axios from "axios";
import { useState, useEffect } from "react";
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
  const [inviteLinks, setInviteLinks] = useState([]);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const toast = useToast();

  const { selectedChat, setSelectedChat, user } = ChatState();
  const API_URL = import.meta.env.VITE_BACKEND_URL;

  // Existing functions with proper alignment
  const handleSearch = async (query) => {
    setSearch(query);
    if (!query) {
      return;
    }

    try {
      setLoading(true);
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      const { data } = await axios.get(
        `${API_URL}/api/user?search=${search}`,
        config
      );
      console.log(data);
      setLoading(false);
      setSearchResult(data);
    } catch (error) {
      toast({
        title: "Error Occurred!",
        description: "Failed to Load the Search Results",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom-left",
      });
      setLoading(false);
    }
  };

  const handleRename = async () => {
    if (!groupChatName) return;

    try {
      setRenameLoading(true);
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      const { data } = await axios.put(
        `${API_URL}/api/chat/rename`,
        {
          chatId: selectedChat._id,
          chatName: groupChatName,
        },
        config
      );

      console.log(data._id);
      setSelectedChat(data);
      setFetchAgain(!fetchAgain);
      setRenameLoading(false);
    } catch (error) {
      toast({
        title: "Error Occurred!",
        description: error.response.data.message,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      setRenameLoading(false);
    }
    setGroupChatName("");
  };

  const handleAddUser = async (user1) => {
    if (selectedChat.users.find((u) => u._id === user1._id)) {
      toast({
        title: "User Already in group!",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      return;
    }

    if (selectedChat.groupAdmin._id !== user._id) {
      toast({
        title: "Only admins can add someone!",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      return;
    }

    try {
      setLoading(true);
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      const { data } = await axios.put(
        `${API_URL}/api/chat/groupadd`,
        {
          chatId: selectedChat._id,
          userId: user1._id,
        },
        config
      );

      setSelectedChat(data);
      setFetchAgain(!fetchAgain);
      setLoading(false);
    } catch (error) {
      toast({
        title: "Error Occurred!",
        description: error.response.data.message,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      setLoading(false);
    }
    setGroupChatName("");
  };

  const handleRemove = async (user1) => {
    if (selectedChat.groupAdmin._id !== user._id && user1._id !== user._id) {
      toast({
        title: "Only admins can remove someone!",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      return;
    }

    try {
      setLoading(true);
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      const { data } = await axios.put(
        `${API_URL}/api/chat/groupremove`,
        {
          chatId: selectedChat._id,
          userId: user1._id,
        },
        config
      );

      user1._id === user._id ? setSelectedChat() : setSelectedChat(data);
      setFetchAgain(!fetchAgain);
      fetchMessages();
      setLoading(false);
    } catch (error) {
      toast({
        title: "Error Occurred!",
        description: error.response.data.message,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      setLoading(false);
    }
    setGroupChatName("");
  };

  // New invite link functions
  const fetchInviteLinks = async () => {
    if (!selectedChat?._id) return;

    try {
      setInviteLoading(true);
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };

      const { data } = await axios.get(
        `${API_URL}/api/chat/invite-links/${selectedChat._id}`,
        config
      );
      setInviteLinks(data.inviteLinks || []);
    } catch (error) {
      toast({
        title: "Error fetching invite links",
        description: error.response?.data?.message || "Something went wrong",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setInviteLoading(false);
    }
  };

  const generateInviteLink = async () => {
    try {
      setGenerating(true);
      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
      };

      const { data } = await axios.post(
        `${API_URL}/api/chat/generate-invite`,
        {
          chatId: selectedChat._id,
          expiresIn: 24 * 60 * 60 * 1000, // 24 hours
        },
        config
      );

      setInviteLinks([data.inviteLink, ...inviteLinks]);
      toast({
        title: "Invite link generated! 🔗",
        description: "Share this link with others to invite them to the group",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Error generating invite link",
        description: error.response?.data?.message || "Something went wrong",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = async (inviteCode) => {
    try {
      const inviteUrl = `${window.location.origin}/join/${inviteCode}`;
      await navigator.clipboard.writeText(inviteUrl);
      toast({
        title: "Link copied! 📋",
        description: "Invite link has been copied to clipboard",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement("textarea");
      textArea.value = `${window.location.origin}/join/${inviteCode}`;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);

      toast({
        title: "Link copied! 📋",
        description: "Invite link has been copied to clipboard",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    }
  };

  const revokeInviteLink = async (inviteId) => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };

      await axios.delete(
        `${API_URL}/api/chat/revoke-invite/${inviteId}`,
        config
      );

      setInviteLinks(inviteLinks.filter((link) => link._id !== inviteId));
      toast({
        title: "Invite link revoked",
        description: "This link can no longer be used to join the group",
        status: "info",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Error revoking invite link",
        description: error.response?.data?.message || "Something went wrong",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const formatExpiryDate = (expiryDate) => {
    const date = new Date(expiryDate);
    const now = new Date();
    const diffTime = date - now;
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));

    if (diffHours < 0) return "Expired";
    if (diffHours < 24) return `${diffHours}h left`;
    return `${Math.ceil(diffHours / 24)}d left`;
  };

  useEffect(() => {
    if (isOpen && selectedChat?.isGroupChat) {
      fetchInviteLinks();
    }
  }, [isOpen, selectedChat]);

  return (
    <>
      <IconButton
        display={{ base: "flex" }}
        icon={<ViewIcon />}
        onClick={onOpen}
        bgGradient="linear(to-r, #3182ce, #63b3ed)"
        color="white"
        _hover={{
          bgGradient: "linear(to-r, #2c5282, #4299e1)",
        }}
        borderRadius="md"
        size="md"
      />

      <Modal onClose={onClose} isOpen={isOpen} isCentered size="xl">
        <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(10px)" />
        <ModalContent bg="white" boxShadow="xl" borderRadius="lg" mx={4}>
          <ModalHeader
            fontSize="24px"
            fontFamily="'Poppins','sans-serif'"
            display="flex"
            justifyContent="center"
            color="#2b6cb0"
            pb={2}
          >
            {selectedChat.chatName}
          </ModalHeader>

          <ModalCloseButton color="#2b6cb0" />

          <ModalBody>
            <Tabs colorScheme="blue" variant="enclosed">
              <TabList mb={4}>
                <Tab _selected={{ color: "white", bg: "#3182ce" }}>
                  <HStack spacing={2}>
                    <ViewIcon />
                    <Text>Manage Group</Text>
                  </HStack>
                </Tab>
                <Tab _selected={{ color: "white", bg: "#3182ce" }}>
                  <HStack spacing={2}>
                    <LinkIcon />
                    <Text>Invite Links</Text>
                  </HStack>
                </Tab>
              </TabList>

              <TabPanels>
                {/* Manage Group Tab */}
                <TabPanel p={0}>
                  <VStack spacing={4} align="stretch">
                    {/* Current Members */}
                    <Box>
                      <Text
                        fontSize="md"
                        fontWeight="semibold"
                        mb={3}
                        color="#2b6cb0"
                      >
                        Group Members ({selectedChat.users?.length})
                      </Text>
                      <Box display="flex" flexWrap="wrap" gap={2}>
                        {selectedChat.users.map((u) => (
                          <UserBadgeItem
                            key={u._id}
                            user={u}
                            admin={selectedChat.groupAdmin}
                            handleFunction={() => handleRemove(u)}
                          />
                        ))}
                      </Box>
                    </Box>

                    <Divider />

                    {/* Rename Group */}
                    <Box>
                      <Text
                        fontSize="md"
                        fontWeight="semibold"
                        mb={3}
                        color="#2b6cb0"
                      >
                        Group Settings
                      </Text>
                      <HStack spacing={2}>
                        <Input
                          placeholder="Update chat name"
                          value={groupChatName}
                          onChange={(e) => setGroupChatName(e.target.value)}
                          borderColor="#63b3ed"
                          _focus={{
                            borderColor: "#3182ce",
                            boxShadow: "0 0 0 1px #3182ce",
                          }}
                          flex={1}
                        />
                        <Button
                          color="white"
                          bgGradient="linear(to-r, #3182ce, #63b3ed)"
                          isLoading={renameloading}
                          onClick={handleRename}
                          _hover={{
                            bgGradient: "linear(to-r, #2c5282, #4299e1)",
                          }}
                          minW="fit-content"
                        >
                          Update
                        </Button>
                      </HStack>
                    </Box>

                    <Divider />

                    {/* Add Members */}
                    <Box>
                      <Text
                        fontSize="md"
                        fontWeight="semibold"
                        mb={3}
                        color="#2b6cb0"
                      >
                        Add Members
                      </Text>
                      <Input
                        placeholder="Search users to add"
                        onChange={(e) => handleSearch(e.target.value)}
                        borderColor="#63b3ed"
                        _focus={{
                          borderColor: "#3182ce",
                          boxShadow: "0 0 0 1px #3182ce",
                        }}
                        mb={3}
                      />

                      {loading ? (
                        <Box textAlign="center" py={4}>
                          <Spinner size="md" color="#3182ce" thickness="3px" />
                        </Box>
                      ) : (
                        <VStack spacing={2} maxH="200px" overflowY="auto">
                          {searchResult?.map((user) => (
                            <UserListItem
                              key={user._id}
                              user={user}
                              handleFunction={() => handleAddUser(user)}
                            />
                          ))}
                        </VStack>
                      )}
                    </Box>
                  </VStack>
                </TabPanel>

                {/* Invite Links Tab */}
                <TabPanel p={0}>
                  <VStack spacing={4} align="stretch">
                    {/* Generate new invite button */}
                    <Button
                      leftIcon={<AddIcon />}
                      colorScheme="blue"
                      onClick={generateInviteLink}
                      isLoading={generating}
                      loadingText="Generating..."
                      size="md"
                    >
                      Generate New Invite Link
                    </Button>

                    <Divider />

                    {/* Active invite links */}
                    <Box>
                      <Text
                        fontSize="md"
                        fontWeight="semibold"
                        mb={3}
                        color="#2b6cb0"
                      >
                        Active Invite Links
                      </Text>

                      {inviteLoading ? (
                        <Box textAlign="center" py={4}>
                          <Spinner size="md" color="#3182ce" thickness="3px" />
                          <Text mt={2} color="gray.500" fontSize="sm">
                            Loading invite links...
                          </Text>
                        </Box>
                      ) : inviteLinks.length === 0 ? (
                        <Alert status="info" borderRadius="md">
                          <AlertIcon />
                          <Box>
                            <AlertTitle fontSize="sm">
                              No active invite links
                            </AlertTitle>
                            <AlertDescription fontSize="sm">
                              Generate a link to invite others to this group
                            </AlertDescription>
                          </Box>
                        </Alert>
                      ) : (
                        <VStack spacing={3} maxH="300px" overflowY="auto">
                          {inviteLinks.map((link) => (
                            <Box
                              key={link._id}
                              p={4}
                              border="1px solid"
                              borderColor="gray.200"
                              borderRadius="md"
                              bg="gray.50"
                              w="100%"
                            >
                              <HStack justify="space-between" mb={2}>
                                <Badge
                                  colorScheme={
                                    new Date(link.expiresAt) > new Date()
                                      ? "green"
                                      : "red"
                                  }
                                  variant="subtle"
                                  fontSize="xs"
                                >
                                  {formatExpiryDate(link.expiresAt)}
                                </Badge>
                                <HStack spacing={1}>
                                  <Text fontSize="xs" color="gray.600">
                                    Uses: {link.usedCount || 0}
                                  </Text>
                                </HStack>
                              </HStack>

                              <InputGroup size="sm">
                                <Input
                                  value={`${window.location.origin}/join/${link.inviteCode}`}
                                  isReadOnly
                                  bg="white"
                                  fontSize="xs"
                                  fontFamily="mono"
                                  pr="70px"
                                />
                                <InputRightElement width="auto" pr={1}>
                                  <HStack spacing={1}>
                                    <Tooltip label="Copy link" placement="top">
                                      <IconButton
                                        size="xs"
                                        icon={<CopyIcon />}
                                        onClick={() =>
                                          copyToClipboard(link.inviteCode)
                                        }
                                        colorScheme="blue"
                                        variant="ghost"
                                      />
                                    </Tooltip>
                                    <Tooltip
                                      label="Revoke link"
                                      placement="top"
                                    >
                                      <IconButton
                                        size="xs"
                                        icon={<DeleteIcon />}
                                        onClick={() =>
                                          revokeInviteLink(link._id)
                                        }
                                        colorScheme="red"
                                        variant="ghost"
                                      />
                                    </Tooltip>
                                  </HStack>
                                </InputRightElement>
                              </InputGroup>

                              {link.createdBy?.name && (
                                <Text fontSize="xs" color="gray.500" mt={2}>
                                  Created by {link.createdBy.name} •{" "}
                                  {new Date(
                                    link.createdAt
                                  ).toLocaleDateString()}
                                </Text>
                              )}
                            </Box>
                          ))}
                        </VStack>
                      )}
                    </Box>
                  </VStack>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </ModalBody>

          <ModalFooter pt={4}>
            <HStack spacing={3}>
              <Button onClick={onClose} variant="ghost" color="#2b6cb0">
                Close
              </Button>
              <Button
                onClick={() => handleRemove(user)}
                bgGradient="linear(to-r, #e53e3e, #fc8181)"
                color="white"
                _hover={{
                  bgGradient: "linear(to-r, #c53030, #fc8181)",
                }}
                size="md"
              >
                Leave Group
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default UpdateGroupChatModal;
