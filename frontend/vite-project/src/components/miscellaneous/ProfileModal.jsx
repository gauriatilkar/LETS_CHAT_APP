import React from "react";
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
  IconButton,
  Text,
  Image,
  Flex,
  Box,
} from "@chakra-ui/react";

const ProfileModal = ({ user, children }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <>
      {children ? (
        <span onClick={onOpen}>{children}</span>
      ) : (
        <IconButton
          icon={<ViewIcon />}
          onClick={onOpen}
          variant="ghost"
          color="#4A90E2"
          size="md"
          _hover={{
            bg: "blue.50",
          }}
        />
      )}

      <Modal size="md" onClose={onClose} isOpen={isOpen} isCentered>
        <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(5px)" />
        <ModalContent
          maxW="400px" // Make modal width smaller
          bg="white"
          borderRadius="lg"
          overflow="hidden"
          boxShadow="lg"
        >
          <Box bgGradient="linear(to-r, #4A90E2, #5E9FE3)" py={3} px={4}>
            <ModalHeader
              fontSize="lg"
              fontFamily="Work Sans"
              color="white"
              textAlign="center"
              p={0}
            >
              Profile
            </ModalHeader>
            <ModalCloseButton
              color="white"
              _hover={{
                bg: "whiteAlpha.300",
              }}
            />
          </Box>

          <ModalBody py={4}>
            <Flex direction="column" align="center" gap={3}>
              <Image
                borderRadius="full"
                boxSize="80px" // Reduce image size
                src={user.pic}
                alt={user.name}
                border="3px solid"
                borderColor="#4A90E2"
              />

              <Box textAlign="center" mt={2}>
                <Text
                  fontSize="md"
                  fontWeight="bold"
                  fontFamily="Work Sans"
                  color="gray.800"
                >
                  {user.name}
                </Text>
                <Text
                  fontSize="sm"
                  color="gray.600"
                  fontFamily="Work Sans"
                  mt={1}
                >
                  {user.email}
                </Text>
              </Box>
            </Flex>
          </ModalBody>

          <ModalFooter
            p={4}
            bg="gray.50"
            borderTop="1px"
            borderColor="gray.100"
          >
            <Button
              onClick={onClose}
              bg="#4A90E2"
              color="white"
              width="full"
              size="sm" // Smaller button
              fontFamily="Work Sans"
              _hover={{
                bg: "#5E9FE3",
              }}
            >
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default ProfileModal;
