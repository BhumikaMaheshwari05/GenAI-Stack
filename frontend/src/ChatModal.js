// frontend/src/ChatModal.js
import React, { useState, useEffect } from 'react';
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton,
  Input, Button, VStack, Text, Box, Spinner, Center, InputGroup, InputRightElement,
  UnorderedList, ListItem, OrderedList, Heading, Code, Link
} from '@chakra-ui/react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { shadesOfPurple } from 'react-syntax-highlighter/dist/esm/styles/prism';

const ChatModal = ({ isOpen, onClose, stackId }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMessages([]);
    }
  }, [isOpen]);

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

  const MarkdownComponents = {
    p: ({ node, ...props }) => <Text mb={2} {...props} />,
    h1: ({ node, ...props }) => <Heading size="md" mt={4} mb={2} {...props} />,
    h2: ({ node, ...props }) => <Heading size="sm" mt={3} mb={2} {...props} />,
    h3: ({ node, ...props }) => <Heading size="xs" mt={2} mb={2} {...props} />,
    ul: ({ node, ...props }) => <UnorderedList mb={2} pl={4} {...props} />,
    ol: ({ node, ...props }) => <OrderedList mb={2} pl={4} {...props} />,
    li: ({ node, ...props }) => <ListItem mb={1} {...props} />,
    a: ({ node, ...props }) => <Link color="blue.500" isExternal {...props} />,
    code({ node, inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <Box my={4} borderRadius="md" overflow="hidden" fontSize="sm">
          <SyntaxHighlighter
            style={shadesOfPurple}
            language={match[1]}
            PreTag="div"
            {...props}
          >
            {String(children).replace(/\n$/, '')}
          </SyntaxHighlighter>
        </Box>
      ) : (
        <Code p={1} borderRadius="sm" {...props}>
          {children}
        </Code>
      );
    },
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl" isCentered>
      <ModalOverlay />
      <ModalContent maxH="85vh">
        <ModalHeader borderBottom="1px" borderColor="gray.200">Intelliflow Chat</ModalHeader>
        <ModalCloseButton />
        <ModalBody p={6} display="flex" flexDirection="column" height="70vh">
          <VStack spacing={4} align="stretch" overflowY="auto" flex="1" pb={4} pr={2}>
            {messages.length === 0 && !isLoading && (
              <Center flex="1">
                <VStack>
                  <Text fontSize="lg" fontWeight="medium">Intelliflow Chat</Text>
                  <Text color="gray.500">Start a conversation to test your stack</Text>
                </VStack>
              </Center>
            )}
            {messages.map((msg, index) => (
              <Box
                key={index}
                bg={msg.sender === 'user' ? 'blue.500' : 'gray.50'}
                color={msg.sender === 'user' ? 'white' : 'black'}
                p={4}
                borderRadius="2xl"
                borderTopRightRadius={msg.sender === 'user' ? '0' : '2xl'}
                borderTopLeftRadius={msg.sender === 'ai' ? '0' : '2xl'}
                alignSelf={msg.sender === 'user' ? 'flex-end' : 'flex-start'}
                maxWidth="90%"
                boxShadow="sm"
              >
                {msg.sender === 'user' ? (
                  <Text whiteSpace="pre-wrap">{msg.text}</Text>
                ) : (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={MarkdownComponents}
                  >
                    {msg.text}
                  </ReactMarkdown>
                )}
              </Box>
            ))}
            {isLoading && (
              <Box alignSelf="flex-start" display="flex" alignItems="center" p={2}>
                <Spinner size="sm" color="blue.500" />
                <Text ml={3} color="gray.500" fontStyle="italic">Thinking...</Text>
              </Box>
            )}
          </VStack>
          <InputGroup mt={4} size="lg">
            <Input
              placeholder="Type your query..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              borderRadius="full"
              focusBorderColor="blue.500"
            />
            <InputRightElement width="6rem">
              <Button
                h="2.5rem"
                size="sm"
                onClick={handleSendMessage}
                isLoading={isLoading}
                colorScheme="blue"
                borderRadius="full"
                mr={2}
              >
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