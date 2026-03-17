import { useState, useEffect, useRef, useCallback, lazy, Suspense, useMemo } from "react";
import useAlgorithmSteps from "./components/hooks/useAlgorithmSteps";

// Hooks
import useAnimationController from "./components/hooks/useAnimationController";
import useKeyboardShortcuts from "./components/hooks/useKeyboardShortcuts";

// Lazy-loaded Visualizers for better initial load performance
const ArrayVisualizer = lazy(() => import("./components/Visualizer/ArrayVisualizer.jsx"));
const LinkedListVisualizer = lazy(() => import("./components/Visualizer/LinkedListVisualizer.jsx"));
const TreeVisualizer = lazy(() => import("./components/Visualizer/TreeVisualizer.jsx"));
const StackVisualizer = lazy(() => import("./components/Visualizer/StackVisualizer.jsx"));
const QueueVisualizer = lazy(() => import("./components/Visualizer/QueueVisualizer.jsx"));
const HeapVisualizer = lazy(() => import("./components/Visualizer/HeapVisualizer.jsx"));

// Lazy load heavier components
const CodePanel = lazy(() => import("./components/CodePanel.jsx"));
const ExecutionLog = lazy(() => import("./components/ExecutionLog.jsx"));
const AIAssistant = lazy(() => import("./components/AIAssistant.jsx"));

// Regular imports for lightweight, always-needed components
import Sidebar from "./components/Sidebar.jsx";
import PlaybackControls from "./components/PlaybackControls.jsx";
import FloatingSettings from "./components/FloatingSettings.jsx";
import Toast from "./components/Toast.jsx";
import OnboardingTour from "./components/OnboardingTour.jsx";
import "./components/OnboardingTour.css";

import { ALGORITHM_CODES } from "./components/utils/algorithmCode.js";
import { createList, createBinaryTree } from "./components/utils/helpers.js";
import { MODES, SPEED_PRESETS, DEFAULT_ALGORITHMS, DEFAULT_VALUES, ERROR_MESSAGES, BACKGROUND_THEMES } from "./constants.js";
import { getStorageItem, setStorageItem, STORAGE_KEYS } from "./utils/storage.js";
import { analyzeCode, validateCodeSafety } from "./services/aiCodeAnalyzer.js";

import "./App.css";

// Loading fallback component for Suspense
const VisualizerLoading = () => (
  <div className="loading-shimmer" style={{
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '300px',
    borderRadius: 'var(--radius-lg)'
  }}>
    <span style={{ color: 'var(--text-muted)' }}>Loading visualization...</span>
  </div>
);

const CodePanelLoading = () => (
  <div className="loading-shimmer" style={{
    width: '100%',
    height: '200px',
    borderRadius: 'var(--radius-lg)'
  }} />
);

// Visualizer Components Map (using lazy-loaded components)
const VISUALIZER_COMPONENTS = {
  array: ArrayVisualizer,
  linkedlist: LinkedListVisualizer,
  tree: TreeVisualizer,
  stack: StackVisualizer,
  queue: QueueVisualizer,
  heap: HeapVisualizer,
};

// Configuration for resetting data structures - memoized outside component
const DATA_TYPE_RESETTERS = {
  array: () => ({}), // Array data is generated from input
  linkedlist: (setters) => setters.setCurrentListHead(createList(DEFAULT_VALUES.linkedlist)),
  tree: (setters) => setters.setCurrentTreeRoot(createBinaryTree([50, 30, 70])), // Default tree 50, 30, 70
  stack: (setters) => setters.setCurrentStack([...DEFAULT_VALUES.stack]),
  queue: (setters) => setters.setCurrentQueue([...DEFAULT_VALUES.queue]),
  heap: (setters) => setters.setCurrentHeap([...DEFAULT_VALUES.heap]),
};

export default function App() {
  const [dataType, setDataType] = useState("array");
  const [algo, setAlgo] = useState("bubble");
  // Initialize input to null so we use defaults initially, but allow "" to mean empty
  const [input, setInput] = useState(null);
  // committedInput is what's actually used for algorithm step generation
  // It only updates when the user explicitly starts an animation
  const [committedInput, setCommittedInput] = useState(null);
  // Search target for search algorithms (separate from main input)
  const [searchTarget, setSearchTarget] = useState("");
  const [committedSearchTarget, setCommittedSearchTarget] = useState("");
  // cachedSteps stores the steps from when Play was clicked, so state updates don't affect scrubbing
  const [cachedSteps, setCachedSteps] = useState([]);
  const [speed, setSpeed] = useState(SPEED_PRESETS.MEDIUM);

  // Custom Code Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [customCode, setCustomCode] = useState(null);

  // Code Modifications State (for Advanced mode editing)
  const [codeModifications, setCodeModifications] = useState(null);

  // Play trigger — incremented on every Play press to force useAlgorithmSteps
  // to recompute even when all other deps are unchanged (e.g. repeat dequeue/pop,
  // or inserting the same value twice).
  const [playTrigger, setPlayTrigger] = useState(0);

  // Toast State
  const [toasts, setToasts] = useState([]);

  // Mode State - persisted to localStorage
  const [mode, setMode] = useState(() => {
    const savedMode = getStorageItem(STORAGE_KEYS.MODE);
    return Object.values(MODES).includes(savedMode) ? savedMode : MODES.BEGINNER;
  });

  // Theme State - persisted to localStorage
  const [theme, setTheme] = useState(() => {
    const savedTheme = getStorageItem(STORAGE_KEYS.THEME);
    if (savedTheme === 'dark' || savedTheme === 'light') return savedTheme;
    return 'light';
  });

  // Background Choice State - persisted to localStorage
  const [backgroundId, setBackgroundId] = useState(() => {
    return getStorageItem(STORAGE_KEYS.BACKGROUND, 'slate');
  });

  // Animations Enabled State - persisted to localStorage
  const [animationsEnabled, setAnimationsEnabled] = useState(() => {
    return getStorageItem(STORAGE_KEYS.ANIMATIONS_ENABLED, true);
  });

  // Onboarding Tour State — only show if never completed
  const [showTour, setShowTour] = useState(() => {
    return !getStorageItem(STORAGE_KEYS.TOUR_COMPLETED, false);
  });

  // Toggle Theme with persistence
  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const newTheme = prev === "light" ? "dark" : "light";
      setStorageItem(STORAGE_KEYS.THEME, newTheme);
      return newTheme;
    });
  }, []);

  // Toggle Animations with persistence
  const toggleAnimations = useCallback(() => {
    setAnimationsEnabled(prev => {
      const newValue = !prev;
      setStorageItem(STORAGE_KEYS.ANIMATIONS_ENABLED, newValue);
      return newValue;
    });
  }, []);

  // Persist mode changes
  useEffect(() => {
    setStorageItem(STORAGE_KEYS.MODE, mode);
  }, [mode]);

  // Apply theme to document body
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Apply background gradient
  useEffect(() => {
    const bg = BACKGROUND_THEMES.find(b => b.id === backgroundId) || BACKGROUND_THEMES[0];
    const gradient = theme === 'dark' ? bg.dark : bg.light;
    document.documentElement.style.setProperty('--bg-gradient', gradient);
    setStorageItem(STORAGE_KEYS.BACKGROUND, backgroundId);
  }, [backgroundId, theme]);

  // Apply animations toggle
  useEffect(() => {
    if (animationsEnabled) {
      document.documentElement.classList.remove('animations-disabled');
    } else {
      document.documentElement.classList.add('animations-disabled');
    }
  }, [animationsEnabled]);

  // Shared State
  const [currentTreeRoot, setCurrentTreeRoot] = useState(null);

  // Initialize with default list immediately
  const [currentListHead, setCurrentListHead] = useState(() => createList(DEFAULT_VALUES.linkedlist));

  // Initialize stack with default values
  const [currentStack, setCurrentStack] = useState(() => [...DEFAULT_VALUES.stack]);

  // Initialize queue with default values
  const [currentQueue, setCurrentQueue] = useState(() => [...DEFAULT_VALUES.queue]);

  // Initialize heap with default max-heap values
  const [currentHeap, setCurrentHeap] = useState(() => [...DEFAULT_VALUES.heap]);

  // Toast Helper - memoized for performance
  const toastIdCounter = useRef(0);
  const addToast = useCallback((message, type = 'info') => {
    const id = ++toastIdCounter.current;
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Handle Custom Code Analysis
  const analyzeTimeoutRef = useRef(null);
  const handleAnalyzeCode = useCallback((code) => {
    // Clear any pending analysis
    if (analyzeTimeoutRef.current) {
      clearTimeout(analyzeTimeoutRef.current);
    }

    setIsAnalyzing(true);
    setAnalysisResult(null);

    // Brief delay to ensure loading state renders before synchronous analysis
    analyzeTimeoutRef.current = setTimeout(() => {
      analyzeTimeoutRef.current = null;

      // First, validate code safety
      const safetyResult = validateCodeSafety(code);
      if (!safetyResult.safe) {
        setAnalysisResult({
          success: false,
          error: safetyResult.error
        });
        addToast(safetyResult.error, 'error');
        setIsAnalyzing(false);
        return;
      }

      // Then, analyze the code to detect data type
      const result = analyzeCode(code);
      setAnalysisResult(result);

      if (result.success) {
        // Store the custom code
        setCustomCode(code);

        // Switch to the detected data type if different
        if (result.detectedType && result.detectedType !== dataType) {
          setDataType(result.detectedType);
          addToast(`Switched to ${result.detectedType} visualization`, 'info');
        }

        addToast(result.message, 'success');
      } else {
        addToast(result.error, 'warning');
      }

      setIsAnalyzing(false);
    }, 100);
  }, [dataType, addToast]);

  // Clear analysis result when algo or dataType changes
  useEffect(() => {
    setAnalysisResult(null);
    setCustomCode(null);
    setCodeModifications(null); // Clear code modifications
  }, [algo, dataType]);

  // Handle code modifications from CodePanel editor
  const handleCodeModified = useCallback((modifiedCode, modifications) => {
    setCodeModifications(modifications);
  }, []);

  // Handle running with modified code
  const handleRunModified = useCallback((modifications) => {
    if (modifications) {
      setCodeModifications(modifications);
      addToast(`Running with modifications: ${Object.entries(modifications).map(([k, v]) => `${k}=${v}`).join(', ')}`, 'info');

      // Clear cache and trigger new step generation
      setCachedSteps([]);
      pendingCacheUpdate.current = true;
      shouldAutoPlayAfterSteps.current = true;

      // Commit the current input to trigger regeneration with new modifications
      setCommittedInput(input ? input.trim() : "");
      setCommittedSearchTarget(searchTarget.trim());
    }
  }, [input, searchTarget, addToast]);

  // Reset input/algo and data when dataType changes
  useEffect(() => {
    // Reset to defaults
    setInput(null);
    setCommittedInput(null);
    setSearchTarget("");
    setCommittedSearchTarget("");

    // Set default algorithm for the data type
    const defaultAlgo = DEFAULT_ALGORITHMS[dataType];
    if (defaultAlgo) {
      setAlgo(defaultAlgo);
    }

    // Reset data structure to defaults using the configuration object
    const resetFn = DATA_TYPE_RESETTERS[dataType];
    if (resetFn) {
      resetFn({
        setCurrentListHead,
        setCurrentTreeRoot,
        setCurrentStack,
        setCurrentQueue,
        setCurrentHeap,
      });
    }
  }, [dataType]);



  const { steps: liveSteps, error: validationError } = useAlgorithmSteps({
    dataType,
    algo,
    input: committedInput, // Use committed input for step generation
    searchTarget: committedSearchTarget, // Use committed search target
    currentTreeRoot,
    currentListHead,
    currentStack,
    currentQueue,
    currentHeap,
    codeModifications,
    playTrigger,
  });

  // Use cached steps if available, otherwise use live steps - memoized
  const steps = useMemo(() =>
    cachedSteps.length > 0 ? cachedSteps : liveSteps,
    [cachedSteps, liveSteps]
  );

  // Sync validation error with Toasts
  useEffect(() => {
    if (validationError) {
      addToast(validationError, 'error');
    }
  }, [validationError, addToast]);

  const controller = useAnimationController(steps, speed, algo);

  // Keyboard Shortcuts
  useKeyboardShortcuts({
    togglePlay: () => controller.isPlaying ? controller.pause() : controller.play(),
    nextStep: controller.next,
    prevStep: controller.prev,
    reset: () => {
      controller.goTo(0);
      addToast("Animation Reset", 'info');
    }
  });

  // Use a ref to track if we've already updated state for this animation
  const hasPerformedUpdate = useRef(false);
  const updateTimeoutRef = useRef(null);
  const pendingCacheUpdate = useRef(false);

  // Auto-update State on Animation Completion
  useEffect(() => {
    // Clear any pending timeouts
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
      updateTimeoutRef.current = null;
    }

    if (!controller.isPlaying && controller.index === steps.length - 1 && steps.length > 1) {
      const lastStep = steps[steps.length - 1];

      // We only perform updates for steps that have action: 'complete'
      if (lastStep.action !== 'complete') {
        return;
      }

      // Prevent duplicate updates — hasPerformedUpdate is reset only in handlePlay()
      // so it's immune to steps reference changes caused by setCachedSteps([]) below.
      if (hasPerformedUpdate.current) {
        return;
      }
      hasPerformedUpdate.current = true;

      const performUpdate = () => {
        // Define read-only algorithms that shouldn't clear cache/inputs
        const isReadOnly = ['search', 'bstSearch', 'inorder', 'preorder', 'postorder', 'linearSearch', 'binarySearch'].includes(algo);

        // Common cleanup after a data structure update
        const clearInputs = () => {
          setInput("");
          setCommittedInput("");
          // setCachedSteps([]) removed so the user can inspect the final visual step
        };

        // Tree Update
        if (dataType === "tree" && lastStep.root !== undefined && !isReadOnly) {
          setCurrentTreeRoot(lastStep.root);
          clearInputs();

          if (lastStep.message === "Value already exists, please try another value") {
            addToast(lastStep.message, 'warning');
          } else {
            addToast("Tree updated successfully", 'success');
          }
        }

        // Linked List Update
        if (dataType === "linkedlist" && lastStep.nodes && !isReadOnly) {
          setCurrentListHead(createList(lastStep.nodes));
          clearInputs();
          addToast("List updated successfully", 'success');
        }

        // Stack Update
        if (dataType === "stack" && lastStep.stack !== undefined) {
          setCurrentStack(lastStep.stack);
          clearInputs();
          addToast("Stack updated successfully", 'success');
        }

        // Queue Update
        if (dataType === "queue" && lastStep.queue !== undefined) {
          setCurrentQueue(lastStep.queue);
          clearInputs();
          addToast("Queue updated successfully", 'success');
        }

        // Heap Update
        if (dataType === "heap" && lastStep.heap !== undefined) {
          setCurrentHeap(lastStep.heap);
          clearInputs();
          addToast("Heap updated successfully", 'success');
        }
      };

      performUpdate();
    }

    // Cleanup
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
        updateTimeoutRef.current = null;
      }
    };
  }, [controller.isPlaying, controller.index, steps, dataType, committedInput, addToast, algo]);

  // Reset the processed index and cached steps when algo or dataType changes
  useEffect(() => {
    hasPerformedUpdate.current = false;
    setCachedSteps([]); // Clear cache when algorithm or data type changes
  }, [algo, dataType]);

  // Ref to track if we should auto-play after steps are regenerated
  const shouldAutoPlayAfterSteps = useRef(false);

  // Effect to cache steps when they're regenerated after Play is clicked
  // and automatically start playback
  useEffect(() => {
    if (shouldAutoPlayAfterSteps.current && liveSteps.length > 0) {
      shouldAutoPlayAfterSteps.current = false;
      setCachedSteps([...liveSteps]);
      setTimeout(() => {
        controller.goTo(0);
        controller.play();
      }, 10);
    }
  }, [liveSteps, controller]);

  // Callback to commit input and signal that steps should be cached
  const handlePlay = useCallback(() => {
    // Reset controller state immediately
    controller.goTo(0);
    controller.pause();

    // Check if this is a search algorithm requiring dual input
    const isSearchAlgorithm =
      (dataType === "array" && (algo === "linearSearch" || algo === "binarySearch")) ||
      (dataType === "linkedlist" && algo === "search") ||
      (dataType === "tree" && algo === "bstSearch");

    // Check if input is required for the current algorithm
    const isInputNotRequired =
      (dataType === "array" && !isSearchAlgorithm) || // Sorting algorithms don't use the input field for execution
      (dataType === "linkedlist" && algo === "search") || // Search uses searchTarget, not input
      (dataType === "tree" && (algo === "bstSearch" || algo === "inorder" || algo === "preorder" || algo === "postorder")) || // BST Search and traversals
      (dataType === "stack" && algo === "pop") ||
      (dataType === "queue" && algo === "dequeue") ||
      (dataType === "heap" && algo === "extractMax");

    // For search algorithms, validate both inputs
    if (isSearchAlgorithm) {
      if (!searchTarget || !searchTarget.trim()) {
        addToast("Please enter a search target value", 'warning');
        return;
      }
      if (isNaN(parseInt(searchTarget))) {
        addToast("Search target must be a number", 'warning');
        return;
      }
    }

    if (!isInputNotRequired && (!input || !input.trim())) {
      addToast(ERROR_MESSAGES.EMPTY_INPUT, 'warning');
      return;
    }

    // Clear cache and increment trigger so useAlgorithmSteps recomputes
    setCachedSteps([]);
    setPlayTrigger(t => t + 1);

    // Reset the update guard so the next completion triggers a state update
    hasPerformedUpdate.current = false;

    // Signal that we should auto-play after the next liveSteps update
    // (needed because setPlayTrigger causes an async re-render)
    shouldAutoPlayAfterSteps.current = true;

    // Commit the input and search target to trigger step generation
    setCommittedInput(input ? input.trim() : "");
    setCommittedSearchTarget(searchTarget ? searchTarget.toString().trim() : "");
  }, [input, searchTarget, dataType, algo, addToast, controller]);

  // Clear Animation Handler
  const handleClear = useCallback(() => {
    // 1. Reset Controller
    controller.goTo(0);
    controller.pause();

    // 2. Clear Steps Cache
    setCachedSteps([]);

    // 3. Always reset input fields
    setInput("");
    setCommittedInput("");
    setSearchTarget("");
    setCommittedSearchTarget("");

    // 4. Clear Data based on Type
    if (dataType === 'array') {
      // input already cleared above
    } else if (dataType === 'linkedlist') {
      setCurrentListHead(null);
    } else if (dataType === 'tree') {
      setCurrentTreeRoot(null);
    } else if (dataType === 'stack') {
      setCurrentStack([]);
    } else if (dataType === 'queue') {
      setCurrentQueue([]);
    } else if (dataType === 'heap') {
      setCurrentHeap([]);
    }

    addToast("Animation Cleared", 'info');
  }, [dataType, controller, addToast]);

  // Interaction Handler for visualizers (Drag & Drop, Manual Edit)
  const handleUpdateData = useCallback((newData) => {
    setCachedSteps([]); // Clear cached steps to force recalculation from new data

    if (dataType === 'linkedlist') {
      setCurrentListHead(createList(newData));
    } else if (dataType === 'array') {
      const inputStr = Array.isArray(newData) ? newData.join(', ') : newData;
      setInput(inputStr);
      setCommittedInput(inputStr);
    } else if (dataType === 'stack') {
      setCurrentStack([...newData]);
    } else if (dataType === 'queue') {
      setCurrentQueue([...newData]);
    } else if (dataType === 'heap') {
      setCurrentHeap([...newData]);
    } else if (dataType === 'tree') {
      if (newData && newData.__isTreeRoot) {
        // Tree root passed directly from drag-swap (already has correct structure)
        delete newData.__isTreeRoot;
        setCurrentTreeRoot(newData);
      } else {
        // Flat array from edit — rebuild as BST
        setCurrentTreeRoot(createBinaryTree(newData));
      }
    }
    // Note: no manual controller.reset() needed here — useAnimationController
    // automatically resets to step 0 whenever the `steps` array reference changes,
    // which happens naturally when useAlgorithmSteps recomputes after a data update.
  }, [dataType]);

  // Memoize the visualizer component selection
  const Visualizer = useMemo(() => VISUALIZER_COMPONENTS[dataType], [dataType]);

  // Memoize the current code for CodePanel
  const currentCode = useMemo(() =>
    customCode || ALGORITHM_CODES[dataType]?.[algo] || "",
    [customCode, dataType, algo]
  );

  // Memoize the main class name
  const mainClassName = useMemo(() =>
    `main ${mode === MODES.BEGINNER ? 'beginner-mode' : ''}`,
    [mode]
  );

  // Compute data size for complexity chart
  const dataSize = useMemo(() => {
    switch (dataType) {
      case 'array': {
        const arrayData = committedInput?.split(',').filter(s => s.trim()) || DEFAULT_VALUES.array;
        return Array.isArray(arrayData) ? arrayData.length : DEFAULT_VALUES.array.length;
      }
      case 'linkedlist': {
        let count = 0;
        let node = currentListHead;
        while (node) { count++; node = node.next; }
        return count || DEFAULT_VALUES.linkedlist.length;
      }
      case 'stack':
        return currentStack?.length || DEFAULT_VALUES.stack.length;
      case 'queue':
        return currentQueue?.length || DEFAULT_VALUES.queue.length;
      case 'heap':
        return currentHeap?.length || DEFAULT_VALUES.heap.length;
      case 'tree': {
        // Count tree nodes
        const countNodes = (node) => node ? 1 + countNodes(node.left) + countNodes(node.right) : 0;
        return countNodes(currentTreeRoot) || 3;
      }
      default:
        return 5;
    }
  }, [dataType, committedInput, currentListHead, currentStack, currentQueue, currentHeap, currentTreeRoot]);

  return (
    <div className="page">
      {/* Skip link for keyboard users */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <div className="layout">
        <Sidebar
          dataType={dataType}
          setDataType={setDataType}
          mode={mode}
          setMode={setMode}
          algo={algo}
          setAlgo={setAlgo}
          input={input || ""}
          setInput={setInput}
          searchTarget={searchTarget}
          setSearchTarget={setSearchTarget}
          speed={speed}
          setSpeed={setSpeed}
          controller={controller}
          steps={steps}
          dataSize={dataSize}
          theme={theme}
          backgroundId={backgroundId}
        />

        <main id="main-content" className={mainClassName}>
          <div className="vis-container">
            <button className="clear-anim-btn" onClick={handleClear} aria-label="Clear Animation">
              Clear
            </button>
            <div className="vis-inner">
              <Suspense fallback={<VisualizerLoading />}>
                <Visualizer
                  step={controller.step}
                  speed={speed}
                  onUpdateData={handleUpdateData}
                  isPlaying={controller.isPlaying}
                  animationsEnabled={animationsEnabled}
                />
              </Suspense>
            </div>
          </div>

          {mode !== MODES.BEGINNER && (
            <div className="code-panel-container">
              <Suspense fallback={<CodePanelLoading />}>
                <CodePanel
                  code={currentCode}
                  currentLine={controller.step?.codeLine}
                  mode={mode}
                  algo={algo}
                  dataType={dataType}
                  addToast={addToast}
                  onCodeModified={handleCodeModified}
                  onRunModified={handleRunModified}
                  isAnalyzing={isAnalyzing}
                  analysisResult={analysisResult}
                />
              </Suspense>
              {/* Add Execution Log in Advanced Mode */}
              {mode === MODES.ADVANCED && (
                <Suspense fallback={<CodePanelLoading />}>
                  <ExecutionLog
                    steps={steps}
                    currentStepIndex={controller.index}
                  />
                </Suspense>
              )}
            </div>
          )}

          <PlaybackControls
            controller={controller}
            steps={steps}
            mode={mode}
            onPlay={handlePlay}
          />
        </main>
      </div>

      <div className="toast-container">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            {...toast}
            onClose={removeToast}
          />
        ))}
      </div>

      <FloatingSettings
        theme={theme}
        toggleTheme={toggleTheme}
        backgroundId={backgroundId}
        setBackgroundId={setBackgroundId}
        onVisualizeCode={handleAnalyzeCode}
        animationsEnabled={animationsEnabled}
        toggleAnimations={toggleAnimations}
      />

      {showTour && (
        <OnboardingTour onComplete={() => setShowTour(false)} />
      )}
    </div>
  );
}
