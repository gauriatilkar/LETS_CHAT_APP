import { Box, Text, HStack, Image } from "@chakra-ui/react";

const WhatsAppReply = ({ replyTo, currentUser }) => {
  if (!replyTo) return null;

  const renderRepliedContent = () => {
    const { content, mediaType, sender } = replyTo;

    if (mediaType === "image") {
      return (
        <HStack spacing={2} align="center">
          <Image
            src={content}
            alt="Replied to"
            boxSize="35px"
            borderRadius="md"
            objectFit="cover"
            border="1px solid rgba(255,255,255,0.3)"
          />
          <Text fontSize="sm" color="rgba(255,255,255,0.9)" fontWeight="medium">
            Photo
          </Text>
        </HStack>
      );
    }

    if (mediaType === "video") {
      return (
        <HStack spacing={2} align="center">
          <Box
            boxSize="35px"
            bg="rgba(255,255,255,0.2)"
            borderRadius="md"
            display="flex"
            alignItems="center"
            justifyContent="center"
            border="1px solid rgba(255,255,255,0.3)"
          >
            <Text fontSize="lg">▶️</Text>
          </Box>
          <Text fontSize="sm" color="rgba(255,255,255,0.9)" fontWeight="medium">
            Video
          </Text>
        </HStack>
      );
    }

    // Text content
    const truncatedContent =
      content.length > 40 ? content.substring(0, 40) + "..." : content;

    return (
      <Text
        fontSize="sm"
        color="rgba(255,255,255,0.9)"
        fontWeight="400"
        whiteSpace="pre-wrap"
      >
        {truncatedContent}
      </Text>
    );
  };

  return (
    <Box
      bg="rgba(0,0,0,0.15)"
      borderLeft="4px solid"
      borderLeftColor="rgba(0,150,255,0.8)"
      borderRadius="8px"
      p={1}
      mb={2}
      position="relative"
      backdropFilter="blur(4px)"
      _before={{
        content: '""',
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        bg: "rgba(255,255,255,0.05)",
        borderRadius: "8px",
        zIndex: -1,
      }}
    >
      <Text
        fontSize="xs"
        color="rgba(0,150,255,0.9)"
        fontWeight="bold"
        mb={1}
        textTransform="capitalize"
      >
      
      </Text>
      {renderRepliedContent()}
    </Box>
  );
};

export default WhatsAppReply;
