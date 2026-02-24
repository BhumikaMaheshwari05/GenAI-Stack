// frontend/src/EmbedCodeModal.js
import React from 'react';
import {
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton,
    Box, Text, Code, Button, useClipboard, VStack, HStack, Icon, Badge
} from '@chakra-ui/react';
import { FiCopy, FiCheck, FiCode, FiZap } from 'react-icons/fi';

const EmbedCodeModal = ({ isOpen, onClose, stackId }) => {
    const serverUrl = 'http://127.0.0.1:8000';
    const embedCode = `<script src="${serverUrl}/widget.js" data-stack-id="${stackId}"></script>`;
    const embedCodeDark = `<script src="${serverUrl}/widget.js" data-stack-id="${stackId}" data-theme="dark"></script>`;
    const embedCodeLight = `<script src="${serverUrl}/widget.js" data-stack-id="${stackId}" data-theme="light"></script>`;
    const embedCodeCustom = `<script src="${serverUrl}/widget.js" data-stack-id="${stackId}" data-title="My Assistant" data-theme="dark" data-position="bottom-right"></script>`;

    const { hasCopied, onCopy } = useClipboard(embedCode);

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="2xl" isCentered>
            <ModalOverlay bg="blackAlpha.700" />
            <ModalContent borderRadius="xl" overflow="hidden">
                <ModalHeader
                    bg="linear-gradient(135deg, #6C63FF, #e94560)"
                    color="white"
                    py={5}
                >
                    <HStack>
                        <Icon as={FiCode} />
                        <Text>Embed Your Intelliflow Chatbot</Text>
                    </HStack>
                    <Text fontSize="sm" fontWeight="normal" mt={1} opacity={0.85}>
                        Copy this code and paste it into any website
                    </Text>
                </ModalHeader>
                <ModalCloseButton color="white" />
                <ModalBody p={6}>
                    <VStack spacing={5} align="stretch">

                        {/* Main embed code */}
                        <Box>
                            <HStack mb={2}>
                                <Badge colorScheme="green" variant="subtle" px={2}>Recommended</Badge>
                                <Text fontSize="sm" fontWeight="semibold">Quick Embed (1 line)</Text>
                            </HStack>
                            <Box
                                bg="gray.900"
                                borderRadius="lg"
                                p={4}
                                position="relative"
                            >
                                <Code
                                    display="block"
                                    whiteSpace="pre-wrap"
                                    bg="transparent"
                                    color="green.300"
                                    fontSize="sm"
                                    fontFamily="mono"
                                >
                                    {embedCode}
                                </Code>
                                <Button
                                    size="sm"
                                    position="absolute"
                                    top={2}
                                    right={2}
                                    onClick={onCopy}
                                    leftIcon={<Icon as={hasCopied ? FiCheck : FiCopy} />}
                                    colorScheme={hasCopied ? 'green' : 'purple'}
                                    variant="solid"
                                    borderRadius="full"
                                >
                                    {hasCopied ? 'Copied!' : 'Copy'}
                                </Button>
                            </Box>
                        </Box>

                        {/* Customization options */}
                        <Box>
                            <Text fontSize="sm" fontWeight="semibold" mb={2}>
                                <Icon as={FiZap} mr={1} /> Customization Options
                            </Text>
                            <Box bg="gray.50" borderRadius="lg" p={4} fontSize="sm">
                                <VStack align="stretch" spacing={2}>
                                    <HStack>
                                        <Code colorScheme="purple" fontSize="xs">data-theme</Code>
                                        <Text color="gray.600">"dark" or "light" (default: dark)</Text>
                                    </HStack>
                                    <HStack>
                                        <Code colorScheme="purple" fontSize="xs">data-title</Code>
                                        <Text color="gray.600">Chat window title (default: "AI Assistant")</Text>
                                    </HStack>
                                    <HStack>
                                        <Code colorScheme="purple" fontSize="xs">data-position</Code>
                                        <Text color="gray.600">"bottom-right" or "bottom-left"</Text>
                                    </HStack>
                                    <HStack>
                                        <Code colorScheme="purple" fontSize="xs">data-server</Code>
                                        <Text color="gray.600">Custom server URL (if different from script origin)</Text>
                                    </HStack>
                                </VStack>
                            </Box>
                        </Box>

                        {/* Full example */}
                        <Box>
                            <Text fontSize="sm" fontWeight="semibold" mb={2}>Full Example with Options</Text>
                            <Box bg="gray.900" borderRadius="lg" p={4}>
                                <Code
                                    display="block"
                                    whiteSpace="pre-wrap"
                                    bg="transparent"
                                    color="cyan.300"
                                    fontSize="xs"
                                    fontFamily="mono"
                                >
                                    {embedCodeCustom}
                                </Code>
                            </Box>
                        </Box>

                        <Text fontSize="xs" color="gray.500" textAlign="center">
                            💡 Just paste the code before the closing {'</body>'} tag of your website
                        </Text>
                    </VStack>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
};

export default EmbedCodeModal;
