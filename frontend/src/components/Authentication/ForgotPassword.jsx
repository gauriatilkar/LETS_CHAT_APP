import React, { useState } from "react";
import {
  VStack,
  FormControl,
  FormLabel,
  Input,
  Button,
} from "@chakra-ui/react";
import { useToast } from "@chakra-ui/react";
import axios from "axios";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const API_URL = import.meta.env.VITE_BACKEND_URL;

  const handleForgotPassword = async () => {
    if (!email) {
      toast({
        title: "Please enter your email",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    try {
      setLoading(true);
      await axios.post(`${API_URL}/api/user/forgot-password`, { email });
      toast({
        title: "Reset email sent!",
        description: "Check your inbox for reset instructions",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      setLoading(false);
    } catch (error) {
      toast({
        title: "Error Occurred",
        description: error.response?.data?.message || "Something went wrong",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      setLoading(false);
    }
  };

  return (
    <VStack spacing="10px">
      <FormControl id="email" isRequired>
        <FormLabel>Enter your email</FormLabel>
        <Input
          type="email"
          placeholder="Enter your email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </FormControl>
      <Button
        colorScheme="blue"
        width="100%"
        onClick={handleForgotPassword}
        isLoading={loading}
      >
        Send Reset Link
      </Button>
    </VStack>
  );
};

export default ForgotPassword;
