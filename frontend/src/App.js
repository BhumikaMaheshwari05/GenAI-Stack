// frontend/src/App.js
import logo from './assets/ai_logo.png';
import React, { useCallback, useRef, useEffect, useState } from 'react';
import {
  ChakraProvider, Box, Flex, Heading, Button, useDisclosure, Icon, Spacer, Avatar, useToast, Text,Image, VStack
} from '@chakra-ui/react';
// FiSearch has been added to this line
import { FiMessageSquare, FiFileText, FiCpu, FiDatabase, FiLogOut, FiMenu, FiSave, FiSearch } from 'react-icons/fi';
import ReactFlow, {
  Controls, Background, Position
} from 'reactflow';
import 'reactflow/dist/style.css';
import CustomNode from './CustomNode';
import ChatModal from './ChatModal';
import MyStacks from './MyStacks';
import CreateStackModal from './CreateStackModal';
import axios from 'axios';
import theme from './theme';
import useStore from './store';

let id = 0;
const getId = () => `dndnode_${id++}`;

const Sidebar = ({ onChatOpen, isChatDisabled }) => {
    const onDragStart = (event, nodeType, label) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.setData('application/reactflow-label', label);
        event.dataTransfer.effectAllowed = 'move';
      };
    
      const components = [
        { type: 'userQuery', label: 'User Query', icon: FiFileText },
        { type: 'llmEngine', label: 'LLM (OpenAI)', icon: FiCpu },
        { type: 'knowledgeBase', label: 'Knowledge Base', icon: FiDatabase },
        { type: 'webSearch', label: 'Web Search', icon: FiSearch },
        { type: 'output', label: 'Output', icon: FiLogOut },
      ];
    
      return (
        <Box width="280px" bg="white" p={4} borderRight="1px" borderColor="gray.200">
          <Button
            justifyContent="space-between" width="100%" fontWeight="medium"
            rightIcon={<Icon as={FiMessageSquare} />}
            onClick={onChatOpen} isDisabled={isChatDisabled} mb={6}
          >
            Chat With AI
          </Button>
    
          <Text mb={4} fontWeight="bold" fontSize="md">Components</Text>
          <VStack align="stretch" spacing={3}>
            {components.map((comp) => (
              <Flex
                key={comp.type} p={3} borderWidth="1px" borderRadius="md" bg="white" cursor="grab" alignItems="center"
                _hover={{ shadow: 'sm', borderColor: 'blue.500' }}
                onDragStart={(event) => onDragStart(event, comp.type, comp.label)} draggable
              >
                <Icon as={comp.icon} mr={3} />
                <Text fontSize="sm" fontWeight="medium">{comp.label}</Text>
                <Spacer />
                <Icon as={FiMenu} color="gray.400" />
              </Flex>
            ))}
          </VStack>
        </Box>
      );
};

const nodeTypes = { custom: CustomNode };

const WorkflowBuilder = ({ stackToLoad, onNavigate }) => {
  const reactFlowWrapper = useRef(null);
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, setNodes, setEdges } = useStore();
  const toast = useToast();

  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure();
  const { isOpen: isChatOpen, onOpen: onChatOpen, onClose: onChatClose } = useDisclosure();
  
  const [activeStackId, setActiveStackId] = useState(stackToLoad);
  const [activeStackName, setActiveStackName] = useState("Untitled Stack");
  const [activeStackDesc, setActiveStackDesc] = useState("");
  const [isStackBuilt, setIsStackBuilt] = useState(!!stackToLoad);

  useEffect(() => {
    setIsStackBuilt(!!stackToLoad);
    if (stackToLoad) {
      setActiveStackId(stackToLoad);
      const fetchStack = async () => {
        try {
          const response = await axios.get(`http://127.0.0.1:8000/stacks/${stackToLoad}`);
          const { name, description, workflow_definition } = response.data;
          setNodes(workflow_definition.nodes || []);
          setEdges(workflow_definition.edges || []);
          setActiveStackName(name);
          setActiveStackDesc(description);
        } catch (error) { console.error("Failed to load stack:", error); }
      };
      fetchStack();
    } else {
      setNodes([]); setEdges([]); setActiveStackId(null);
      setActiveStackName("Untitled Stack"); setActiveStackDesc("");
    }
  }, [stackToLoad, setNodes, setEdges]);

  const handleNodesChange = (changes) => { setIsStackBuilt(false); onNodesChange(changes); };
  const handleEdgesChange = (changes) => { setIsStackBuilt(false); onEdgesChange(changes); };
  
  const onDrop = useCallback((event) => {
    event.preventDefault();
    const label = event.dataTransfer.getData('application/reactflow-label');
    const position = { 
        x: event.clientX - reactFlowWrapper.current.getBoundingClientRect().left - 280,
        y: event.clientY - reactFlowWrapper.current.getBoundingClientRect().top - 70 
    };
    setNodes([...nodes, { id: getId(), type: 'custom', position, data: { label } }]);
    setIsStackBuilt(false);
  }, [nodes, setNodes]);

  const handleSaveFlow = async (saveData) => {
    const isUpdating = !!activeStackId;
    const url = isUpdating ? `http://127.0.0.1:8000/stacks/${activeStackId}` : "http://127.0.0.1:8000/stacks/";
    const method = isUpdating ? 'put' : 'post';
    const payload = { ...saveData, workflow_definition: { nodes, edges } };

    try {
      const response = await axios[method](url, payload);
      const newId = response.data.id;
      setActiveStackId(newId);
      setActiveStackName(response.data.name);
      setActiveStackDesc(response.data.description);
      toast({ title: "Stack Saved!", status: "success", duration: 2000, isClosable: true });
      return newId;
    } catch (error) {
      console.error("Failed to save stack:", error);
      toast({ title: "Error Saving", status: "error", duration: 3000, isClosable: true });
      return null;
    }
  };
  
  const handleSaveClick = () => {
      if (activeStackId) {
          handleSaveFlow({ name: activeStackName, description: activeStackDesc });
      } else {
          onCreateOpen();
      }
  };

  const handleBuildStack = async () => {
      if (!activeStackId) {
        toast({ title: "Save Required", description: "Please save your stack first.", status: "warning", duration: 3000, isClosable: true });
        onCreateOpen();
        return;
      }
      
      await handleSaveFlow({ name: activeStackName, description: activeStackDesc });
      const nodeLabels = nodes.map(node => `• ${node.data.label}`).join('\n');
      const alertMessage = `Building workflow with ${nodes.length} components and ${edges.length} connections:\n\n${nodeLabels}`;
      window.alert(alertMessage);
      setIsStackBuilt(true);
  };
  
  const onDragOver = useCallback((event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; }, []);

  return (
    <>
      <Flex direction="column" height="100vh" bg="#F9FAFB">
        <Flex bg="white" px={6} py={3} alignItems="center" borderBottom="1px" borderColor="gray.200">
          <Flex align="center" cursor="pointer" onClick={() => onNavigate('stacks')} gap={2}>
  <Image src={logo} alt="AI Logo" boxSize="20px" />
  <Heading size="md">GenAI Stack</Heading>
</Flex>

          <Spacer />
          <Button variant="outline" colorScheme="gray" leftIcon={<Icon as={FiSave} />} onClick={handleSaveClick}>Save</Button>
          <Avatar size="sm" name="User" ml={4} />
        </Flex>
        
        <Flex flex="1" overflow="hidden">
          <Sidebar onChatOpen={onChatOpen} isChatDisabled={!isStackBuilt} />
          <Box flex="1" ref={reactFlowWrapper} position="relative">
            <ReactFlow
              nodes={nodes} edges={edges} nodeTypes={nodeTypes}
              onNodesChange={handleNodesChange} onEdgesChange={handleEdgesChange} onConnect={onConnect}
              onDragOver={onDragOver} onDrop={onDrop} fitView proOptions={{ hideAttribution: true }}
            >
              <Background variant="dots" gap={24} size={1} />
              <Controls position={Position.BottomCenter} showInteractive={false} />
            </ReactFlow>
            <Button position="absolute" bottom="30px" right="30px" onClick={handleBuildStack}>Build Stack</Button>
          </Box>
        </Flex>
      </Flex>
      <ChatModal isOpen={isChatOpen} onClose={onChatClose} stackId={activeStackId} />
      <CreateStackModal isOpen={isCreateOpen} onClose={onCreateClose} onSave={handleSaveFlow} />
    </>
  );
}

function App() {
    const [page, setPage] = useState('stacks');
    const [stackToLoad, setStackToLoad] = useState(null);
    const handleNavigate = (targetPage, id = null) => { setStackToLoad(id); setPage(targetPage); };

    return (
      <ChakraProvider theme={theme}>
        {page === 'stacks' && <MyStacks onNavigate={handleNavigate} />}
        {page === 'builder' && <WorkflowBuilder stackToLoad={stackToLoad} onNavigate={handleNavigate} />}
      </ChakraProvider>
    );
}

export default App;