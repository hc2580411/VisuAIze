# VisuAize: A Comprehensive Project Report & Repository

<div align="center">
  <h3>An interactive, modern algorithm visualization tool powered by React, D3.js, and Google Gemini AI.</h3>
</div>

---

## 1. Executive Summary

VisuAize is an advanced educational platform designed to bridge the gap between theoretical computer science concepts and practical understanding. By providing visually engaging, step-by-step animations of complex data structures and algorithms, coupled with an integrated AI tutor, VisuAize offers a modern, interactive learning environment. 

This document serves as both the repository's starting point and a comprehensive report detailing the architecture, implementation semantics, and optimizations that constitute the core of the project.

---

## 2. Core Architecture & System Design

The project employs a decoupled client-server architecture, prioritizing separation of concerns, fast rendering, and secure API management.

### 2.1 The Frontend (Client-side)
- **Framework:** React 19 (via Vite 7)
- **State Management:** Custom React Hooks (`useAnimationController`) managing centralized state and step playback.
- **Visualization:** D3.js 7 used strictly for SVG mathematical calculations, scales, and transition interpolations, while React manages the broader DOM lifecycle and state orchestration.
- **Styling:** Vanilla CSS with scoped Variables, utilizing a modern "Flat UI" minimalist design system optimized for cognitive clarity.

### 2.2 The Backend (Server-side)
- **Runtime:** Node.js with Express.js
- **Database:** SQLite3 embedded database for lightweight, rapid, local deployment without external dependencies.
- **Authentication:** JSON Web Tokens (JWT) for stateless session management, with `bcrypt` for secure server-side password hashing.
- **AI Gateway:** A secure proxy masking the Google Gemini SDK, preventing client-side exposure of private API keys and handling payload sanitization.

---

## 3. Implementation Methodologies: The Core Innovations

### 3.1 The Algorithmic Engine (ES6 Generators)
One of the most complex challenges in building a visualizer is pausing a highly recursive or tight-looped algorithm (like Merge Sort) precisely in the middle of execution to render a visual frame. 

**Solution:** VisuAize utilizes JavaScript ES6 Generator Functions (`function*`). Instead of running an algorithm to completion instantly, the algorithm `yields` a snapshot of its localized state at every critical juncture (compare, swap, insert).

```javascript
// Example: Core Engine Logic extracted from Bubble Sort
export function* bubbleSort(array) {
    let arr = [...array];
    for (let i = 0; i < arr.length; i++) {
        for (let j = 0; j < arr.length - i - 1; j++) {
            // Yield a 'comparison' state frame
            yield { array: [...arr], compare: [j, j + 1], isSorted: false };
            
            if (arr[j] > arr[j + 1]) {
                [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
                // Yield a 'swap' state frame
                yield { array: [...arr], swap: [j, j + 1], isSorted: false };
            }
        }
    }
    yield { array: arr, isSorted: true };
}
```
This architectural decision completely decouples the *mathematical logic* from the *visual rendering track*, allowing users to scrub forward and backward through an algorithm's history freely via the playback slider.

### 3.2 The Visualization Engine (React meets D3)
Traditionally, D3.js and React clash because both demand absolute control over the DOM. VisuAize elegantly resolves this through a hybrid approach:
- **React** mounts an empty `<svg>` tag and provides the `ref`.
- **D3.js** takes over inside a `useEffect` hook, utilizing its powerful Data Join (`.join(enter, update, exit)`) mechanics to actively animate additions, transmutations, and deletions of SVG nodes.
- Heavy SVGs (like `TreeVisualizer` and `HeapVisualizer`) are wrapped in `React.memo()`. This ensures D3 only recalculates SVG repaints when the algorithmic `step` data physically mutates, entirely bypassing React's virtual DOM reconciliation for minor UI updates (e.g., toggling a sidebar menu).

### 3.3 Artificial Intelligence Integration
VisuAize moves beyond static tutorials by embedding an LLM architecture directly into the workflow.
1. **Contextual Awareness:** The frontend packages the current algorithmic state, the user's active data structure, and the dynamically generated code pane, sending it to the backend.
2. **Prompt Engineering:** The backend injects system prompts strictly limiting the AI to act as a Socratic tutor, refusing to "just give the answer" but rather guiding the student via hints (implemented via the official `@google/genai` API).

---

## 4. Performance, Security, & Quality Assurance

To ensure VisuAize is robust enough for academic and production deployment, several critical optimizations were implemented.

### 4.1 Security & Rate Limiting
The Express server utilizes `express-rate-limit` middleware at the `/api/` routing layer. By restricting users to 20 requests per minute via IP tracking, the system protects the backend from brute-force authentication attacks, DDoS vectors, and stops malicious users from draining the Google Gemini LLM API quotas.

```javascript
const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute window
    limit: 20, 
    message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', apiLimiter);
```

### 4.2 Automated Unit Testing
Visualizers can often mask underlying logical errors with pretty animations. To prevent this, VisuAize implements a Headless Test Suite using **Vitest**. The raw algorithmic generators are executed in a Node environment, asserting their mathematical correctness entirely isolated from the UI layer.

```bash
# Running the test suite guarantees logical integrity of algorithms
npm run test
```

### 4.3 Accessibility (a11y)
Educational tools demand high accessibility standards. VisuAize implements WAI-ARIA standards throughout the core UI:
- The `ExecutionLog` utilizes an `aria-live="polite"` region mapping to a `role="log"`. When an algorithm evaluates two nodes, screen readers dynamically dictate the action to visually impaired users automatically.
- All non-text UI elements (Play, Skip, Reset) feature descriptive `aria-label` tags and logical keyboard tabbing indexes.

---

## 5. Supported Data Structures & Complexities

| Data Structure | Operations / Algorithms | Time Complexity | Space Complexity |
|---------------|---------------------------|----------------|------------------|
| **Array** | Bubble, Insertion, Selection | O(n²) | O(1) |
| **Array** | Merge Sort | O(n log n) | O(n) |
| **Array** | Binary Search | O(log n) | O(1) |
| **Linked List** | Insert, Delete | O(1) or O(n) | O(1) |
| **BST** | Insert, Delete, Search | O(log n) | O(log n) |
| **Stack / Queue**| Push, Pop, Enqueue, Dequeue | O(1) | O(1) |
| **Heap** | Insert, Extract Max | O(log n) | O(1) |

---

## 6. Project Directory Map

```text
VisuAize/
├── server/
│   ├── server.cjs          # Express app, auth routes, AI proxy, Rate liming
│   └── database.sqlite     # Real-time SQLite User/Conversation datastore
├── src/
│   ├── components/
│   │   ├── algorithms/     # Pure JS Generators for math/logic
│   │   ├── Visualizer/     # D3.js + React SVG rendering engines
│   │   ├── auth/           # Login/Signup routing & JWT handling
│   │   └── hooks/          # Custom hooks (animation loop, shortcuts)
│   ├── App.jsx             # Main Router and State Orchestrator
│   └── main.jsx            # React 19 Entry Point
├── tests/
│   └── bubbleSort.test.js  # Vitest Automated Logic Suite
└── package.json
```

## 7. Execution Instructions

1. **Clone & Install Dependencies**
   ```bash
   git clone https://git.cs.bham.ac.uk/projects-2025-26/hxc313.git
   cd hxc313/VisuAize
   npm install
   ```
2. **Environment Configuration**
   Create a `.env` file in the root directory containing necessary secrets:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   JWT_SECRET=secure_jwt_signing_key
   PORT=3001
   CORS_ORIGIN=http://localhost:5173
   ```
3. **Launch the Full-Stack Application**
   ```bash
   npm run dev
   ```
   *The backend initializes synchronously on `http://localhost:3001` with the frontend Vite proxy running on `http://localhost:5173`.*

---
*Authored and developed collaboratively by HC for the University of Birmingham (Academic Year 2025-26). Project Code: hxc313.*
