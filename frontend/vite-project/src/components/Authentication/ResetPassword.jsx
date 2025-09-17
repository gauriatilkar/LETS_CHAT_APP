import React, { useState } from "react";
import {
  VStack,
  FormControl,
  FormLabel,
  Input,
  Button,
} from "@chakra-ui/react";
import { useToast } from "@chakra-ui/react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();
  const { token } = useParams(); // token from URL

  const API_URL = import.meta.env.VITE_BACKEND_URL;

  const handleResetPassword = async () => {
    if (!password) {
      toast({
        title: "Please enter a new password",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    try {
      setLoading(true);
      await axios.post(`${API_URL}/api/user/reset-password/${token}`, {
        password,
      });
      toast({
        title: "Password reset successful",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      setLoading(false);
      navigate("/"); // back to login
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
      <FormControl id="password" isRequired>
        <FormLabel>New Password</FormLabel>
        <Input
          type="password"
          placeholder="Enter new password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </FormControl>
      <Button
        colorScheme="blue"
        width="100%"
        onClick={handleResetPassword}
        isLoading={loading}
      >
        Reset Password
      </Button>
    </VStack>
  );
};

export default ResetPassword;
