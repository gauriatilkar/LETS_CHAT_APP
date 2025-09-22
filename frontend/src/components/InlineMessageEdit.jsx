import React, { useState, useRef, useEffect } from "react";
import { Textarea, HStack, IconButton, useToast } from "@chakra-ui/react";
import { CheckIcon, CloseIcon } from "@chakra-ui/icons";
import axios from "axios";

const InlineMessageEdit = ({ message, currentUser, onSave, onCancel }) => {
  const [editContent, setEditContent] = useState(message.content);
  const [loading, setLoading] = useState(false);
  const textareaRef = useRef();
  const toast = useToast();
  const API_URL = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    // Focus and select text when editing starts
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, []);

  const handleSave = async () => {
    if (!editContent.trim()) {
      toast({
        title: "Message cannot be empty",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (editContent.trim() === message.content) {
      onCancel();
      return;
    }

    setLoading(true);
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${currentUser.token}`,
          "Content-Type": "application/json",
        },
      };

      const { data } = await axios.put(
        `${API_URL}/api/message/${message._id}`,
        { content: editContent.trim() },
        config
      );

      onSave(data);
      toast({
        title: "Message edited successfully",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Error editing message",
        description: error.response?.data?.message || "Something went wrong",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      onCancel();
    }
  };

  return (
    <HStack spacing={2} align="flex-start" w="100%">
      <Textarea
        ref={textareaRef}
        value={editContent}
        onChange={(e) => setEditContent(e.target.value)}
        onKeyDown={handleKeyDown}
        size="sm"
        bg="white"
        borderColor="blue.300"
        _focus={{ borderColor: "blue.400" }}
        resize="none"
        minH="40px"
        maxH="120px"
        fontSize="14px"
        fontFamily="'Poppins', sans-serif"
        placeholder="Edit your message..."
      />
      <IconButton
        icon={<CheckIcon />}
        size="sm"
        colorScheme="green"
        onClick={handleSave}
        isLoading={loading}
        aria-label="Save edit"
      />
      <IconButton
        icon={<CloseIcon />}
        size="sm"
        variant="ghost"
        onClick={onCancel}
        aria-label="Cancel edit"
      />
    </HStack>
  );
};

export default InlineMessageEdit;
