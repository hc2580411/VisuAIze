# Contributing to VisuAize

Thank you for your interest in contributing to VisuAize! This document provides guidelines and instructions for contributing.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Development Setup
```bash
# Clone the repository
git clone <repository-url>
cd hxc313/VisuAize

# Install dependencies
npm install

# Start development server
npm run dev
```

## 📁 Project Structure

```
VisuAize/
├── src/
│   ├── components/          # React components
│   │   ├── algorithms/      # Algorithm step generators
│   │   ├── Visualizer/      # D3.js visualizer components
│   │   ├── hooks/           # Custom React hooks
│   │   └── utils/           # Helper utilities
│   ├── utils/               # App-level utilities (logger, storage)
│   ├── App.jsx              # Main application component
│   ├── App.css              # Global styles
│   └── constants.js         # App-wide constants
├── public/                  # Static assets
└── index.html               # HTML entry point
```

## 🧪 Code Quality

### Linting
```bash
# Run ESLint
npm run lint
```

### Building
```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## 📝 Code Style Guidelines

### General
- Use ES6+ features
- Prefer functional components with hooks
- Use meaningful variable/function names
- Add JSDoc comments for complex functions

### React Components
- Use `memo()` for components that receive stable props
- Use `useCallback` and `useMemo` for performance optimization
- Keep components focused and reusable

### CSS
- Use CSS custom properties (variables) from `App.css`
- Follow the glassmorphism design system
- Support both light and dark themes

### Algorithms
- Each algorithm should export a function that returns an array of steps
- Include `codeLine` for code highlighting
- Include `variables` object for variable watcher
- Add `pauseBeforeClear: true` on final step

## 🔧 Adding New Features

### Adding a New Algorithm
1. Create a new file in `src/components/algorithms/<dataType>/`
2. Export a function that takes data and returns steps array
3. Register in `src/components/hooks/useAlgorithmSteps.js`
4. Add to `ALGORITHM_OPTIONS` in `src/constants.js`
5. Add code string to `src/components/utils/algorithmCode.js`

### Adding a New Data Structure
1. Create visualizer in `src/components/Visualizer/`
2. Add algorithm files in `src/components/algorithms/<new-type>/`
3. Update `VISUALIZER_COMPONENTS` in `App.jsx`
4. Update `constants.js` with defaults and options

## 📊 Commit Guidelines

Use conventional commits:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Code style (formatting, etc.)
- `refactor:` Code refactoring
- `perf:` Performance improvement
- `test:` Adding tests

## 🐛 Reporting Issues

When reporting issues, please include:
1. Steps to reproduce
2. Expected behavior
3. Actual behavior
4. Browser and OS information
5. Screenshots if applicable

## 📄 License

This is an academic project for the University of Birmingham.
