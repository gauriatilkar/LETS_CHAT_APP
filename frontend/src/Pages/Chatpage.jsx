import React, { useState } from "react";
import {
  Box,
  IconButton,
  useBreakpointValue,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useDisclosure,
} from "@chakra-ui/react";
import { HamburgerIcon } from "@chakra-ui/icons";
import Chatbox from "../components/Chatbox";
import MyChats from "../components/MyChats";
import SideDrawer from "../components/miscellaneous/SideDrawer";
import { ChatState } from "../Context/ChatProvider";

const Chatpage = () => {
  const [fetchAgain, setFetchAgain] = useState(false);
  const { user, selectedChat } = ChatState();
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Determine if we're on mobile
  const isMobile = useBreakpointValue({ base: true, md: false });

  return (
    <div style={{ width: "100%" }}>
      {user && <SideDrawer />}

      <Box
        display="flex"
        w="100%"
        h="91.5vh"
        p={{ base: "5px", md: "10px" }}
        position="relative"
        gap='30px'
      >
        {/* Mobile Hamburger Menu Button */}
        {isMobile && (
          <IconButton
            icon={<HamburgerIcon />}
            onClick={onOpen}
            position="fixed"
            top="70px"
            left="10px"
            zIndex={1000}
            size="md"
            colorScheme="blue"
            borderRadius="full"
            boxShadow="lg"
            bg="white"
            color="blue.500"
            _hover={{ bg: "blue.50" }}
            display={selectedChat ? "flex" : "none"}
            aria-label="Open chats menu"
          />
        )}

        {/* Desktop MyChats - Always visible on desktop */}
        {!isMobile && user && <MyChats fetchAgain={fetchAgain} />}

        {/* Mobile Drawer for MyChats */}
        {isMobile && (
          <Drawer isOpen={isOpen} placement="left" onClose={onClose} size="xs">
            <DrawerOverlay />
            <DrawerContent maxW="280px">
              <DrawerCloseButton />
              <Box pt={8}>
                <MyChats fetchAgain={fetchAgain} onChatSelect={onClose} />
              </Box>
            </DrawerContent>
          </Drawer>
        )}

        {/* Mobile MyChats - Only show when no chat is selected */}
        {isMobile && !selectedChat && user && (
          <MyChats fetchAgain={fetchAgain} />
        )}

        {/* Chatbox */}
        {user && (
          <Chatbox
            fetchAgain={fetchAgain}
            setFetchAgain={setFetchAgain}
            w={isMobile && selectedChat ? "100%" : { base: "100%", md: "70%" }}
          />
        )}
      </Box>
    </div>
  );
};

export default Chatpage;
