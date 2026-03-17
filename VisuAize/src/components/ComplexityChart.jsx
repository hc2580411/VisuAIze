import { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { COMPLEXITY_DATA } from '../constants';
import './ComplexityChart.css';

// Complexity function definitions
const COMPLEXITY_FUNCTIONS = {
    'O(1)': () => 1,
    'O(log n)': (n) => Math.log2(Math.max(n, 1)),
    'O(n)': (n) => n,
    'O(n log n)': (n) => n * Math.log2(Math.max(n, 1)),
    'O(n²)': (n) => n * n,
    'O(2ⁿ)': (n) => Math.pow(2, Math.min(n, 12)), // Cap for display
};

// Colors for each complexity class
const COMPLEXITY_COLORS = {
    'O(1)': '#10b981',      // Green - constant
    'O(log n)': '#06b6d4',  // Cyan - logarithmic
    'O(n)': '#6366f1',      // Indigo - linear
    'O(n log n)': '#8b5cf6', // Violet - linearithmic
    'O(n²)': '#f59e0b',     // Amber - quadratic
    'O(2ⁿ)': '#ef4444',     // Red - exponential
};

// Parse complexity string to get base complexity
const parseComplexity = (complexityStr) => {
    if (!complexityStr) return null;
    // Handle cases like "O(1) or O(n)" - take the first one
    const match = complexityStr.match(/O\([^)]+\)/);
    if (match) {
        // Normalize the string
        let normalized = match[0];
        normalized = normalized.replace(/\s+/g, '');
        // Map variations to standard forms
        if (normalized === 'O(logn)') return 'O(log n)';
        if (normalized === 'O(nlogn)') return 'O(n log n)';
        if (normalized === 'O(n^2)') return 'O(n²)';
        if (normalized === 'O(2^n)') return 'O(2ⁿ)';
        return normalized;
    }
    return null;
};

const ComplexityChart = ({ dataType, algorithm, dataSize = 10 }) => {
    const svgRef = useRef(null);
    const containerRef = useRef(null);

    // Get current algorithm complexity
    const currentComplexity = useMemo(() => {
        const typeData = COMPLEXITY_DATA[dataType];
        if (!typeData || !typeData[algorithm]) return null;
        return parseComplexity(typeData[algorithm].time);
    }, [dataType, algorithm]);

    // Get space complexity for display
    const spaceComplexity = useMemo(() => {
        const typeData = COMPLEXITY_DATA[dataType];
        if (!typeData || !typeData[algorithm]) return 'N/A';
        return typeData[algorithm].space;
    }, [dataType, algorithm]);

    useEffect(() => {
        if (!svgRef.current || !containerRef.current) return;

        const svg = d3.select(svgRef.current);
        const container = containerRef.current;
        const width = container.clientWidth || 300;
        const height = container.clientHeight || 200;
        const margin = { top: 20, right: 20, bottom: 35, left: 45 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        svg.selectAll("*").remove();
        svg.attr("width", width).attr("height", height);

        const g = svg.append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`);

        // Generate data points - use higher density for smoother curves
        const maxN = Math.max(dataSize * 2.5, 30);
        const step = maxN / 100; // 100 data points for smooth curves
        const nValues = d3.range(step, maxN + step, step);

        // Calculate max y value for scaling (exclude exponential for reasonable scaling)
        const relevantComplexities = ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)', 'O(n²)'];
        let maxY = 0;
        relevantComplexities.forEach(complexity => {
            const fn = COMPLEXITY_FUNCTIONS[complexity];
            const yVal = fn(maxN);
            if (yVal > maxY && yVal < 1000) maxY = yVal;
        });
        maxY = Math.min(maxY * 1.1, 500); // Cap at 500 for display

        // Scales
        const xScale = d3.scaleLinear()
            .domain([0, maxN])
            .range([0, innerWidth]);

        const yScale = d3.scaleLinear()
            .domain([0, maxY])
            .range([innerHeight, 0]);

        // Add gridlines
        g.append("g")
            .attr("class", "grid")
            .call(d3.axisLeft(yScale)
                .tickSize(-innerWidth)
                .tickFormat("")
                .ticks(5))
            .style("stroke-opacity", 0.1);

        // X-axis
        g.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0, ${innerHeight})`)
            .call(d3.axisBottom(xScale).ticks(10).tickFormat(d => Number.isInteger(d) ? d : ''))
            .append("text")
            .attr("x", innerWidth / 2)
            .attr("y", 30)
            .attr("fill", "var(--text-muted)")
            .attr("text-anchor", "middle")
            .style("font-size", "11px")
            .text("Input Size (n)");

        // Y-axis
        g.append("g")
            .attr("class", "y-axis")
            .call(d3.axisLeft(yScale).ticks(5))
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -innerHeight / 2)
            .attr("y", -35)
            .attr("fill", "var(--text-muted)")
            .attr("text-anchor", "middle")
            .style("font-size", "11px")
            .text("Operations");

        // Style axes
        g.selectAll(".x-axis path, .y-axis path")
            .style("stroke", "var(--border-color)");
        g.selectAll(".x-axis line, .y-axis line")
            .style("stroke", "var(--border-color)");
        g.selectAll(".x-axis text, .y-axis text")
            .style("fill", "var(--text-muted)")
            .style("font-size", "10px");

        // Line generator
        const line = d3.line()
            .x(d => xScale(d.x))
            .y(d => yScale(Math.min(d.y, maxY)))
            .curve(d3.curveMonotoneX);

        // Area generator
        const area = d3.area()
            .x(d => xScale(d.x))
            .y0(innerHeight)
            .y1(d => yScale(Math.min(d.y, maxY)))
            .curve(d3.curveMonotoneX);

        // Draw active complexity area first (so it's behind lines)
        if (currentComplexity) {
            const activeFn = COMPLEXITY_FUNCTIONS[currentComplexity];
            const activeData = nValues.map(n => ({ x: n, y: activeFn(n) }));
            const color = COMPLEXITY_COLORS[currentComplexity];

            // Add gradient for the area
            const gradientId = `area-gradient-${currentComplexity.replace(/\W/g, '')}`;
            const areaGradient = svg.append("defs")
                .append("linearGradient")
                .attr("id", gradientId)
                .attr("x1", "0%").attr("y1", "0%")
                .attr("x2", "0%").attr("y2", "100%");

            areaGradient.append("stop")
                .attr("offset", "0%")
                .attr("stop-color", color)
                .attr("stop-opacity", 0.35);
            areaGradient.append("stop")
                .attr("offset", "100%")
                .attr("stop-color", color)
                .attr("stop-opacity", 0.0);

            const areaPath = g.append("path")
                .datum(activeData)
                .attr("fill", `url(#${gradientId})`)
                .attr("d", area)
                .attr("opacity", 0);

            areaPath.transition()
                .duration(1000)
                .attr("opacity", 1);
        }

        // Draw all complexity lines
        Object.entries(COMPLEXITY_FUNCTIONS).forEach(([complexity, fn]) => {
            // Skip exponential for cleaner display
            if (complexity === 'O(2ⁿ)') return;

            const data = nValues.map(n => ({
                x: n,
                y: fn(n)
            }));

            const isCurrentComplexity = complexity === currentComplexity;
            const color = COMPLEXITY_COLORS[complexity];

            // Add line
            const path = g.append("path")
                .datum(data)
                .attr("class", `complexity-line ${isCurrentComplexity ? 'active' : ''}`)
                .attr("fill", "none")
                .attr("stroke", color)
                .attr("stroke-width", isCurrentComplexity ? 3 : 1.5)
                .attr("stroke-opacity", isCurrentComplexity ? 1 : 0.35)
                .attr("stroke-dasharray", isCurrentComplexity ? "none" : "4,4")
                .attr("d", line)
                .style("filter", isCurrentComplexity ? "drop-shadow(0 0 5px " + color + ")" : "none");

            // Animate line drawing
            const totalLength = path.node().getTotalLength();
            path.attr("stroke-dasharray", isCurrentComplexity ? `${totalLength} ${totalLength}` : "4,4")
                .attr("stroke-dashoffset", isCurrentComplexity ? totalLength : 0);

            if (isCurrentComplexity) {
                path.transition()
                    .duration(1200)
                    .ease(d3.easeCubicOut)
                    .attr("stroke-dashoffset", 0)
                    .on("end", () => {
                        path.attr("stroke-dasharray", "none");
                    });
            }
        });

        // Add current data size indicator line
        if (dataSize > 0) {
            g.append("line")
                .attr("class", "data-size-indicator")
                .attr("x1", xScale(dataSize))
                .attr("x2", xScale(dataSize))
                .attr("y1", 0)
                .attr("y2", innerHeight)
                .attr("stroke", "var(--primary)")
                .attr("stroke-width", 2)
                .attr("stroke-dasharray", "5,5")
                .attr("opacity", 0.7);

            g.append("text")
                .attr("x", xScale(dataSize))
                .attr("y", -5)
                .attr("text-anchor", "middle")
                .attr("fill", "var(--primary)")
                .style("font-size", "10px")
                .style("font-weight", "600")
                .text(`n=${dataSize}`);
        }

        // ========== INTERACTIVE HOVER ELEMENTS ==========

        // Create hover group (hidden by default)
        const hoverGroup = g.append("g")
            .attr("class", "hover-group")
            .style("display", "none");

        // Vertical crosshair line
        const crosshairLine = hoverGroup.append("line")
            .attr("class", "crosshair-line")
            .attr("y1", 0)
            .attr("y2", innerHeight)
            .attr("stroke", "rgba(255,255,255,0.5)")
            .attr("stroke-width", 1)
            .attr("stroke-dasharray", "3,3");

        // Intersection dots for each complexity
        const dots = {};
        relevantComplexities.forEach(complexity => {
            dots[complexity] = hoverGroup.append("circle")
                .attr("class", "hover-dot")
                .attr("r", 5)
                .attr("fill", COMPLEXITY_COLORS[complexity])
                .attr("stroke", "white")
                .attr("stroke-width", 2)
                .style("filter", "drop-shadow(0 0 3px rgba(0,0,0,0.3))");
        });

        // Tooltip background
        const tooltipGroup = hoverGroup.append("g")
            .attr("class", "tooltip-group");

        const tooltipBg = tooltipGroup.append("rect")
            .attr("class", "tooltip-bg")
            .attr("rx", 6)
            .attr("ry", 6)
            .attr("fill", "var(--bg-panel, rgba(15, 23, 42, 0.95))")
            .attr("stroke", "var(--border-color, rgba(255,255,255,0.1))")
            .attr("stroke-width", 1);

        const tooltipContent = tooltipGroup.append("g")
            .attr("class", "tooltip-content");

        // Invisible overlay rectangle for mouse tracking
        const overlay = g.append("rect")
            .attr("class", "mouse-overlay")
            .attr("width", innerWidth)
            .attr("height", innerHeight)
            .attr("fill", "transparent")
            .style("cursor", "crosshair");

        // Mouse event handlers
        overlay.on("mouseenter", () => {
            hoverGroup.style("display", null);
        });

        overlay.on("mouseleave", () => {
            hoverGroup.style("display", "none");
        });

        overlay.on("mousemove", function (event) {
            const [mouseX] = d3.pointer(event);
            // Use fractional n for smoother crosshair tracking
            const rawN = xScale.invert(mouseX);
            const clampedN = Math.max(0.5, Math.min(rawN, maxN));
            // Round n for display in tooltip
            const displayN = Math.round(clampedN);

            // Update crosshair position
            crosshairLine
                .attr("x1", xScale(clampedN))
                .attr("x2", xScale(clampedN));

            // Update intersection dots and collect values for tooltip
            const tooltipData = [];
            relevantComplexities.forEach(complexity => {
                const fn = COMPLEXITY_FUNCTIONS[complexity];
                // Use clampedN for smooth dot positioning
                const yVal = fn(clampedN);
                const displayY = Math.min(yVal, maxY);

                dots[complexity]
                    .attr("cx", xScale(clampedN))
                    .attr("cy", yScale(displayY))
                    .attr("opacity", complexity === currentComplexity ? 1 : 0.6);

                // Use displayN (rounded) for the tooltip values
                const tooltipYVal = fn(displayN);
                tooltipData.push({
                    complexity,
                    color: COMPLEXITY_COLORS[complexity],
                    value: Math.round(tooltipYVal),
                    isActive: complexity === currentComplexity
                });
            });

            // Sort tooltip data to show current complexity first
            tooltipData.sort((a, b) => {
                if (a.isActive) return -1;
                if (b.isActive) return 1;
                return a.value - b.value;
            });

            // Update tooltip content
            tooltipContent.selectAll("*").remove();

            // Title
            tooltipContent.append("text")
                .attr("x", 10)
                .attr("y", 18)
                .attr("fill", "white")
                .attr("font-size", "12px")
                .attr("font-weight", "bold")
                .text(`n = ${displayN}`);

            // Values for each complexity
            tooltipData.forEach((d, i) => {
                const yPos = 38 + i * 18;

                // Color dot
                tooltipContent.append("circle")
                    .attr("cx", 16)
                    .attr("cy", yPos - 4)
                    .attr("r", 4)
                    .attr("fill", d.color);

                // Complexity label
                tooltipContent.append("text")
                    .attr("x", 26)
                    .attr("y", yPos)
                    .attr("fill", d.isActive ? "white" : "rgba(255,255,255,0.7)")
                    .attr("font-size", d.isActive ? "11px" : "10px")
                    .attr("font-weight", d.isActive ? "bold" : "normal")
                    .attr("font-family", "'Fira Code', monospace")
                    .text(d.complexity);

                // Value
                tooltipContent.append("text")
                    .attr("x", 100)
                    .attr("y", yPos)
                    .attr("fill", d.isActive ? d.color : "rgba(255,255,255,0.7)")
                    .attr("font-size", d.isActive ? "11px" : "10px")
                    .attr("font-weight", d.isActive ? "bold" : "normal")
                    .attr("font-family", "'Fira Code', monospace")
                    .attr("text-anchor", "end")
                    .text(d.value > 9999 ? d.value.toExponential(1) : d.value.toLocaleString());
            });

            // Calculate tooltip dimensions
            const tooltipWidth = 125;
            const tooltipHeight = 38 + tooltipData.length * 18 + 8;

            // Position tooltip
            let tooltipX = xScale(clampedN) + 15;
            let tooltipY = 10;

            // Flip tooltip to left side if near right edge
            if (tooltipX + tooltipWidth > innerWidth - 10) {
                tooltipX = xScale(clampedN) - tooltipWidth - 15;
            }

            // Adjust vertical position if near bottom
            if (tooltipY + tooltipHeight > innerHeight - 10) {
                tooltipY = innerHeight - tooltipHeight - 10;
            }

            tooltipGroup.attr("transform", `translate(${tooltipX}, ${tooltipY})`);
            tooltipBg
                .attr("width", tooltipWidth)
                .attr("height", tooltipHeight);
        });

    }, [dataType, algorithm, dataSize, currentComplexity]);

    // Current complexity info
    const complexityInfo = useMemo(() => {
        if (!currentComplexity) return null;
        const fn = COMPLEXITY_FUNCTIONS[currentComplexity];
        if (!fn) return null;

        const operations = fn(dataSize);
        return {
            complexity: currentComplexity,
            color: COMPLEXITY_COLORS[currentComplexity] || '#6366f1',
            operations: Math.round(operations),
            description: getComplexityDescription(currentComplexity)
        };
    }, [currentComplexity, dataSize]);

    return (
        <div className="complexity-chart-container glass-panel">
            <div className="complexity-header">
                <h3 className="complexity-title">Time Complexity</h3>
                {complexityInfo && (
                    <div className="complexity-badge" style={{ backgroundColor: complexityInfo.color + '20', borderColor: complexityInfo.color }}>
                        <span className="complexity-value" style={{ color: complexityInfo.color }}>
                            {complexityInfo.complexity}
                        </span>
                    </div>
                )}
            </div>

            <div className="chart-wrapper" ref={containerRef}>
                <svg ref={svgRef}></svg>
            </div>

            <div className="complexity-legend">
                {Object.entries(COMPLEXITY_COLORS).filter(([k]) => k !== 'O(2ⁿ)').map(([complexity, color]) => (
                    <div
                        key={complexity}
                        className={`legend-item ${complexity === currentComplexity ? 'active' : ''}`}
                    >
                        <span className="legend-color" style={{ backgroundColor: color }}></span>
                        <span className="legend-label">{complexity}</span>
                    </div>
                ))}
            </div>

            {complexityInfo && (
                <div className="complexity-details">
                    <div className="detail-row">
                        <span className="detail-label">Time:</span>
                        <span className="detail-value" style={{ color: complexityInfo.color }}>
                            {complexityInfo.complexity}
                        </span>
                    </div>
                    <div className="detail-row">
                        <span className="detail-label">Space:</span>
                        <span className="detail-value">{spaceComplexity}</span>
                    </div>
                    <div className="detail-row">
                        <span className="detail-label">n={dataSize} →</span>
                        <span className="detail-value">~{complexityInfo.operations} ops</span>
                    </div>
                    <p className="complexity-description">{complexityInfo.description}</p>
                </div>
            )}
        </div>
    );
};

// Helper function for complexity descriptions
const getComplexityDescription = (complexity) => {
    const descriptions = {
        'O(1)': 'Constant time - execution time does not depend on input size.',
        'O(log n)': 'Logarithmic - very efficient, halves the problem each step.',
        'O(n)': 'Linear - time grows proportionally with input size.',
        'O(n log n)': 'Linearithmic - efficient for comparison-based sorting.',
        'O(n²)': 'Quadratic - time grows with the square of input size.',
    };
    return descriptions[complexity] || '';
};

export default ComplexityChart;
