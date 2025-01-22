import React, { useEffect, useState } from "react";
import { AddIcon } from "@chakra-ui/icons";
import { Box, Stack, Text, Button } from "@chakra-ui/react";
import { useToast } from "@chakra-ui/toast";
import axios from "axios";
import { getSender } from "../config/ChatLogics";
import ChatLoading from "./ChatLoading";
import GroupChatModal from "./miscellaneous/GroupChatModal";
import { ChatState } from "../Context/ChatProvider";

const MyChats = ({ fetchAgain }) => {
  const [loggedUser, setLoggedUser] = useState();
  const { selectedChat, setSelectedChat, user, chats, setChats } = ChatState();
  const toast = useToast();

  const fetchChats = async () => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };

      const { data } = await axios.get("https://deployapi-ub0q.onrender.com/api/chat", config);
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

  useEffect(() => {
    setLoggedUser(JSON.parse(localStorage.getItem("userInfo")));
    fetchChats();
    // eslint-disable-next-line
  }, [fetchAgain]);

  return (
    <Box
      display={{ base: selectedChat ? "none" : "flex", md: "flex" }}
      flexDir="column"
      alignItems="center"
      p={4}
      bgGradient="linear(to-br, rgb(241, 245, 249), hsl(217, 52%, 78%))"
      w={{ base: "100%", md: "30%" }}
      borderRadius="lg"
      borderWidth="1px"
      boxShadow="lg"
    >
      <Box
        pb={4}
        px={4}
        fontSize={{ base: "24px", md: "26px" }}
        fontFamily="'Poppins', sans-serif"
        fontWeight="semibold"
        color="hsl(224, 58%, 25%)"
        display="flex"
        w="100%"
        justifyContent="space-between"
        alignItems="center"
        borderBottom="2px solid hsl(224, 58%, 79%)"
      >
        My Chats
        <GroupChatModal>
          <Button
            display="flex"
            bgGradient="linear(to-r, #3182ce, #63b3ed)"
            color="white"
            fontSize={{ base: "14px", md: "16px" }}
            _hover={{
              bgGradient: "linear(to-r, #2c5282, #4299e1)",
              transform: "translateY(-1px)",
            }}
            rightIcon={<AddIcon />}
            borderRadius="md"
            boxShadow="md"
            transition="all 0.2s"
          >
            New Group Chat
          </Button>
        </GroupChatModal>
      </Box>

      <Box
        display="flex"
        flexDir="column"
        p={4}
        bg="white"
        w="100%"
        h="85%"
        borderRadius="lg"
        overflowY="hidden"
        borderWidth="1px"
        borderColor="hsl(224, 58%, 85%)"
        boxShadow="sm"
      >
        {Array.isArray(chats) && chats.length > 0 ? (
          <Stack overflowY="auto" spacing={3}>
            {chats.map((chat) => (
              <Box
                onClick={() => setSelectedChat(chat)}
                cursor="pointer"
                bgGradient={
                  selectedChat === chat
                    ? "linear(to-r, #3182ce, #63b3ed)"
                    : "none"
                }
                bg={selectedChat === chat ? undefined : "rgb(241, 245, 249)"}
                color={selectedChat === chat ? "white" : "hsl(224, 58%, 25%)"}
                px={4}
                py={3}
                borderRadius="md"
                key={chat._id}
                transition="all 0.2s"
                _hover={{
                  transform: "translateY(-2px)",
                  boxShadow: "md",
                  bgGradient: selectedChat === chat
                    ? "linear(to-r, #2c5282, #4299e1)"
                    : "linear(to-r, hsl(217, 52%, 78%), hsl(224, 58%, 79%))",
                }}
                boxShadow={selectedChat === chat ? "md" : "sm"}
              >
                <Text
                  fontSize="md"
                  fontWeight="semibold"
                  fontFamily="'Poppins', sans-serif"
                  noOfLines={1}
                >
                  {!chat.isGroupChat
                    ? getSender(loggedUser, chat.users)
                    : chat.chatName}
                </Text>
                {chat.latestMessage && (
                  <Text 
                    fontSize="sm" 
                    color={selectedChat === chat ? "whiteAlpha.900" : "hsl(224, 58%, 45%)"}
                    noOfLines={1}
                  >
                    <b>{chat.latestMessage.sender.name}: </b>
                    {chat.latestMessage.content.length > 50
                      ? chat.latestMessage.content.substring(0, 51) + "..."
                      : chat.latestMessage.content}
                  </Text>
                )}
              </Box>
            ))}
          </Stack>
        ) : (
          <ChatLoading />
        )}
      </Box>
    </Box>
  );
};

export default MyChats;