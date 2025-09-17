import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { Box, Button, Spinner, Text, useToast } from "@chakra-ui/react";
import { ChatState } from "../Context/ChatProvider";

const JoinGroup = () => {
  const { inviteCode } = useParams();
  const { user, setSelectedChat } = ChatState();
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_BACKEND_URL;

  const handleJoin = async () => {
    if (!user) {
      toast({
        title: "Login required",
        description: "Please login to join the group",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      navigate("/login");
      return;
    }

    try {
      setLoading(true);
      const config = {
        headers: { Authorization: `Bearer ${user.token}` },
      };

      const { data } = await axios.post(
        `${API_URL}/api/chat/join/${inviteCode}`,
        {},
        config
      );

      setSelectedChat(data);
      toast({
        title: "Joined group 🎉",
        description: `You joined ${data.chatName}`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      navigate("/chats"); // redirect to chat page
    } catch (error) {
      toast({
        title: "Join failed",
        description: error.response?.data?.message || "Invalid or expired link",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box textAlign="center" mt={20}>
      <Text fontSize="2xl" fontWeight="bold" color="blue.600" mb={4}>
        Join Group Invitation
      </Text>
      <Text mb={6}>You’ve been invited to join a group chat.</Text>
      <Button
        colorScheme="blue"
        onClick={handleJoin}
        isLoading={loading}
        loadingText="Joining..."
      >
        Join Group
      </Button>
    </Box>
  );
};

export default JoinGroup;
