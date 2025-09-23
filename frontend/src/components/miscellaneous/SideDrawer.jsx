import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Text,
  Tooltip,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Avatar,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  Spinner,
  Stack,
  useBreakpointValue,
  IconButton,
} from "@chakra-ui/react";
import { BellIcon, ChevronDownIcon, SearchIcon } from "@chakra-ui/icons";
import { useDisclosure } from "@chakra-ui/hooks";
import { Input } from "@chakra-ui/input";
import { useToast } from "@chakra-ui/toast";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import ProfileModal from "./ProfileModal";
import { getSender } from "../../config/ChatLogics";
import UserListItem from "../userAvatar/UserListItem";
import { ChatState } from "../../Context/ChatProvider";

function SideDrawer() {
  const [search, setSearch] = useState("");
  const [searchResult, setSearchResult] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState(null);

  const {
    setSelectedChat,
    user,
    notification,
    setNotification,
    chats,
    setChats,
  } = ChatState();
  const chakraToast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const navigate = useNavigate();

  // Mobile responsive values
  const isMobile = useBreakpointValue({ base: true, md: false });
  const headerHeight = useBreakpointValue({ base: "60px", md: "80px" });
  const titleFontSize = useBreakpointValue({ base: "lg", md: "2xl" });
  const searchButtonSize = useBreakpointValue({ base: "sm", md: "md" });
  const avatarSize = useBreakpointValue({ base: "xs", md: "sm" });
  const padding = useBreakpointValue({ base: "8px", md: "20px" });
  const containerPadding = useBreakpointValue({ base: 2, md: 3 });

  useEffect(() => {
    setUnreadCount(notification.length);
  }, [notification]);

  const logoutHandler = () => {
    localStorage.removeItem("userInfo");
    navigate("/");
  };

  const API_URL = import.meta.env.VITE_BACKEND_URL;

  const handleSearch = async () => {
    if (!search) {
      toast.warning("Please enter something in search", {
        position: "top-left",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const config = {
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      };
      const { data } = await axios.get(
        `${API_URL}/api/user?search=${search}`,
        config
      );
      setSearchResult(Array.isArray(data) ? data : []);
    } catch (error) {
      setError(
        error.response?.data?.message || "Failed to load search results"
      );
      toast.error(
        error.response?.data?.message || "Failed to load search results",
        {
          position: "bottom-left",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        }
      );
    } finally {
      setLoading(false);
    }
  };

  const accessChat = async (userId) => {
    try {
      setLoadingChat(true);
      setError(null);
      const config = {
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${user?.token}`,
        },
      };
      const { data } = await axios.post(
        `${API_URL}/api/chat`,
        { userId },
        config
      );
      if (!chats.find((c) => c._id === data._id)) {
        setChats([data, ...chats]);
      }
      setSelectedChat(data);
      onClose();
    } catch (error) {
      setError(error.response?.data?.message || "Error fetching the chat");
      toast.error(error.response?.data?.message || "Error fetching the chat", {
        position: "bottom-left",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setLoadingChat(false);
    }
  };

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <Stack spacing={isMobile ? 2 : 4}>
      {[1, 2, 3].map((i) => (
        <Box
          key={i}
          p={isMobile ? 2 : 3}
          bg="gray.100"
          borderRadius="lg"
          height={isMobile ? "50px" : "60px"}
          animation="pulse 1.5s infinite"
        />
      ))}
    </Stack>
  );

  return (
    <>
      <Box
        bgGradient="linear(to-r, hsl(217, 52%, 78%), hsl(224, 58%, 79%))"
        p={containerPadding}
        borderRadius={isMobile ? "0" : "lg"}
        height={headerHeight}
        position="sticky"
        top="0"
        zIndex={100}
        boxShadow={isMobile ? "sm" : "none"}
      >
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          bg="white"
          w="100%"
          h="100%"
          p={`5px ${padding}`}
          borderRadius={isMobile ? "md" : "lg"}
          boxShadow="sm"
        >
          {/* Search Button - Mobile uses icon, desktop shows text */}
          <Tooltip
            label="Search Users to chat"
            hasArrow
            placement="bottom-end"
            bg="hsl(224, 58%, 79%)"
          >
            {isMobile ? (
              <IconButton
                icon={<SearchIcon />}
                variant="ghost"
                onClick={onOpen}
                size={searchButtonSize}
                _hover={{
                  bg: "gray.100",
                  transform: "translateY(-1px)",
                }}
                color="hsl(224, 58%, 25%)"
                aria-label="Search users"
              />
            ) : (
              <Button
                variant="ghost"
                onClick={onOpen}
                size={searchButtonSize}
                _hover={{
                  bg: "gray.100",
                  transform: "translateY(-1px)",
                }}
                color="hsl(224, 58%, 25%)"
              >
                <SearchIcon mr={2} />
                <Text>Search User</Text>
              </Button>
            )}
          </Tooltip>

          {/* App Title - Responsive font size */}
          <Text
            fontSize={titleFontSize}
            fontFamily="'Poppins','sans-serif'"
            fontWeight="extrabold"
            color="hsl(224, 58%, 25%)"
            textAlign="center"
            flex={isMobile ? 1 : "none"}
            noOfLines={1}
          >
            {isMobile ? "CHAT" : "LETS CHAT"}
          </Text>

          {/* Right side menu - Notifications and Profile */}
          <Flex align="center" gap={isMobile ? 1 : 3}>
            {/* Notifications */}
            <Menu>
              <MenuButton p={1} position="relative">
                {isMobile ? (
                  <IconButton
                    icon={<BellIcon />}
                    variant="ghost"
                    size="sm"
                    color="hsl(224, 58%, 25%)"
                    _hover={{ transform: "scale(1.1)" }}
                    transition="all 0.2s"
                    aria-label="Notifications"
                  />
                ) : (
                  <BellIcon
                    fontSize="2xl"
                    m={1}
                    color="hsl(224, 58%, 25%)"
                    _hover={{ transform: "scale(1.1)" }}
                    transition="all 0.2s"
                  />
                )}
                {unreadCount > 0 && (
                  <Box
                    position="absolute"
                    top={isMobile ? "-2px" : "-2px"}
                    right={isMobile ? "-2px" : "-2px"}
                    px={isMobile ? 1 : 2}
                    py={isMobile ? 0.5 : 1}
                    fontSize={isMobile ? "10px" : "xs"}
                    fontWeight="bold"
                    lineHeight="none"
                    color="white"
                    transform={isMobile ? "scale(0.6)" : "scale(0.7)"}
                    bg="red.500"
                    borderRadius="full"
                    minW={isMobile ? "16px" : "20px"}
                    textAlign="center"
                  >
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </Box>
                )}
              </MenuButton>
              <MenuList pl={2} boxShadow="lg" fontSize={isMobile ? "sm" : "md"}>
                {!notification.length && (
                  <Text p={3} color="gray.500" textAlign="center">
                    No New Messages
                  </Text>
                )}
                {notification.slice(0, isMobile ? 5 : 10).map((notif) => (
                  <MenuItem
                    key={notif._id}
                    onClick={() => {
                      setSelectedChat(notif.chat);
                      setNotification(notification.filter((n) => n !== notif));
                    }}
                    _hover={{ bg: "gray.100" }}
                    fontSize={isMobile ? "xs" : "sm"}
                    py={isMobile ? 2 : 3}
                  >
                    <Text noOfLines={2}>
                      {notif.chat.isGroupChat
                        ? `New Message in ${notif.chat.chatName}`
                        : `New Message from ${getSender(
                            user,
                            notif.chat.users
                          )}`}
                    </Text>
                  </MenuItem>
                ))}
                {notification.length > (isMobile ? 5 : 10) && (
                  <MenuItem fontSize="xs" color="gray.500" textAlign="center">
                    +{notification.length - (isMobile ? 5 : 10)} more
                  </MenuItem>
                )}
              </MenuList>
            </Menu>

            {/* Profile Menu */}
            <Menu>
              <MenuButton
                as={Button}
                bg="transparent"
                rightIcon={
                  isMobile ? undefined : (
                    <ChevronDownIcon color="hsl(224, 58%, 25%)" />
                  )
                }
                _hover={{ bg: "gray.100" }}
                _active={{ bg: "gray.200" }}
                size={isMobile ? "sm" : "md"}
                p={isMobile ? 1 : 2}
              >
                <Avatar
                  size={avatarSize}
                  cursor="pointer"
                  name={user?.name}
                  src={user?.pic}
                  border={`2px solid hsl(224, 58%, 79%)`}
                />
                {isMobile && (
                  <ChevronDownIcon
                    ml={1}
                    color="hsl(224, 58%, 25%)"
                    boxSize={3}
                  />
                )}
              </MenuButton>
              <MenuList boxShadow="lg" fontSize={isMobile ? "sm" : "md"}>
                <ProfileModal user={user}>
                  <MenuItem _hover={{ bg: "gray.100" }} py={isMobile ? 2 : 3}>
                    My Profile
                  </MenuItem>
                </ProfileModal>
                <MenuDivider />
                <MenuItem
                  onClick={logoutHandler}
                  _hover={{ bg: "gray.100" }}
                  py={isMobile ? 2 : 3}
                  color="red.500"
                >
                  Logout
                </MenuItem>
              </MenuList>
            </Menu>
          </Flex>
        </Box>
      </Box>

      {/* Search Drawer - Mobile optimized */}
      <Drawer
        placement="left"
        onClose={onClose}
        isOpen={isOpen}
        size={isMobile ? "xs" : "sm"}
      >
        <DrawerOverlay />
        <DrawerContent>
          <DrawerHeader
            borderBottomWidth="1px"
            bgGradient="linear(to-r, hsl(217, 52%, 78%), hsl(224, 58%, 79%))"
            color="white"
            fontSize={isMobile ? "md" : "lg"}
            py={isMobile ? 3 : 4}
          >
            Search Users
          </DrawerHeader>
          <DrawerBody p={isMobile ? 3 : 4}>
            <Box display="flex" pb={isMobile ? 3 : 4} gap={2}>
              <Input
                placeholder={isMobile ? "Search..." : "Search by name or email"}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                focusBorderColor="hsl(224, 58%, 79%)"
                size={isMobile ? "sm" : "md"}
                fontSize={isMobile ? "sm" : "md"}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleSearch();
                  }
                }}
              />
              <Button
                onClick={handleSearch}
                bgGradient="linear(to-r, hsl(217, 52%, 78%), hsl(224, 58%, 79%))"
                color="white"
                _hover={{
                  bgGradient:
                    "linear(to-r, hsl(217, 52%, 70%), hsl(224, 58%, 70%))",
                }}
                isLoading={loading}
                size={isMobile ? "sm" : "md"}
                px={isMobile ? 3 : 4}
              >
                {isMobile ? <SearchIcon /> : "Go"}
              </Button>
            </Box>

            {loading ? (
              <LoadingSkeleton />
            ) : error ? (
              <Text
                color="red.500"
                textAlign="center"
                mt={4}
                fontSize={isMobile ? "sm" : "md"}
              >
                {error}
              </Text>
            ) : (
              <Box>
                {Array.isArray(searchResult) && searchResult.length > 0 ? (
                  <Stack spacing={isMobile ? 1 : 2}>
                    {searchResult.map((searchUser) => (
                      <UserListItem
                        key={searchUser._id}
                        user={searchUser}
                        handleFunction={() => accessChat(searchUser._id)}
                      />
                    ))}
                  </Stack>
                ) : (
                  <Text
                    color="hsl(224, 58%, 25%)"
                    textAlign="center"
                    mt={4}
                    fontSize={isMobile ? "sm" : "md"}
                  >
                    {search
                      ? "No users found"
                      : "Search for users to start chatting"}
                  </Text>
                )}
              </Box>
            )}

            {loadingChat && (
              <Flex justify="center" mt={4}>
                <Spinner size={isMobile ? "md" : "lg"} color="blue.500" />
              </Flex>
            )}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
}

export default SideDrawer;
