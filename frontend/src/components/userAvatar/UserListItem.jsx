import { Avatar } from "@chakra-ui/avatar";
import { Box, Text } from "@chakra-ui/layout";

const UserListItem = ({ user, handleFunction }) => {
  return (
    <Box
      onClick={handleFunction}
      cursor="pointer"
      bg="white"
      _hover={{
        bgGradient: "linear(to-r, hsl(217, 52%, 78%), hsl(224, 58%, 79%))",
        color: "white",
        transform: "translateY(-2px)",
      }}
      w="100%"
      display="flex"
      alignItems="center"
      color="hsl(224, 58%, 25%)"
      px={4}
      py={3}
      mb={2}
      borderRadius="lg"
      transition="all 0.2s ease"
      boxShadow="sm"
      border="1px solid"
      borderColor="gray.100"
    >
      <Avatar
        mr={3}
        size="md"
        cursor="pointer"
        name={user.name}
        src={user.pic}
        border="2px solid"
        borderColor="hsl(224, 58%, 79%)"
        _hover={{
          borderColor: "hsl(217, 52%, 78%)",
        }}
      />
      <Box>
        <Text 
          fontWeight="600" 
          fontSize="md"
          mb={1}
        >
          {user.name}
        </Text>
        <Text 
          fontSize="sm" 
          color="gray.600"
          _groupHover={{ color: "white" }}
        >
          <Text as="span" fontWeight="500">
            Email:{" "}
          </Text>
          {user.email}
        </Text>
      </Box>
    </Box>
  );
};

export default UserListItem;