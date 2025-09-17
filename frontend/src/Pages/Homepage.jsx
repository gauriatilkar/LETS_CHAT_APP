import React, { useEffect } from "react";
import {
  Box,
  Container,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  Image,
  Flex,
} from "@chakra-ui/react";
import { useNavigate } from "react-router";
import Login from "../components/Authentication/Login";
import Signup from "../components/Authentication/Signup";

function Homepage() {
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("userInfo"));

    if (user) navigate("/chats");
  }, [navigate]);

  return (
   
      <Container
        maxW="md"
        centerContent
        p={6}
        boxShadow="2xl"
        bg="white"
        borderRadius="lg"
      >
        {/* Header with Logo */}
        <Box
          bgGradient="linear(to-r, #3182ce, #63b3ed)" // Blue gradient
          p={4}
          borderRadius="lg"
          textAlign="center"
          w="full"
          boxShadow="md"
          mb={6}
        >
          <Flex align="center" justify="center" gap={3}>
            <Image
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQU4o1JbeuV8DcDTSIe5gcnDAmI-DLXI_ZD7A&s"
              alt="Let's Chat Logo"
              boxSize="40px"
              borderRadius="full"
              boxShadow="md"
            />
            <Text
              fontSize="3xl"
              fontWeight="extrabold"
              fontFamily="'Poppins', sans-serif"
              color="white"
            >
              LET'S CHAT
            </Text>
          </Flex>
        </Box>

        {/* Tabs Section */}
        <Box
          bg="white"
          w="full"
          p={6}
          borderRadius="lg"
          boxShadow="lg"
          borderWidth="1px"
          borderColor="gray.200"
        >
          <Tabs isFitted variant="soft-rounded" colorScheme="blue"> {/* Updated to blue */}
            <TabList mb="4">
              <Tab
                _selected={{
                  color: "white",
                  bg: "#3182ce", // Dark blue
                  fontWeight: "bold",
                }}
                fontFamily="'Poppins', sans-serif"
              >
                Login
              </Tab>
              <Tab
                _selected={{
                  color: "white",
                  bg: "#63b3ed", // Lighter blue
                  fontWeight: "bold",
                }}
                fontFamily="'Poppins', sans-serif"
              >
                Sign Up
              </Tab>
            </TabList>
            <TabPanels>
              <TabPanel>
                <Login />
              </TabPanel>
              <TabPanel>
                <Signup />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Box>
      </Container>
    
  );
}

export default Homepage;
