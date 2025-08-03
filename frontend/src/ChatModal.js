// frontend/src/ChatModal.js
import React, { useState, useEffect } from 'react'; // Import useEffect
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton,
  Input, Button, VStack, Text, Box, Spinner, Center, InputGroup, InputRightElement
} from '@chakra-ui/react';
import axios from 'axios';

const ChatModal = ({ isOpen, onClose, stackId }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // --- NEW: This clears the chat history every time the modal opens ---
  useEffect(() => {
    if (isOpen) {
      setMessages([]);
    }
  }, [isOpen]); // This effect runs whenever the 'isOpen' prop changes

  const handleSendMessage = async () => {
    if (!input.trim() || !stackId) return;

    const userMessage = { sender: 'user', text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await axios.post(`http://127.0.0.1:8000/stacks/${stackId}/run`, { query: input });
      const aiMessage = { sender: 'ai', text: response.data.result };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error running stack:", error)
      const errorMessage = { sender: 'ai', text: 'Sorry, something went wrong.' };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl" isCentered> 
      <ModalOverlay />
      <ModalContent>
        <ModalHeader borderBottom="1px" borderColor="gray.200">GenAI Stack Chat</ModalHeader>
        <ModalCloseButton />
        <ModalBody p={6} height="500px" display="flex" flexDirection="column">
          <VStack spacing={4} align="stretch" overflowY="auto" flex="1" pb={4}>
            {messages.length === 0 && !isLoading && (
              <Center flex="1">
                <VStack>
                  <Text fontSize="lg" fontWeight="medium">GenAI Stack Chat</Text>
                  <Text color="gray.500">Start a conversation to test your stack</Text>
                </VStack>
              </Center>
            )}
            {messages.map((msg, index) => (
              <Box
                key={index}
                bg={msg.sender === 'user' ? 'blue.500' : 'gray.100'}
                color={msg.sender === 'user' ? 'white' : 'black'}
                p={3}
                borderRadius="lg"
                alignSelf={msg.sender === 'user' ? 'flex-end' : 'flex-start'}
                maxWidth="80%"
              >
                <Text>{msg.text}</Text>
              </Box>
            ))}
            {isLoading && (
              <Box alignSelf="flex-start" display="flex" alignItems="center">
                <Spinner size="sm" />
                <Text ml={2} color="gray.500">Thinking...</Text>
              </Box>
            )}
          </VStack>
          <InputGroup mt="auto">
            <Input
              placeholder="Send a message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <InputRightElement width="4.5rem">
              <Button h="1.75rem" size="sm" onClick={handleSendMessage} isLoading={isLoading}>
                Send
              </Button>
            </InputRightElement>
          </InputGroup>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ChatModal;