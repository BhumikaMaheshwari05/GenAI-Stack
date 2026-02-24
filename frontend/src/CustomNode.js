// frontend/src/CustomNode.js
import React from 'react';
import { Handle, Position } from 'reactflow';
import { Box, Text, Input, Select, Textarea, Button, VStack, HStack, Switch, Icon, IconButton, Spacer } from '@chakra-ui/react';
import useStore from './store';
import axios from 'axios';
import {
  FiTrash2, FiEye, FiEyeOff, FiFileText, FiDatabase, FiLogOut, FiSettings, FiSearch,
  FiZap, FiFile, FiGitBranch
} from 'react-icons/fi';

const CustomNode = ({ id, data }) => {
  const { updateNodeData } = useStore();
  const [showApiKey, setShowApiKey] = React.useState(false);
  const [showSerpApiKey, setShowSerpApiKey] = React.useState(false);

  const icons = {
    'User Query': FiFileText,
    'Gemini AI': FiZap,
    'Knowledge Base': FiDatabase,
    'Web Search': FiSearch,
    'Git Repo': FiGitBranch,
    'PDF Generator': FiFile,
    'Output': FiLogOut,
  };
  const NodeIcon = icons[data.label] || FiFileText;

  const handleStyle = {
    width: '10px',
    height: '10px',
    background: '#3182CE',
    border: '2px solid white',
    boxShadow: '0px 0px 2px rgba(0,0,0,0.2)',
  };

  const onFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post("http://127.0.0.1:8000/uploadfile/", formData);
      updateNodeData(id, { fileName: response.data.filename });
      alert(`File "${response.data.filename}" uploaded successfully!`);
    } catch (error) {
      console.error("File upload failed:", error);
      alert("Error: Could not upload the file.");
    }
  };

  const renderNodeContent = () => {
    switch (data.label) {
      case 'User Query':
        return (<VStack align="stretch" spacing={2}> <Text fontSize="sm">Query</Text> <Textarea placeholder="Write your query here" value={data.query || ''} onChange={(e) => updateNodeData(id, { query: e.target.value })} bg="white" /> </VStack>);
      case 'Knowledge Base':
        return (<VStack align="stretch" spacing={3}> <Text fontSize="sm" fontWeight="medium">File for Knowledge Base</Text> {data.fileName ? (<HStack bg="white" p={2} borderRadius="md" justifyContent="space-between" borderWidth="1px"> <Text fontSize="sm" isTruncated>{data.fileName}</Text> <IconButton size="xs" aria-label="Remove file" icon={<FiTrash2 />} onClick={() => updateNodeData(id, { fileName: null })} /> </HStack>) : (<Button as="label" htmlFor={`file-upload-${id}`} cursor="pointer" variant="outline" colorScheme="gray" bg="white"> Upload File </Button>)} <Input id={`file-upload-${id}`} type="file" display="none" onChange={onFileChange} /> <Text fontSize="sm" fontWeight="medium">Embedding Model</Text> <Select value={data.embeddingModel || 'text-embedding-3-large'} onChange={(e) => updateNodeData(id, { embeddingModel: e.target.value })} bg="white"> <option value="text-embedding-3-large">text-embedding-3-large</option> <option value="text-embedding-3-small">text-embedding-3-small</option> </Select> <Text fontSize="sm" fontWeight="medium">API Key</Text> <HStack> <Input type={showApiKey ? 'text' : 'password'} placeholder="Enter your API Key" value={data.apiKey || ''} onChange={(e) => updateNodeData(id, { apiKey: e.target.value })} bg="white" /> <IconButton icon={showApiKey ? <FiEyeOff /> : <FiEye />} onClick={() => setShowApiKey(!showApiKey)} variant="ghost" /> </HStack> </VStack>);

      case 'Gemini AI':
        return (
          <VStack align="stretch" spacing={3}>
            <Text fontSize="sm" fontWeight="medium">Model</Text>
            <Select value={data.model || 'gemini-2.5-flash'} onChange={(e) => updateNodeData(id, { model: e.target.value })} bg="white">
              <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
              <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
            </Select>
            <Text fontSize="sm" fontWeight="medium">System Prompt</Text>
            <Textarea
              placeholder="You are a brilliant AI assistant."
              value={data.prompt || ''}
              onChange={(e) => updateNodeData(id, { prompt: e.target.value })}
              bg="white"
              minH="100px"
            />
            <Text fontSize="sm" fontWeight="medium">Temperature</Text>
            <Input type="number" step="0.1" value={data.temperature || 1.0} onChange={(e) => updateNodeData(id, { temperature: e.target.value })} bg="white" />
          </VStack>
        );
      case 'Web Search':
        return (
          <VStack align="stretch">
            <Text fontSize="sm" fontWeight="medium">SERP API Key</Text>
            <Input
              type="password"
              placeholder="Uses key from .env by default"
              value={data.serpApiKey || ''}
              onChange={(e) => updateNodeData(id, { serpApiKey: e.target.value })}
              bg="white"
            />
            <Text fontSize="xs" color="gray.500">
              Leave blank to use the key from your backend's .env file.
            </Text>
          </VStack>
        );
      case 'Git Repo':
        return (
          <VStack align="stretch" spacing={3}>
            <Text fontSize="sm" fontWeight="medium">GitHub Repository URL</Text>
            <Input
              placeholder="https://github.com/user/repo"
              value={data.repoUrl || ''}
              onChange={(e) => updateNodeData(id, { repoUrl: e.target.value })}
              bg="white"
            />
            <Text fontSize="xs" color="gray.500">
              Public repos only. The code will be used as context for the AI.
            </Text>
          </VStack>
        );

      case 'PDF Generator':
        return (
          <VStack align="stretch">
            <Text fontSize="sm" fontWeight="medium">PDF Filename</Text>
            <Input
              placeholder="report.pdf"
              value={data.filename || 'report.pdf'}
              onChange={(e) => updateNodeData(id, { filename: e.target.value })}
              bg="white"
            />
          </VStack>
        );
      case 'Output':
        return (<VStack align="stretch"> <Text fontSize="sm" fontWeight="medium">Output Text</Text> <Textarea isReadOnly placeholder="Output will be generated based on query" bg="gray.100" value={data.outputText || ''} /> </VStack>);
      default:
        return null;
    }
  };

  const titles = {
    'User Query': 'Enter point for querys',
    'Knowledge Base': 'Let LLM search info in your file',
    'Gemini AI': 'Google\'s state-of-the-art multimodal models',
    'Web Search': 'Search the web for real-time information',
    'Git Repo': 'Chat with your codebase',
    'PDF Generator': 'Create a downloadable PDF report',
    'Output': 'Output of the result nodes as text'
  };

  return (
    <Box
      border="1px solid"
      borderColor={data.label === 'User Query' ? 'blue.300' : 'gray.200'}
      borderRadius="lg"
      p={4}
      bg={data.label === 'User Query' ? 'white.50' : 'white'}
      width="350px"
      shadow="sm"
    >
      <Handle type="target" position={Position.Left} style={handleStyle} />
      <VStack align="stretch" spacing={4}>
        <HStack>
          <Icon as={NodeIcon} />
          <Text fontWeight="bold">{data.label}</Text>
          <Spacer />
          <Icon as={FiSettings} color="gray.400" _hover={{ color: "gray.700" }} cursor="pointer" />
        </HStack>
        <Text fontSize="sm" color="gray.500" bg="lavender">{titles[data.label]}</Text>
        <Box>{renderNodeContent()}</Box>
      </VStack>
      <Handle type="source" position={Position.Right} style={handleStyle} />
    </Box>
  );
};

export default CustomNode;