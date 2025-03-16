import { WebContainer } from '@webcontainer/api';

let webContainerInstance = null;
let bootPromise = null;
let webContainerSupported = null; // null = unknown, true/false after check

// Check if the environment supports WebContainer
const checkWebContainerSupport = () => {
  try {
    // Check for required browser features
    if (typeof window === 'undefined') return false;
    if (typeof SharedArrayBuffer === 'undefined') return false;
    
    // Check for cross-origin isolation (needed for SharedArrayBuffer)
    if (!window.crossOriginIsolated) {
      console.warn('Cross-Origin-Isolation is not enabled. WebContainer requires this to be enabled.');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error checking WebContainer support:', error);
    return false;
  }
};

export const getWebContainer = async () => {
    // First check - if we have an instance, return it
    if (webContainerInstance !== null) {
        return webContainerInstance;
    }
    
    // Check if WebContainer is supported if we haven't checked yet
    if (webContainerSupported === null) {
        webContainerSupported = checkWebContainerSupport();
    }
    
    // If WebContainer is not supported, return null immediately
    if (!webContainerSupported) {
        console.warn('WebContainer is not supported in this environment');
        return null;
    }
    
    // If we're already booting, return the existing promise
    if (bootPromise !== null) {
        return bootPromise;
    }
    
    try {
        // Create a boot promise with timeout
        const timeoutMs = 15000; // 15 seconds timeout
        
        const bootWithTimeout = new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('WebContainer boot timed out'));
            }, timeoutMs);
            
            WebContainer.boot()
                .then(instance => {
                    clearTimeout(timeout);
                    resolve(instance);
                })
                .catch(error => {
                    clearTimeout(timeout);
                    reject(error);
                });
        });
        
        bootPromise = bootWithTimeout;
        
        // Wait for the WebContainer to boot
        console.log("Booting WebContainer...");
        webContainerInstance = await bootPromise;
        console.log("WebContainer boot complete");
        
        // Set up cleanup
        window.addEventListener('beforeunload', () => {
            if (webContainerInstance) {
                console.log("Cleaning up WebContainer before page unload");
                // Any cleanup needed
            }
        });
        
        return webContainerInstance;
    } catch (error) {
        // Reset the bootPromise so a new attempt can be made if needed
        bootPromise = null;
        console.error("WebContainer boot failed:", error);
        
        // If it's a fundamental compatibility issue, mark as unsupported
        if (error.message && (
            error.message.includes('SharedArrayBuffer') || 
            error.message.includes('cross-origin-isolated') ||
            error.message.includes('security policy')
        )) {
            webContainerSupported = false;
        }
        
        return null;
    }
};

// Public function to check if WebContainer is supported
export const isWebContainerSupported = () => {
    if (webContainerSupported === null) {
        webContainerSupported = checkWebContainerSupport();
    }
    return webContainerSupported;
};
