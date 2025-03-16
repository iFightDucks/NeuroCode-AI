"use client"

import "../index.css"
import React, { useState, useEffect, useContext, useRef } from "react"
import { UserContext } from "../context/user.context"
import { useLocation } from "react-router-dom"
import axios from "../config/axios"
import { initializeSocket, receiveMessage, sendMessage } from "../config/socket"
import Markdown from "markdown-to-jsx"
import hljs from "highlight.js"
import { getWebContainer, isWebContainerSupported } from "../config/webContainer"

// Add resize functionality
const ResizeHandle = ({ direction, onResize }) => {
  const handleRef = useRef(null);
  const isResizing = useRef(false);
  const lastPosition = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e) => {
    isResizing.current = true;
    lastPosition.current = { x: e.clientX, y: e.clientY };
    document.body.classList.add('resize-active');
    
    // Add event listeners to document to handle mouse movement and release
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    // Prevent default to avoid text selection during resize
    e.preventDefault();
    
    // Add active class to handle
    if (handleRef.current) {
      handleRef.current.classList.add('active');
    }
  };

  const handleMouseMove = (e) => {
    if (!isResizing.current) return;
    
    const deltaX = e.clientX - lastPosition.current.x;
    const deltaY = e.clientY - lastPosition.current.y;
    
    lastPosition.current = { x: e.clientX, y: e.clientY };
    
    if (onResize) {
      onResize(direction, deltaX, deltaY);
    }
  };

  const handleMouseUp = () => {
    isResizing.current = false;
    document.body.classList.remove('resize-active');
    
    // Remove event listeners
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    
    // Remove active class from handle
    if (handleRef.current) {
      handleRef.current.classList.remove('active');
    }
  };

  const isHorizontal = direction === 'right' || direction === 'left';
  const className = `resize-handle ${isHorizontal ? 'resize-handle-horizontal' : 'resize-handle-vertical'} resize-handle-${direction}`;

  return (
    <div 
      ref={handleRef}
      className={className}
      onMouseDown={handleMouseDown}
    />
  );
};

function SyntaxHighlightedCode(props) {
    const ref = useRef(null)

    React.useEffect(() => {
    if (ref.current && props.className?.includes("lang-") && window.hljs) {
            window.hljs.highlightElement(ref.current)
      ref.current.removeAttribute("data-highlighted")
        }
  }, [props.className, props.children])

    return <code {...props} ref={ref} />
}

// Terminal component
const Terminal = ({ webContainer, fileTree, onFileTreeChange }) => {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentDirectory, setCurrentDirectory] = useState("/");
  const outputRef = useRef(null);
  const currentCommand = useRef(null);

  // Initialize terminal with welcome message
  useEffect(() => {
    setOutput([
      { 
        type: 'system', 
        text: 'Terminal connected to file system. Type "help" for available commands.' 
      }
    ]);
  }, []);

  // Auto-scroll to bottom of terminal output
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  // Sync file tree with WebContainer when fileTree changes
  useEffect(() => {
    if (webContainer && Object.keys(fileTree).length > 0) {
      syncFilesToWebContainer();
    }
  }, [fileTree, webContainer]);

  // Sync files from fileTree to WebContainer
  const syncFilesToWebContainer = async () => {
    if (!webContainer) return;
    
    try {
      // Add a message to the terminal
      setOutput(prev => [...prev, { 
        type: 'system', 
        text: 'Syncing files to terminal environment...' 
      }]);
      
      // Mount the file tree to the WebContainer
      await webContainer.mount(fileTree);
      
      setOutput(prev => [...prev, { 
        type: 'system', 
        text: 'Files synced successfully. You can now interact with them using terminal commands.' 
      }]);
    } catch (error) {
      console.error('Error syncing files to WebContainer:', error);
      setOutput(prev => [...prev, { 
        type: 'error', 
        text: `Error syncing files: ${error.message}` 
      }]);
    }
  };

  // Handle built-in commands
  const handleBuiltInCommands = async (cmd) => {
    const parts = cmd.trim().split(/\s+/);
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);
    
    switch (command) {
      case 'help':
        return [
          { type: 'system', text: 'Available commands:' },
          { type: 'system', text: '  help - Show this help message' },
          { type: 'system', text: '  ls - List files in current directory' },
          { type: 'system', text: '  cd <dir> - Change directory' },
          { type: 'system', text: '  cat <file> - Display file contents' },
          { type: 'system', text: '  pwd - Show current directory' },
          { type: 'system', text: '  mkdir <dir> - Create directory' },
          { type: 'system', text: '  touch <file> - Create empty file' },
          { type: 'system', text: '  echo "<text>" > <file> - Write text to file' },
          { type: 'system', text: '  rm <file> - Remove file' },
          { type: 'system', text: '  clear - Clear terminal' },
          { type: 'system', text: 'You can also run npm, node, and other commands.' }
        ];
        
      case 'clear':
        setOutput([]);
        return null;
        
      case 'ls':
        if (!webContainer) {
          return [{ type: 'error', text: 'WebContainer not initialized' }];
        }
        
        try {
          const dirPath = args[0] || currentDirectory;
          const entries = await webContainer.fs.readdir(dirPath, { withFileTypes: true });
          
          if (entries.length === 0) {
            return [{ type: 'system', text: 'Directory is empty' }];
          }
          
          return entries.map(entry => {
            const isDir = entry.isDirectory();
            return { 
              type: 'output', 
              text: `${isDir ? 'Directory: ' : 'File: '}${entry.name}${isDir ? '/' : ''}` 
            };
          });
        } catch (error) {
          return [{ type: 'error', text: `Error listing directory: ${error.message}` }];
        }
        
      case 'cd':
        if (!webContainer) {
          return [{ type: 'error', text: 'WebContainer not initialized' }];
        }
        
        if (!args[0]) {
          setCurrentDirectory('/');
          return [{ type: 'system', text: 'Changed to root directory' }];
        }
        
        try {
          let newPath = args[0];
          
          // Handle relative paths
          if (!newPath.startsWith('/')) {
            newPath = `${currentDirectory === '/' ? '' : currentDirectory}/${newPath}`;
          }
          
          // Normalize path (handle .. and .)
          newPath = newPath.replace(/\/\.\//g, '/').replace(/\/[^/]+\/\.\.\//g, '/');
          if (newPath.endsWith('/..')) {
            newPath = newPath.substring(0, newPath.lastIndexOf('/'));
          }
          if (!newPath.startsWith('/')) newPath = '/' + newPath;
          if (newPath !== '/' && newPath.endsWith('/')) {
            newPath = newPath.slice(0, -1);
          }
          
          // Check if directory exists
          const stat = await webContainer.fs.stat(newPath);
          if (!stat.isDirectory()) {
            return [{ type: 'error', text: 'Not a directory' }];
          }
          
          setCurrentDirectory(newPath);
          return [{ type: 'system', text: `Changed directory to ${newPath}` }];
        } catch (error) {
          return [{ type: 'error', text: `Error changing directory: ${error.message}` }];
        }
        
      case 'pwd':
        return [{ type: 'output', text: currentDirectory }];
        
      case 'cat':
        if (!webContainer || !args[0]) {
          return [{ type: 'error', text: 'Usage: cat <filename>' }];
        }
        
        try {
          let filePath = args[0];
          if (!filePath.startsWith('/')) {
            filePath = `${currentDirectory === '/' ? '' : currentDirectory}/${filePath}`;
          }
          
          const content = await webContainer.fs.readFile(filePath, 'utf-8');
          return [{ type: 'output', text: content }];
        } catch (error) {
          return [{ type: 'error', text: `Error reading file: ${error.message}` }];
        }
        
      case 'mkdir':
        if (!webContainer || !args[0]) {
          return [{ type: 'error', text: 'Usage: mkdir <directory>' }];
        }
        
        try {
          let dirPath = args[0];
          if (!dirPath.startsWith('/')) {
            dirPath = `${currentDirectory === '/' ? '' : currentDirectory}/${dirPath}`;
          }
          
          await webContainer.fs.mkdir(dirPath, { recursive: true });
          
          // Sync changes back to file explorer
          await syncChangesToFileExplorer();
          
          return [{ type: 'system', text: `Directory created: ${dirPath}` }];
        } catch (error) {
          return [{ type: 'error', text: `Error creating directory: ${error.message}` }];
        }
        
      case 'touch':
        if (!webContainer || !args[0]) {
          return [{ type: 'error', text: 'Usage: touch <filename>' }];
        }
        
        try {
          let filePath = args[0];
          if (!filePath.startsWith('/')) {
            filePath = `${currentDirectory === '/' ? '' : currentDirectory}/${filePath}`;
          }
          
          await webContainer.fs.writeFile(filePath, '');
          
          // Sync changes back to file explorer
          await syncChangesToFileExplorer();
          
          return [{ type: 'system', text: `File created: ${filePath}` }];
        } catch (error) {
          return [{ type: 'error', text: `Error creating file: ${error.message}` }];
        }
        
      case 'echo':
        if (!webContainer || args.length < 2 || !cmd.includes('>')) {
          return [{ type: 'error', text: 'Usage: echo "text" > filename' }];
        }
        
        try {
          const cmdStr = cmd.trim();
          const textMatch = cmdStr.match(/"([^"]*)"/);
          const text = textMatch ? textMatch[1] : args.slice(0, args.indexOf('>')).join(' ');
          
          const outputIndex = cmdStr.indexOf('>');
          const filePath = cmdStr.substring(outputIndex + 1).trim();
          
          let fullPath = filePath;
          if (!fullPath.startsWith('/')) {
            fullPath = `${currentDirectory === '/' ? '' : currentDirectory}/${fullPath}`;
          }
          
          await webContainer.fs.writeFile(fullPath, text);
          
          // Sync changes back to file explorer
          await syncChangesToFileExplorer();
          
          return [{ type: 'system', text: `Text written to ${fullPath}` }];
        } catch (error) {
          return [{ type: 'error', text: `Error writing to file: ${error.message}` }];
        }
        
      case 'rm':
        if (!webContainer || !args[0]) {
          return [{ type: 'error', text: 'Usage: rm <filename>' }];
        }
        
        try {
          let filePath = args[0];
          if (!filePath.startsWith('/')) {
            filePath = `${currentDirectory === '/' ? '' : currentDirectory}/${filePath}`;
          }
          
          await webContainer.fs.rm(filePath, { recursive: args.includes('-r') || args.includes('-rf') });
          
          // Sync changes back to file explorer
          await syncChangesToFileExplorer();
          
          return [{ type: 'system', text: `Removed: ${filePath}` }];
        } catch (error) {
          return [{ type: 'error', text: `Error removing file: ${error.message}` }];
        }
        
      default:
        return null; // Not a built-in command, let WebContainer handle it
    }
  };

  // Run command in webcontainer
  const runCommand = async (cmd) => {
    if (!cmd.trim() || isProcessing) return;
    
    setIsProcessing(true);
    
    // Add command to output
    setOutput(prev => [...prev, { type: 'command', text: cmd }]);
    
    try {
      // First check if it's a built-in command
      const builtInResult = await handleBuiltInCommands(cmd);
      
      if (builtInResult) {
        // It was a built-in command, add its output
        setOutput(prev => [...prev, ...builtInResult]);
      } else if (webContainer) {
        // Not a built-in command, run it in WebContainer
        const parts = cmd.trim().split(/\s+/);
        const command = parts[0];
        const args = parts.slice(1);
        
        // Execute command in webcontainer
        const process = await webContainer.spawn(command, args, {
          cwd: currentDirectory
        });
        currentCommand.current = process;
        
        // Process command output
        const outputStream = new WritableStream({
          write(chunk) {
            setOutput(prev => [...prev, { type: 'output', text: chunk }]);
          }
        });
        
        process.output.pipeTo(outputStream);
        
        // Wait for command to finish
        const exitCode = await process.exit;
        setOutput(prev => [...prev, { 
          type: 'system', 
          text: `Process exited with code ${exitCode}` 
        }]);
      } else {
        setOutput(prev => [...prev, { 
          type: 'error', 
          text: 'WebContainer not initialized. Some commands may not work.' 
        }]);
      }
    } catch (error) {
      setOutput(prev => [...prev, { 
        type: 'error', 
        text: `Error: ${error.message || 'Failed to execute command'}` 
      }]);
    } finally {
      setIsProcessing(false);
      currentCommand.current = null;
    }
    
    setInput("");
  };
  
  // Handle keyboard shortcuts
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      runCommand(input);
    } else if (e.key === 'c' && e.ctrlKey) {
      // Ctrl+C to cancel current command
      if (currentCommand.current) {
        currentCommand.current.kill();
        setOutput(prev => [...prev, { type: 'system', text: 'Command terminated' }]);
        setIsProcessing(false);
        currentCommand.current = null;
      }
    }
  };
  
  // Add this function to sync changes back to the file explorer
  const syncChangesToFileExplorer = async () => {
    if (!webContainer) return;
    
    try {
      // Get all files recursively from the WebContainer
      const files = await listFilesRecursively('/');
      
      // Create a new file tree object
      const newFileTree = {};
      
      // Add each file to the file tree
      for (const file of files) {
        if (file.isDirectory) continue; // Skip directories
        
        try {
          const contents = await webContainer.fs.readFile(file.path, 'utf-8');
          newFileTree[file.path.startsWith('/') ? file.path.substring(1) : file.path] = {
            file: {
              contents
            }
          };
        } catch (error) {
          console.error(`Error reading file ${file.path}:`, error);
        }
      }
      
      // Update the file tree in the parent component
      onFileTreeChange(newFileTree);
    } catch (error) {
      console.error('Error syncing changes to file explorer:', error);
    }
  };

  // Helper function to list all files recursively
  const listFilesRecursively = async (dir) => {
    const results = [];
    
    try {
      const entries = await webContainer.fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const path = `${dir === '/' ? '' : dir}/${entry.name}`;
        
        if (entry.isDirectory()) {
          results.push({ path, isDirectory: true });
          const subEntries = await listFilesRecursively(path);
          results.push(...subEntries);
        } else {
          results.push({ path, isDirectory: false });
        }
      }
    } catch (error) {
      console.error(`Error listing files in ${dir}:`, error);
    }
    
    return results;
  };

  return (
    <div className="terminal-container">
      <div className="terminal-header">
        <span className="terminal-title">Terminal</span>
        <span className="terminal-cwd">{currentDirectory}</span>
      </div>
      <div className="terminal-output" ref={outputRef}>
        {output.map((line, index) => (
          <div key={index} className={`terminal-line terminal-${line.type}`}>
            {line.type === 'command' && <span className="terminal-prompt">$ </span>}
            {line.text}
          </div>
        ))}
      </div>
      <div className="terminal-input-container">
        <span className="terminal-prompt">$</span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="terminal-input"
          placeholder={isProcessing ? "Command running..." : `${currentDirectory}>`}
          disabled={isProcessing}
        />
      </div>
    </div>
  );
};

const Project = () => {
    const location = useLocation()
    const { user } = useContext(UserContext)
    const messageBox = React.createRef()
    const fileInputRef = useRef(null) // Add file input reference for uploads

  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState(new Set())
  const [project, setProject] = useState(location.state.project)
  const [message, setMessage] = useState("")
  const [users, setUsers] = useState([])
  const [messages, setMessages] = useState([])
  const [fileTree, setFileTree] = useState({})
  const [currentFile, setCurrentFile] = useState(null)
  const [openFiles, setOpenFiles] = useState([])
  const [webContainer, setWebContainer] = useState(null)
  const [iframeUrl, setIframeUrl] = useState(null)
  const [runProcess, setRunProcess] = useState(null)
  const [activeTab, setActiveTab] = useState("files")
  const [isLoading, setIsLoading] = useState(true)
  
  // Add state for context menu
  const [contextMenu, setContextMenu] = useState({
    show: false,
    x: 0,
    y: 0,
    file: null,
  })
  
  // Add state for panel sizes
  const [sidebarWidth, setSidebarWidth] = useState(300)
  const [fileExplorerHeight, setFileExplorerHeight] = useState(300)
  const [previewWidth, setPreviewWidth] = useState(null)
  const [showTerminal, setShowTerminal] = useState(false);
  const [terminalHeight, setTerminalHeight] = useState(200);

  // Add toast notification state
  const [showToast, setShowToast] = useState(true);

  // Add WebContainer loading state
  const [webContainerStatus, setWebContainerStatus] = useState("initializing"); // "initializing", "ready", "error", "unsupported"

  // Add WebContainer error toast state
  const [showWebContainerErrorToast, setShowWebContainerErrorToast] = useState(false);

  // Add state to track if WebContainer is supported in this environment
  const [isWebContainerAvailable, setIsWebContainerAvailable] = useState(true);

  // Handle resize for different panels
  const handleResize = (direction, deltaX, deltaY) => {
    switch (direction) {
      case 'right':
        setSidebarWidth(prevWidth => {
          const newWidth = prevWidth + deltaX;
          return Math.max(150, Math.min(window.innerWidth / 2, newWidth));
        });
        break;
      case 'bottom':
        setFileExplorerHeight(prevHeight => {
          const newHeight = prevHeight + deltaY;
          return Math.max(100, Math.min(window.innerHeight - 200, newHeight));
        });
        break;
      case 'left':
        if (iframeUrl && webContainer) {
          setPreviewWidth(prevWidth => {
            const newWidth = (prevWidth || document.querySelector('.preview-pane')?.offsetWidth || 0) - deltaX;
            return Math.max(200, newWidth);
          });
        }
        break;
      default:
        break;
    }
  };

  // Handle right click on file explorer
  const handleRightClick = (e, file = null) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      show: true,
      x: e.pageX,
      y: e.pageY,
      file
    });
  };

  // Handle click outside context menu to close it
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (contextMenu.show && !e.target.closest('.context-menu')) {
        setContextMenu(prev => ({ ...prev, show: false }));
      }
    };
    
    const handleEscape = (e) => {
      if (contextMenu.show && e.key === 'Escape') {
        setContextMenu(prev => ({ ...prev, show: false }));
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [contextMenu.show]);

  // Create new file in the file tree
  const createNewFile = () => {
    const fileName = prompt("Enter file name (with extension):");
    if (!fileName) return;
    
    const newFileTree = { ...fileTree };
    newFileTree[fileName] = { 
      file: { 
        contents: "" 
      } 
    };
    
    setFileTree(newFileTree);
    saveFileTree(newFileTree);
    setContextMenu({ ...contextMenu, show: false });
  };

  // Create new folder in the file tree
  const createNewFolder = () => {
    const folderName = prompt("Enter folder name:");
    if (!folderName) return;
    
    // For simplicity, we're just creating an empty file with a folder marker
    // A more complex implementation would handle nested folder structures
    const newFileTree = { ...fileTree };
    newFileTree[`${folderName}/.folder`] = { 
      file: { 
        contents: "", 
        isFolder: true 
      } 
    };
    
    setFileTree(newFileTree);
    saveFileTree(newFileTree);
    setContextMenu({ ...contextMenu, show: false });
  };

  // Upload file from local machine
  const uploadFile = () => {
    fileInputRef.current.click();
    setContextMenu({ ...contextMenu, show: false });
  };

  // Handle file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = () => {
      const newFileTree = { ...fileTree };
      newFileTree[file.name] = { 
        file: { 
          contents: reader.result 
        } 
      };
      
      setFileTree(newFileTree);
      saveFileTree(newFileTree);
    };
    reader.readAsText(file);
  };

  // Delete file from file tree
  const deleteFile = (fileName) => {
    if (!fileName) return;
    
    if (confirm(`Are you sure you want to delete ${fileName}?`)) {
      const newFileTree = { ...fileTree };
      delete newFileTree[fileName];
      
      setFileTree(newFileTree);
      saveFileTree(newFileTree);
      
      // If the deleted file is open, close it
      if (currentFile === fileName) {
        setCurrentFile(null);
      }
      setOpenFiles(openFiles.filter(file => file !== fileName));
    }
    
    setContextMenu({ ...contextMenu, show: false });
  };

  // Download file function
  const downloadFile = (fileName) => {
    if (!fileName || !fileTree[fileName]) return;
    
    try {
      const fileContent = fileTree[fileName].file.contents;
      
      // Create a blob with the file content
      const blob = new Blob([fileContent], { type: 'text/plain' });
      
      // Create a URL for the blob
      const url = URL.createObjectURL(blob);
      
      // Create a temporary link element
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = fileName;
      
      // Add to document, click it, then remove
      document.body.appendChild(a);
      a.click();
      
      // Small timeout before cleanup
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        console.log(`Downloaded file: ${fileName}`);
      }, 100);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert(`Failed to download ${fileName}: ${error.message}`);
    }
    
    setContextMenu(prev => ({ ...prev, show: false }));
  };

  const handleUserClick = (id) => {
    setSelectedUserId((prevSelectedUserId) => {
      const newSelectedUserId = new Set(prevSelectedUserId)
      if (newSelectedUserId.has(id)) {
        newSelectedUserId.delete(id)
      } else {
        newSelectedUserId.add(id)
      }
      return newSelectedUserId
    })
  }

    function addCollaborators() {
    axios
      .put("/projects/add-user", {
            projectId: location.state.project._id,
        users: Array.from(selectedUserId),
      })
      .then((res) => {
            setIsModalOpen(false)
      })
      .catch((err) => {
            console.log(err)
        })
    }

    const send = () => {
    sendMessage("project-message", {
            message,
      sender: user,
        })
    setMessages((prevMessages) => [...prevMessages, { sender: user, message }])
        setMessage("")
    }

    function WriteAiMessage(message) {
    try {
        const messageObject = JSON.parse(message)
        return (
        <div className="ai-message">
                <Markdown
                    children={messageObject.text}
                    options={{
                        overrides: {
                            code: SyntaxHighlightedCode,
                        },
                    }}
                />
        </div>
      )
    } catch (e) {
      return <div className="error-message">Error parsing message</div>
    }
    }

    useEffect(() => {
        initializeSocket(project._id)

        // Check if WebContainer is supported in this environment
        const checkAndInitializeWebContainer = async () => {
            const supported = isWebContainerSupported();
            setIsWebContainerAvailable(supported);
            
            if (!supported) {
                setWebContainerStatus("unsupported");
                setShowWebContainerErrorToast(true);
                console.warn("WebContainer is not supported in this environment");
                return;
            }
            
            // If supported, try to initialize
            if (!webContainer) {
                console.log("Initializing WebContainer...");
                setWebContainerStatus("initializing");
                
                try {
                    const container = await getWebContainer();
                    
                    if (container) {
                        setWebContainer(container);
                        setWebContainerStatus("ready");
                        console.log("WebContainer successfully started");
                    } else {
                        // getWebContainer might return null if initialization failed
                        setWebContainerStatus("error");
                        setShowWebContainerErrorToast(true);
                    }
                } catch (error) {
                    console.error("Failed to initialize WebContainer:", error);
                    setWebContainerStatus("error");
                    setShowWebContainerErrorToast(true);
                }
            }
        };
        
        checkAndInitializeWebContainer();

    receiveMessage("project-message", (data) => {
      if (data.sender._id == "ai") {
        try {
                const message = JSON.parse(data.message)
                webContainer?.mount(message.fileTree)
                if (message.fileTree) {
                    setFileTree(message.fileTree || {})
                }
        } catch (e) {
          console.error("Error parsing AI message", e)
        }
        setMessages((prevMessages) => [...prevMessages, data])
            } else {
        setMessages((prevMessages) => [...prevMessages, data])
      }
    })

    axios.get(`/projects/get-project/${location.state.project._id}`).then((res) => {
            setProject(res.data.project)
            setFileTree(res.data.project.fileTree || {})
      setIsLoading(false)
        })

    axios
      .get("/users/all")
      .then((res) => {
            setUsers(res.data.users)
      })
      .catch((err) => {
            console.log(err)
        })
    }, [])

    function saveFileTree(ft) {
    axios
      .put("/projects/update-file-tree", {
            projectId: project._id,
        fileTree: ft,
      })
      .then((res) => {
            console.log(res.data)
      })
      .catch((err) => {
            console.log(err)
        })
    }

  if (isLoading) {
    return <div className="loading-screen">Loading...</div>
  }

  // Add this function to handle animation classes for the collaborator sidebar
  const getCollaboratorSidebarClasses = () => {
    let classes = "collaborator-sidebar resizable"
    if (isSidePanelOpen) {
      classes += " open"
    }
    return classes
    }

    // Toggle terminal visibility
    const toggleTerminal = () => {
      setShowTerminal(!showTerminal);
    };
    
    // Handle terminal resize
    const handleTerminalResize = (direction, deltaX, deltaY) => {
      if (direction === 'top') {
        setTerminalHeight(prev => {
          const newHeight = prev - deltaY;
          return Math.max(100, Math.min(window.innerHeight / 2, newHeight));
        });
      }
    };

    // Update retry function
    const retryWebContainerInit = () => {
      if (!isWebContainerAvailable) {
        alert("WebContainer is not supported in this environment. You need a browser with cross-origin isolation and SharedArrayBuffer support.");
        return;
      }
      
      console.log("Retrying WebContainer initialization...");
      setWebContainerStatus("initializing");
      setShowWebContainerErrorToast(false);
      
      // Reset any existing instance 
      setWebContainer(null);
      
      // Try initializing again
      getWebContainer()
        .then((container) => {
          if (container) {
            setWebContainer(container);
            setWebContainerStatus("ready");
            console.log("WebContainer successfully restarted");
          } else {
            setWebContainerStatus("error");
            setShowWebContainerErrorToast(true);
          }
        })
        .catch((error) => {
          console.error("Retry failed to initialize WebContainer:", error);
          setWebContainerStatus("error");
          setShowWebContainerErrorToast(true);
        });
    };

    // Add this function to the Project component to handle file tree updates from the terminal
    const handleFileTreeChangeFromTerminal = (newFileTree) => {
      // Merge the new file tree with the existing one
      const updatedFileTree = { ...fileTree };
      
      // Add or update files from the terminal
      Object.keys(newFileTree).forEach(path => {
        updatedFileTree[path] = newFileTree[path];
      });
      
      // Update the file tree state
      setFileTree(updatedFileTree);
      
      // Save the updated file tree
      saveFileTree(updatedFileTree);
    };

    return (
    <div className="editor-container">
      {/* Regular toast notification */}
      {showToast && (
        <div className="toast-notification">
          <div className="toast-content">
            <span className="toast-icon">👉</span>
            <span className="toast-message">Right-click on files or folders for more options (including download)</span>
            <button className="toast-close" onClick={() => setShowToast(false)}>×</button>
          </div>
        </div>
      )}
      
      {/* WebContainer error toast - update to handle unsupported state */}
      {showWebContainerErrorToast && (
        <div className="toast-notification toast-error">
          <div className="toast-content">
            <span className="toast-icon">⚠️</span>
            <span className="toast-message">
              {webContainerStatus === "unsupported" 
                ? "WebContainer is not supported in this browser/environment. Running projects requires a modern browser with cross-origin isolation enabled." 
                : "WebContainer failed to initialize. Some features like running the project may not work. Click the retry button next to the Run button to try again."}
            </span>
            <button className="toast-close" onClick={() => setShowWebContainerErrorToast(false)}>×</button>
          </div>
        </div>
      )}
      
      {/* SIDEBAR */}
      <div className="sidebar resizable" style={{ width: `${sidebarWidth}px` }}>
        {/* HEADER */}
        <div className="sidebar-header">
          <div className="project-title">{project.name || "Project"}</div>
          <div className="header-actions">
            <button onClick={() => setIsModalOpen(true)} className="icon-button" aria-label="Add collaborators">
              👥
            </button>
            <button
              onClick={() => setIsSidePanelOpen(!isSidePanelOpen)}
              className="icon-button"
              aria-label="Show collaborators"
            >
              👤
                    </button>
          </div>
        </div>

        {/* FILE EXPLORER */}
        <div 
          className="file-explorer resizable" 
          style={{ height: `${fileExplorerHeight}px` }}
          onContextMenu={(e) => handleRightClick(e)} // Add right-click event to the file explorer
        >
          <div className="section-title">
            Project Files
            <div className="file-actions">
              <button 
                className="file-action-button" 
                title="New File"
                onClick={createNewFile}
              >
                <span>+</span>
              </button>
              <button 
                className="file-action-button" 
                title="Upload File"
                onClick={uploadFile}
              >
                <span>↑</span>
              </button>
            </div>
          </div>
          <div className="file-list">
            {Object.keys(fileTree).map((file, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentFile(file)
                  setOpenFiles([...new Set([...openFiles, file])])
                }}
                onContextMenu={(e) => handleRightClick(e, file)} // Add right-click to file items
                className={`file-item ${currentFile === file ? "active" : ""}`}
              >
                <span className="file-icon">
                  {fileTree[file]?.file?.isFolder ? '📁' : '📄'}
                </span>
                <span className="file-name">{file}</span>
                    </button>
            ))}
          </div>
          <ResizeHandle direction="bottom" onResize={handleResize} />
        </div>

        {/* File Context Menu - updated with smaller icons and download option */}
        {contextMenu.show && (
          <div 
            className="context-menu" 
            style={{ top: contextMenu.y, left: contextMenu.x }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Debug info - remove this in production */}
            <div className="context-menu-item context-menu-debug">
              {contextMenu.file ? `File: ${contextMenu.file}` : 'No file selected'}
            </div>
            <div className="context-menu-divider"></div>
            
            {/* Common options for all context menus */}
            <div className="context-menu-item" onClick={createNewFile}>
              <span className="context-menu-icon">+</span>New File
            </div>
            <div className="context-menu-item" onClick={createNewFolder}>
              <span className="context-menu-icon">📁</span>New Folder
            </div>
            <div className="context-menu-item" onClick={uploadFile}>
              <span className="context-menu-icon">↑</span>Upload File
            </div>
            
            {/* Show these options only when right-clicking on a file */}
            {contextMenu.file && (
              <>
                <div className="context-menu-divider"></div>
                {!fileTree[contextMenu.file]?.file?.isFolder && (
                  <>
                    <div className="context-menu-item" onClick={() => {
                      // Open the file if it's not already open
                      if (!openFiles.includes(contextMenu.file)) {
                        setCurrentFile(contextMenu.file);
                        setOpenFiles([...new Set([...openFiles, contextMenu.file])]);
                      }
                      setContextMenu(prev => ({ ...prev, show: false }));
                    }}>
                      <span className="context-menu-icon">📄</span>Open
                    </div>
                    <div className="context-menu-item" onClick={() => downloadFile(contextMenu.file)}>
                      <span className="context-menu-icon">↓</span>Download
                    </div>
                    <div className="context-menu-item" onClick={() => {
                      // Create a duplicate with "_copy" appended
                      const fileName = contextMenu.file;
                      const fileExt = fileName.includes('.') ? fileName.split('.').pop() : '';
                      const baseName = fileName.includes('.') ? fileName.substring(0, fileName.lastIndexOf('.')) : fileName;
                      const newFileName = `${baseName}_copy${fileExt ? '.' + fileExt : ''}`;
                      
                      const newFileTree = { ...fileTree };
                      newFileTree[newFileName] = { 
                        file: { 
                          contents: fileTree[contextMenu.file].file.contents 
                        } 
                      };
                      
                      setFileTree(newFileTree);
                      saveFileTree(newFileTree);
                      setContextMenu(prev => ({ ...prev, show: false }));
                    }}>
                      <span className="context-menu-icon">📋</span>Duplicate
                    </div>
                  </>
                )}
                
                <div className="context-menu-item" onClick={() => {
                  if (fileTree[contextMenu.file]?.file?.isFolder) {
                    const folderName = contextMenu.file.split('/')[0];
                    const newName = prompt("Rename folder:", folderName);
                    if (newName && newName !== folderName) {
                      const newFileTree = { ...fileTree };
                      
                      // Find all files in this folder and rename them
                      Object.keys(fileTree).forEach(file => {
                        if (file.startsWith(`${folderName}/`)) {
                          const newPath = file.replace(`${folderName}/`, `${newName}/`);
                          newFileTree[newPath] = newFileTree[file];
                          delete newFileTree[file];
                        }
                      });
                      
                      // Rename the folder marker file
                      newFileTree[`${newName}/.folder`] = newFileTree[contextMenu.file];
                      delete newFileTree[contextMenu.file];
                      
                      setFileTree(newFileTree);
                      saveFileTree(newFileTree);
                    }
                  } else {
                    const newName = prompt("Rename file:", contextMenu.file);
                    if (newName && newName !== contextMenu.file) {
                      const newFileTree = { ...fileTree };
                      newFileTree[newName] = newFileTree[contextMenu.file];
                      delete newFileTree[contextMenu.file];
                      
                      setFileTree(newFileTree);
                      saveFileTree(newFileTree);
                      
                      // Update open files and current file if needed
                      if (currentFile === contextMenu.file) {
                        setCurrentFile(newName);
                      }
                      setOpenFiles(openFiles.map(file => file === contextMenu.file ? newName : file));
                    }
                  }
                  setContextMenu(prev => ({ ...prev, show: false }));
                }}>
                  <span className="context-menu-icon">✏️</span>Rename
                </div>
                
                <div className="context-menu-divider"></div>
                
                <div className="context-menu-item context-menu-item-danger" onClick={() => {
                  if (fileTree[contextMenu.file]?.file?.isFolder) {
                    const folderName = contextMenu.file.split('/')[0];
                    if (confirm(`Are you sure you want to delete the folder "${folderName}" and all its contents?`)) {
                      const newFileTree = { ...fileTree };
                      
                      // Delete all files in this folder
                      Object.keys(fileTree).forEach(file => {
                        if (file === contextMenu.file || file.startsWith(`${folderName}/`)) {
                          delete newFileTree[file];
                          
                          // Remove from open files if needed
                          if (currentFile === file) {
                            setCurrentFile(null);
                          }
                          setOpenFiles(openFiles.filter(f => f !== file));
                        }
                      });
                      
                      setFileTree(newFileTree);
                      saveFileTree(newFileTree);
                    }
                  } else {
                    deleteFile(contextMenu.file);
                  }
                  setContextMenu(prev => ({ ...prev, show: false }));
                }}>
                  <span className="context-menu-icon">🗑️</span>
                  {fileTree[contextMenu.file]?.file?.isFolder ? 'Delete Folder' : 'Delete'}
                </div>
              </>
            )}
          </div>
        )}

        {/* Hidden File Input for Uploads */}
        <input 
          type="file" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          onChange={handleFileUpload}
        />

        {/* CHAT */}
        <div className="chat-container resizable" style={{ height: `calc(100% - ${fileExplorerHeight}px - var(--sidebar-header-height))` }}>
          <div className="section-title">Chat</div>
          <div ref={messageBox} className="messages-container">
                        {messages.map((msg, index) => (
              <div
                key={index}
                className={`message ${msg.sender._id === user._id.toString() ? "own-message" : ""} ${msg.sender._id === "ai" ? "ai-message-container" : ""}`}
              >
                <small className="sender-email">{msg.sender.email}</small>
                <div className="message-content">
                  {msg.sender._id === "ai" ? (
                                        WriteAiMessage(msg.message)
                  ) : (
                    <p className="message-text">{msg.message}</p>
                  )}
                                </div>
                            </div>
                        ))}
                    </div>

          <div className="message-input-container">
                        <input
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              className="message-input"
              type="text"
              placeholder="Enter message"
            />
            <button onClick={send} className="send-button">
              Send
                        </button>
                    </div>
                </div>
        <ResizeHandle direction="right" onResize={handleResize} />
                    </div>

      {/* MAIN CONTENT */}
      <div className="main-content resizable">
        {/* TABS BAR */}
        <div className="tabs-bar">
          <div className="tabs-container">
            {openFiles.map((file, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setCurrentFile(file)}
                className={`tab ${currentFile === file ? "active-tab" : ""}`}
              >
                <span className="tab-icon">📄</span>
                <span className="tab-name">{file}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setOpenFiles(openFiles.filter((f) => f !== file))
                    if (currentFile === file) {
                      setCurrentFile(openFiles.length > 1 ? openFiles.filter((f) => f !== file)[0] : null)
                    }
                  }}
                  className="close-tab"
                >
                  ✕
                </button>
                                    </button>
            ))}
                        </div>

          <div className="run-container">
            <button
              onClick={toggleTerminal}
              className="terminal-toggle-button"
              title={showTerminal ? "Hide Terminal" : "Show Terminal"}
            >
              <span className="terminal-icon">$_</span>
            </button>
            
            {/* Update WebContainer status indicator to handle unsupported state */}
            <div className="webcontainer-status-indicator">
              {webContainerStatus === "initializing" && (
                <span className="status-icon loading" title="WebContainer is initializing...">⟳</span>
              )}
              {webContainerStatus === "ready" && (
                <span className="status-icon ready" title="WebContainer is ready">✓</span>
              )}
              {webContainerStatus === "error" && (
                <button 
                  className="retry-button" 
                  title="Retry WebContainer initialization"
                  onClick={retryWebContainerInit}
                >
                  <span className="status-icon error">⟲</span>
                </button>
              )}
              {webContainerStatus === "unsupported" && (
                <span className="status-icon unsupported" title="WebContainer is not supported in this environment">✕</span>
              )}
            </div>
            
                            <button
                                onClick={async () => {
                if (!webContainer) {
                    console.error("WebContainer is not initialized yet")
                    alert("WebContainer is not ready. Please wait a moment and try again.")
                    return
                }

                try {
                    console.log("Mounting file tree to WebContainer...")
                                    await webContainer.mount(fileTree)

                    console.log("Installing npm packages...")
                    const installProcess = await webContainer.spawn("npm", ["install"])
                    installProcess.output.pipeTo(
                      new WritableStream({
                                        write(chunk) {
                                            console.log(chunk)
                        },
                      }),
                    )

                                    if (runProcess) {
                        console.log("Killing previous process...")
                                        runProcess.kill()
                                    }

                    console.log("Starting npm script...")
                    const tempRunProcess = await webContainer.spawn("npm", ["start"])
                    tempRunProcess.output.pipeTo(
                      new WritableStream({
                                        write(chunk) {
                                            console.log(chunk)
                        },
                      }),
                    )

                                    setRunProcess(tempRunProcess)

                    webContainer.on("server-ready", (port, url) => {
                        console.log("Server ready on:", port, url)
                                        setIframeUrl(url)
                                    })
                } catch (error) {
                    console.error("Error running project:", error)
                    alert(`Error running project: ${error.message}`)
                }
                                }}
              className={`run-button ${webContainerStatus !== "ready" ? "disabled" : ""}`}
              disabled={webContainerStatus !== "ready"}
                            >
              <span className="run-icon">▶</span>
              Run
                            </button>
                        </div>
                    </div>

        {/* EDITOR & PREVIEW */}
        <div className={`editor-preview-container ${showTerminal ? 'with-terminal' : ''}`}>
          <div className="editor-pane resizable">
            {fileTree[currentFile] ? (
              <div className="code-editor">
                <pre className="code-container">
                                        <code
                                            contentEditable
                                            suppressContentEditableWarning
                                            onBlur={(e) => {
                      const updatedContent = e.target.innerText
                                                const ft = {
                                                    ...fileTree,
                        [currentFile]: {
                                                        file: {
                            contents: updatedContent,
                          },
                        },
                                                }
                                                setFileTree(ft)
                                                saveFileTree(ft)
                                            }}
                    dangerouslySetInnerHTML={{
                      __html: hljs.highlight("javascript", fileTree[currentFile].file.contents).value,
                    }}
                    className="code-content"
                                        />
                                    </pre>
                                </div>
            ) : (
              <div className="empty-editor">
                <div className="empty-editor-content">
                  <div className="empty-editor-icon">📄</div>
                  <p className="empty-editor-text">Select a file to edit</p>
                </div>
              </div>
            )}
            {iframeUrl && webContainer && <ResizeHandle direction="right" onResize={handleResize} />}
          </div>

          {iframeUrl && webContainer && (
            <div className="preview-pane resizable" style={previewWidth ? { width: `${previewWidth}px` } : {}}>
              <div className="preview-header">
                <span className="preview-icon">🌐</span>
                <input
                  type="text"
                  onChange={(e) => setIframeUrl(e.target.value)}
                  value={iframeUrl}
                  className="url-input"
                />
              </div>
              <iframe src={iframeUrl} className="preview-iframe" />
              <ResizeHandle direction="left" onResize={handleResize} />
            </div>
          )}
        </div>

        {/* TERMINAL */}
        {showTerminal && (
          <div className="terminal-wrapper" style={{ height: `${terminalHeight}px` }}>
            <ResizeHandle direction="top" onResize={handleTerminalResize} />
            <Terminal 
              webContainer={webContainer} 
              fileTree={fileTree} 
              onFileTreeChange={handleFileTreeChangeFromTerminal} 
            />
          </div>
        )}
                    </div>

      {/* COLLABORATOR SIDEBAR */}
      {isSidePanelOpen && (
        <div className={getCollaboratorSidebarClasses()}>
          <div className="collaborator-header">
            <h1 className="collaborator-title">Collaborators</h1>
            <button onClick={() => setIsSidePanelOpen(false)} className="close-sidebar">
              ✕
            </button>
          </div>
          <div className="collaborator-list">
            {project.users &&
              project.users.map((user, idx) => (
                <div key={idx} className="collaborator-item">
                  <div className="collaborator-avatar">{user.email[0].toUpperCase()}</div>
                  <h1 className="collaborator-email">{user.email}</h1>
                </div>
              ))}
          </div>
          <ResizeHandle direction="left" onResize={handleResize} />
                        </div>
      )}

      {/* MODAL */}
            {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container">
            <header className="modal-header">
              <h2 className="modal-title">Add Collaborators</h2>
              <button onClick={() => setIsModalOpen(false)} className="close-modal">
                ✕
                            </button>
                        </header>
            <div className="modal-content">
              {users.map((user) => (
                <div
                  key={user._id}
                  onClick={() => handleUserClick(user._id)}
                  className={`user-item ${Array.from(selectedUserId).indexOf(user._id) !== -1 ? "selected" : ""}`}
                >
                  <div className="user-avatar">{user.email[0].toUpperCase()}</div>
                  <h1 className="user-email">{user.email}</h1>
                  {Array.from(selectedUserId).indexOf(user._id) !== -1 && <span className="selected-icon">✓</span>}
                                </div>
                            ))}
                        </div>
            <button onClick={addCollaborators} className="add-button">
              <span className="add-icon">👤</span>
                            Add Collaborators
                        </button>
                    </div>
                </div>
            )}
    </div>
    )
}

export default Project

