import React, { useEffect, useState } from "react";
import { AddIcon, CloseIcon } from "@chakra-ui/icons";
import {
  Box,
  Stack,
  Text,
  Button,
  useBreakpointValue,
  IconButton,
  Flex,
} from "@chakra-ui/react";
import { useToast } from "@chakra-ui/toast";
import axios from "axios";
import { getSender } from "../config/ChatLogics";
import ChatLoading from "./ChatLoading";
import GroupChatModal from "./miscellaneous/GroupChatModal";
import { ChatState } from "../Context/ChatProvider";

const MyChats = ({ fetchAgain, onChatSelect }) => {
  const [loggedUser, setLoggedUser] = useState();
  const { selectedChat, setSelectedChat, user, chats, setChats } = ChatState();
  const toast = useToast();

  // Mobile-responsive values
  const isMobile = useBreakpointValue({ base: true, md: false });
  const fontSize = useBreakpointValue({ base: "16px", md: "26px" });
  const headerFontSize = useBreakpointValue({ base: "18px", md: "24px" });
  const buttonFontSize = useBreakpointValue({ base: "11px", md: "14px" });
  const chatItemPadding = useBreakpointValue({ base: 3, md: 4 });
  const containerPadding = useBreakpointValue({ base: 0, md: 4 });

  const API_URL = import.meta.env.VITE_BACKEND_URL;

  const fetchChats = async () => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };

      const { data } = await axios.get(`${API_URL}/api/chat`, config);
      if (Array.isArray(data)) {
        setChats(data);
      } else {
        toast({
          title: "Error Occurred!",
          description: "Chats data format is invalid.",
          status: "error",
          duration: 5000,
          isClosable: true,
          position: "bottom-left",
        });
      }
    } catch (error) {
      toast({
        title: "Error Occurred!",
        description: "Failed to Load the chats",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom-left",
      });
    }
  };

  // Helper function to check if a message should be displayed as latest message
  const shouldShowLatestMessage = (message) => {
    if (!message) return false;
    if (message.isViewOnce) return false;
    return true;
  };

  // Helper function to get display text for latest message
  const getLatestMessageDisplay = (chat) => {
    if (!chat.latestMessage || !shouldShowLatestMessage(chat.latestMessage)) {
      return null;
    }

    const message = chat.latestMessage;
    const maxLength = isMobile ? 25 : 50;
    const content =
      message.content.length > maxLength
        ? message.content.substring(0, maxLength) + "..."
        : message.content;

    return (
      <Text
        fontSize={isMobile ? "11px" : "sm"}
        color={selectedChat === chat ? "whiteAlpha.800" : "gray.600"}
        noOfLines={1}
        mt={isMobile ? 0.5 : 1}
      >
        <Text as="span" fontWeight="medium">
          {message.sender.name}:
        </Text>{" "}
        {content}
      </Text>
    );
  };

  const handleChatSelect = (chat) => {
    setSelectedChat(chat);
    if (onChatSelect) {
      onChatSelect();
    }
  };

  useEffect(() => {
    setLoggedUser(JSON.parse(localStorage.getItem("userInfo")));
    fetchChats();
    // eslint-disable-next-line
  }, [fetchAgain]);

  return (
    <Box
      display={{
        base: selectedChat && !onChatSelect ? "none" : "flex",
        md: "flex",
      }}
      flexDir="column"
      alignItems="center"
      p={containerPadding}
      bgGradient="linear(to-br, rgb(241, 245, 249), hsl(217, 52%, 78%))"
      w={{ base: "100%", md: "30%" }}
      borderRadius={isMobile ? "0" : "lg"}
      borderWidth={isMobile ? "0" : "1px"}
      boxShadow={isMobile ? "none" : "lg"}
      h={{ base: "100vh", md: "auto" }}
      bg={isMobile ? "white" : undefined}
    >
      {/* Header Section */}
      <Box
        pb={isMobile ? 2 : 4}
        px={isMobile ? 3 : 4}
        pt={isMobile ? 3 : 0}
        w="100%"
        borderBottom="2px solid hsl(224, 58%, 79%)"
        bg={isMobile ? "white" : "transparent"}
        fontFamily="'Poppins', sans-serif"
        fontWeight="semibold"
        color="hsl(224, 58%, 25%)"
      >
        {/* Both mobile and desktop use horizontal layout now */}
        <Flex justify="space-between" align="center" w="100%">
          <Text
            fontSize={headerFontSize}
            fontFamily="'Poppins', sans-serif"
            fontWeight="semibold"
            color="hsl(224, 58%, 25%)"
          >
            My Chats
          </Text>
          <GroupChatModal>
            <Button
              display="flex"
              bgGradient="linear(to-r, #3182ce, #63b3ed)"
              color="white"
              fontSize={buttonFontSize}
              _hover={{
                bgGradient: "linear(to-r, #2c5282, #4299e1)",
                transform: isMobile ? "none" : "translateY(-1px)",
              }}
              rightIcon={<AddIcon />}
              borderRadius="md"
              boxShadow="md"
              transition="all 0.2s"
              size={isMobile ? "sm" : "md"}
              px={isMobile ? 3 : 4}
            >
              {isMobile ? "New Group" : "New Group Chat"}
            </Button>
          </GroupChatModal>
        </Flex>
      </Box>

      {/* Chats List Section */}
      <Box
        display="flex"
        flexDir="column"
        p={isMobile ? 3 : 4}
        bg="white"
        w="100%"
        h={isMobile ? "calc(100vh - 100px)" : "85%"}
        borderRadius={isMobile ? "0" : "lg"}
        overflowY="hidden"
        borderWidth={isMobile ? "0" : "1px"}
        borderColor="hsl(224, 58%, 85%)"
        boxShadow={isMobile ? "none" : "sm"}
      >
        {Array.isArray(chats) && chats.length > 0 ? (
          <Stack overflowY="auto" spacing={isMobile ? 0 : 3} h="100%">
            {chats.map((chat) => (
              <Box
                key={chat._id}
                onClick={() => handleChatSelect(chat)}
                cursor="pointer"
                bgGradient={
                  selectedChat === chat
                    ? "linear(to-r, #3182ce, #63b3ed)"
                    : "none"
                }
                bg={selectedChat === chat ? undefined : "rgb(241, 245, 249)"}
                color={selectedChat === chat ? "white" : "hsl(224, 58%, 25%)"}
                px={chatItemPadding}
                py={chatItemPadding}
                borderRadius="md"
                transition="all 0.2s"
                _hover={{
                  transform: isMobile ? "none" : "translateY(-2px)",
                  boxShadow: isMobile ? "none" : "md",
                  bgGradient:
                    selectedChat === chat
                      ? "linear(to-r, #2c5282, #4299e1)"
                      : "linear(to-r, hsl(217, 52%, 78%), hsl(224, 58%, 79%))",
                }}
                boxShadow={
                  selectedChat === chat ? (isMobile ? "none" : "md") : "sm"
                }
                minH={isMobile ? "auto" : "auto"}
                display="flex"
                flexDirection="column"
                justifyContent="center"
                borderBottom={isMobile ? "1px solid #E2E8F0" : "none"}
                
              >
                <Text
                  fontSize={isMobile ? "14px" : "md"}
                  fontWeight="semibold"
                  fontFamily="'Poppins', sans-serif"
                  noOfLines={1}
                  lineHeight={isMobile ? "1.3" : "1.4"}
                >
                  {!chat.isGroupChat
                    ? getSender(loggedUser, chat.users)
                    : chat.chatName}
                </Text>

                {/* Latest message display */}
                {getLatestMessageDisplay(chat)}
              </Box>
            ))}
          </Stack>
        ) : (
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            h="100%"
            minH="200px"
          >
            <ChatLoading />
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default MyChats;
