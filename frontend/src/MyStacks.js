// frontend/src/MyStacks.js
import logo from './assets/ai_logo.png'
import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  Image,
  SimpleGrid,
  Button,
  Spinner,
  Center,
  VStack,
  Flex,
  Spacer,
  Avatar,
  Icon,
  IconButton,
  HStack,
  useDisclosure // Import useDisclosure
} from '@chakra-ui/react';
import { FiExternalLink, FiTrash2 } from 'react-icons/fi';
import axios from 'axios';
import CreateStackModal from './CreateStackModal'; // Import the modal

const StackCard = ({ stack, onEdit, onDelete }) => (
  <Box
    p={6}
    bg="white"
    shadow="sm"
    borderWidth="1px"
    borderColor="gray.200"
    borderRadius="lg"
    _hover={{ shadow: 'md', transform: 'translateY(-2px)', transition: 'transform 0.2s ease-in-out' }}
    display="flex"
    flexDirection="column"
  >
    <HStack justifyContent="space-between" mb={2}>
      <Heading fontSize="lg">{stack.name}</Heading>
      <IconButton
        icon={<FiTrash2 />}
        size="sm"
        variant="ghost"
        colorScheme="red"
        aria-label="Delete stack"
        onClick={() => onDelete(stack.id)}
      />
    </HStack>
    <Text color="gray.500" noOfLines={2} flex="1">{stack.description || 'No description provided.'}</Text>
    <Button
      mt={5}
      size="sm"
      variant="outline"
      colorScheme="gray"
      fontWeight="medium"
      rightIcon={<Icon as={FiExternalLink} />}
      onClick={() => onEdit(stack.id)}
    >
      Edit Stack
    </Button>
  </Box>
);

const MyStacks = ({ onNavigate }) => {
  const [stacks, setStacks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isOpen, onOpen, onClose } = useDisclosure(); // Modal state

  useEffect(() => {
    const fetchStacks = async () => {
      try {
        const response = await axios.get("http://127.0.0.1:8000/stacks/");
        setStacks(response.data);
      } catch (error) {
        console.error("Failed to fetch stacks:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStacks();
  }, []);

  const handleDelete = async (stackId) => {
    if (window.confirm('Are you sure you want to delete this stack?')) {
      try {
        await axios.delete(`http://127.0.0.1:8000/stacks/${stackId}`);
        setStacks(stacks.filter(stack => stack.id !== stackId));
      } catch (error) {
        console.error("Failed to delete stack:", error);
        alert("Could not delete the stack.");
      }
    }
  };

  // --- NEW: Function to create a stack and then navigate ---
  const handleCreateAndNavigate = async ({ name, description }) => {
    try {
      const response = await axios.post("http://127.0.0.1:8000/stacks/", { name, description });
      const newStackId = response.data.id;
      onClose(); // Close the modal
      onNavigate('builder', newStackId); // Navigate to the builder with the new ID
    } catch (error) {
      console.error("Failed to create stack:", error);
      alert("Could not create the stack.");
    }
  };

  const Navbar = () => (
    <Flex
      as="nav"
      bg="white"
      px={8}
      py={4}
      justifyContent="space-between"
      alignItems="center"
      borderBottom="1px"
      borderColor="gray.200"
    >
      <Flex align="center" cursor="pointer" onClick={() => onNavigate('stacks')} gap={2}>
        <Image src={logo} alt="AI Logo" boxSize="20px" />
        <Heading size="md">Intelliflow</Heading>
      </Flex>

      <Spacer />
      <Button
        colorScheme="green"
        onClick={onOpen} // Open modal instead of navigating
      >
        + New Stack
      </Button>
      <Avatar size="sm" name="User" ml={4} />
    </Flex>
  );

  if (isLoading) {
    return <Center height="100vh" bg="gray.50"><Spinner /></Center>;
  }

  return (
    <>
      <Box bg="gray.50" minH="100vh">
        <Navbar />
        <Box p={8}>
          {stacks.length === 0 ? (
            // --- NEW: UI for when no stacks exist ---
            <Center mt="20vh">
              <VStack
                bg="white"
                p={10}
                borderRadius="xl"
                shadow="sm"
                spacing={4}
                borderWidth="1px"
                borderColor="gray.200"
              >
                <Heading size="md">Create New Stack</Heading>
                <Text color="gray.500" textAlign="center">
                  Start building your generative AI apps with <br /> our essential tools and frameworks
                </Text>
                <Button colorScheme="green" onClick={onOpen}>
                  + New Stack
                </Button>
              </VStack>
            </Center>
          ) : (
            <>
              <Heading mb={6}>My Stacks</Heading>
              <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={8}>
                {stacks.map((stack) => (
                  <StackCard
                    key={stack.id}
                    stack={stack}
                    onEdit={() => onNavigate('builder', stack.id)}
                    onDelete={handleDelete}
                  />
                ))}
              </SimpleGrid>
            </>
          )}
        </Box>
      </Box>
      <CreateStackModal isOpen={isOpen} onClose={onClose} onSave={handleCreateAndNavigate} />
    </>
  );
};

export default MyStacks;