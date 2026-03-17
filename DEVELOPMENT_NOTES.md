# Development Notes & Change History

This file tracks all development updates and changes made to the VisuAize project throughout its development lifecycle.

---

## Update 1: Project Setup
**Date**: Early Development  
Decided to use React for frontend, rearranged file structure. Seeking for alternative plan for frontend, backend stack not decided (Advices from ChatGPT)

## Update 2: Backend Focus
**Date**: After supervisor meeting  
After meeting with supervisor, decided to leave frontend for now, focus on backend codes and try to implement a basic algorithm in this week

## Update 3: Frontend Simplification
**Date**: Mid Development  
Decided to remove react completely for my frontend, focusing on building fundamentals of backend algorithms, implemented a BS with a stepper that user can pause on crucial steps when the algorithm is running.

## Update 4: Binary Search Optimization
**Date**: Continued Development  
Optimized the BS algorithm.

## Update 5: Quick Sort Addition
**Date**: Continued Development  
Added a Quick Sort algorithm with stepper, decided to categorise algorithms by their data types

## Update 6: Sorting Algorithm Optimization
**Date**: Continued Development  
Optimized Bubble Sort and QuickSort algorithms

## Update 7: Linked List Operations
**Date**: Continued Development  
Added insertion and deletion on Linkedlist with stepper

## Update 8: Architecture Research
**Date**: Mid Development  
Gone through a few articles on Google Scholar about Algorithm visualisers, found that the most difficult task is to synchronise algorithms along with the animation, ensure that the animation is smooth and responsive to user interactions. Moreover, most people used third party graphing libraries to visualise algorithms, which may not be suitable for my case as i am going to make my own animations. Need to start thinking of what are the datatypes i'm gonna provide and how to make some actions (highlight element, change of user input during animation, control of animation speed ... ) work etc. Maybe i can make modular animations (lines connecting linked list nodes may also be used for connecting nodes in a tree)

**Extensions Ideas**: 
1. Code space to allow user to update any language of algorithm codes and convert to my animations. 
2. Calculate Time & Space Complexities in real time.

## Update 9: Modular Design Decision
**Date**: Continued Development  
For the frontend animation, instead of executing the same code for square or other shapes, it might be easier if i use some vector images to replace it, so it would be modular and easier to maintain.

## Update 10: D3.js Integration Plan
**Date**: Pre-Frontend Implementation  
Try to implement the frontend for Bubble sort before the next meeting with professor. After researches decided to use D3.js for animation.

## Update 11: Backend Elimination
**Date**: Major Architecture Change  
Tried to use D3.js to implement Bubble sort and found that backend in this case is not even needed, will try to build the visualiser without Python for now

## Update 12: First D3 Implementation
**Date**: Continued Development  
Implemented Bubble Sort algorithm with D3.js

## Update 13: Polish & Controls
**Date**: Continued Development  
Fixed few minor bugs in the visualiser, added a control of the animation speed.

## Update 14: React Migration
**Date**: Major Refactor  
Decided to remove all frontend files that were made with D3.js, focus on building the visualiser with React.

## Update 15: React + D3 Hybrid
·**Date**: Continued Development  

## Update 19: Array Stability
**Date**: Continued Development  
Fixed more bugs on Array related algorithms.

## Update 20: Array Completion
**Date**: Continued Development  
More fixes on Array, now Array related algorithms works for all cases.

## Update 21: Linked List Scrolling
**Date**: Continued Development  
Added a horizontal scroll bar for linked list algorithms.

## Update 22: Array Polish
**Date**: Continued Development  
Fixed all problems with Array and minor bug fixes.

## Update 23: Style Updates
**Date**: Continued Development  
Updated art styles and fixed linked list algorithms.

## Update 24: BST Implementation
**Date**: Continued Development  
Fixed some more minor issues and BST algorithms.

## Update 25: Branding
**Date**: Continued Development  
Changed name of the tab and updated logo icon (AI generated).

## Update 26: Full Functionality
**Date**: Continued Development  
Fixed all logic issues with all data types, now all algorithms works fine.

## Update 27: Major Visual Overhaul
**Date**: November 24, 2025  
Updated and synchronised art styles for all algorithms. Let AI tool improved my file strucutre (constants.js)

## Update 28:
minor bugs fixes

## Update 29: Code Highlight Sync
**Date**: November 25, 2025  
Fixed some bugs about code highlight synchronisation, need to work more on it.

## Update 30: Animation Sync & Input Validation
**Date**: January 26, 2026  
Standardized all data structure animations with consistent timing and `d3.easeCubicOut` easing. Implemented a unified input validation system that prevents execution on empty/invalid inputs and provides feedback via Toast notifications. Enhanced UI visibility in Light Mode by improving text contrast and connection line visibility. Updated all README files to match the current system architecture.

## Update 31: Production Readiness & Code Quality
**Date**: January 27, 2026  
Major improvements for application maturity and maintainability:

**Code Quality:**
- Fixed all ESLint errors (5 unused variable warnings)
- Added comprehensive JSDoc documentation to hooks
- Added centralized logger utility (`src/utils/logger.js`)
- Added local storage utility for persistent preferences (`src/utils/storage.js`)

**User Experience:**
- Implemented persistent user preferences (theme, mode saved to localStorage)
- Added system preference detection for dark/light mode
- Enhanced accessibility with ARIA labels on playback controls
- Added screen reader support for progress slider

**SEO & Production:**
- Fixed HTML structure (added missing `<head>` tag)
- Added Open Graph and Twitter Card meta tags for social sharing
- Added author meta tag
- Created environment variables example (`.env.example`)

**Documentation:**
- Created comprehensive `CONTRIBUTING.md` guide
- Added code style guidelines and project structure documentation

## Update 32: Search Algorithms with Dual Input
**Date**: January 27, 2026  
Added Linear Search and Binary Search algorithms with dual input support:

**New Algorithms:**
- `linearSearch`: O(n) sequential search through array elements
- `binarySearch`: O(log n) divide-and-conquer search (auto-sorts array)

**UI Changes:**
- Added dual input fields for search algorithms:
  - **Array Data**: The array to search through
  - **Search Target**: The value to find
- Updated Shuffle button to generate both array AND search target
- Conditional rendering shows search target field only for search algorithms

**Files Modified:**
- `src/components/algorithms/array/linearSearch.js` (new)
- `src/components/algorithms/array/binarySearch.js` (new)
- `src/components/hooks/useAlgorithmSteps.js`
- `src/components/Sidebar.jsx`
- `src/App.jsx`
- `src/constants.js`
- `src/components/utils/algorithmCode.js`
