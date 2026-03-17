// src/components/Visualizer/TreeVisualizer.jsx
import { useEffect, useRef, useMemo, useState, memo } from "react";
import * as d3 from "d3";
import "./TreeVisualizer.css";

export default memo(function TreeVisualizer({ step, speed, onUpdateData, isPlaying, animationsEnabled = true }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [editPos, setEditPos] = useState({ x: 0, y: 0 });

  // Use refs for values accessed inside d3 drag handlers
  const onUpdateDataRef = useRef(onUpdateData);
  onUpdateDataRef.current = onUpdateData;

  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;

  const stepRef = useRef(step);
  stepRef.current = step;

  // Zero out duration when animations are disabled
  const transitionDuration = useMemo(() =>
    animationsEnabled ? (speed ? Math.min(speed * 0.8, 500) : 300) : 0,
    [speed, animationsEnabled]);

  const transitionDurationRef = useRef(transitionDuration);
  transitionDurationRef.current = transitionDuration;

  // Track the current drag target using a local variable (NOT React state)
  const currentDragTarget = useRef(null);

  // One-time SVG initialization
  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Define gradients and filters
    const defs = svg.append("defs");

    // Glow Filter
    const filter = defs.append("filter")
      .attr("id", "tree-glow")
      .attr("x", "-20%")
      .attr("y", "-20%")
      .attr("width", "140%")
      .attr("height", "140%");
    filter.append("feGaussianBlur")
      .attr("stdDeviation", "2.5")
      .attr("result", "coloredBlur");
    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    const createGradient = (id, color1, color2) => {
      const gradient = defs.append("linearGradient")
        .attr("id", id)
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "0%")
        .attr("y2", "100%");
      gradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", color1);
      gradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", color2);
    };

    createGradient("tree-gradient-default", "#818cf8", "#6366f1");
    createGradient("tree-gradient-highlight", "#f472b6", "#ec4899");
    createGradient("tree-gradient-visited", "#34d399", "#10b981");
    createGradient("tree-gradient-ghost", "rgba(99, 102, 241, 0.2)", "rgba(99, 102, 241, 0.1)");
    createGradient("tree-gradient-target", "#fbbf24", "#f59e0b");

    const mainGroup = svg.append("g").attr("class", "main-group").attr("transform", "translate(50, 80)");
    mainGroup.append("g").attr("class", "link-layer");
    mainGroup.append("g").attr("class", "node-layer");

    // Ghost layer at top
    const interactionLayer = mainGroup.append("g").attr("class", "interaction-layer");
    interactionLayer.append("circle")
      .attr("class", "drag-placeholder")
      .attr("r", 34)
      .attr("opacity", 0);

    return () => svg.selectAll("*").remove();
  }, []);

  // Handle Edit Submission
  const handleEditSubmit = (e) => {
    if (e.key === "Enter" || e.type === "blur") {
      if (editingId !== null) {
        const newValue = parseInt(editValue);
        if (!isNaN(newValue)) {
          const currentValues = [];
          const collectValues = (node) => {
            if (!node) return;
            currentValues.push(node.id === editingId || node.name === editingId ? newValue : node.name);
            if (node.children) node.children.forEach(collectValues);
          };
          collectValues(stepRef.current?.root);
          onUpdateDataRef.current(currentValues);
        }
        setEditingId(null);
      }
    } else if (e.key === "Escape") {
      setEditingId(null);
    }
  };

  // Main Render Effect
  useEffect(() => {
    if (!step) return;

    const svg = d3.select(svgRef.current);
    const mainGroup = svg.select(".main-group");
    const linkLayer = mainGroup.select(".link-layer");
    const nodeLayer = mainGroup.select(".node-layer");
    const ghost = mainGroup.select(".drag-placeholder");

    const rootData = step.root;
    const containerWidth = containerRef.current?.clientWidth || 800;
    const containerHeight = containerRef.current?.clientHeight || 500;

    // Handle empty tree
    if (!rootData) {
      svg.selectAll(".empty-message").data([1]).join("text")
        .attr("class", "empty-message info-text")
        .attr("x", containerWidth / 2)
        .attr("y", containerHeight / 2)
        .attr("text-anchor", "middle")
        .text("Empty tree");

      linkLayer.selectAll("*").remove();
      nodeLayer.selectAll("*").remove();
      return;
    }
    svg.selectAll(".empty-message").remove();

    const root = d3.hierarchy(rootData);
    const depth = root.height;
    const leaves = root.leaves().length;

    const width = Math.max(containerWidth, leaves * 80 + 100);
    const height = Math.max(500, depth * 100 + 200);

    svg.attr("width", width).attr("height", height);

    const treeLayout = d3.tree().size([width - 100, height - 150]);
    treeLayout(root);

    const nodes = root.descendants();
    const links = root.links();

    // Drag Behavior
    const drag = d3.drag()
      .on("start", function (event, d) {
        if (isPlayingRef.current) return;
        d3.select(this).classed("dragging", true).raise();
        ghost.attr("cx", d.x).attr("cy", d.y).attr("opacity", 1);
      })
      .on("drag", function (event, d) {
        if (isPlayingRef.current) return;
        d3.select(this).attr("transform", `translate(${event.x}, ${event.y})`);

        const target = nodes.find(n => {
          if (n === d) return false;
          const dx = n.x - event.x;
          const dy = n.y - event.y;
          return Math.sqrt(dx * dx + dy * dy) < 40;
        });

        // Clear highlight
        if (currentDragTarget.current) {
          nodeLayer.selectAll(".node-group").filter(n => n.data.id === currentDragTarget.current.data.id)
            .select("circle")
            .attr("fill", "url(#tree-gradient-default)")
            .attr("stroke", "#fff")
            .attr("stroke-width", 4)
            .attr("r", 30);
        }

        currentDragTarget.current = target;

        if (target) {
          nodeLayer.selectAll(".node-group").filter(n => n.data.id === target.data.id)
            .select("circle")
            .attr("fill", "url(#tree-gradient-target)")
            .attr("stroke", "#f59e0b")
            .attr("stroke-width", 5)
            .attr("r", 38);
        }
      })
      .on("end", function (event, d) {
        if (isPlayingRef.current) return;
        d3.select(this).classed("dragging", false);
        ghost.attr("opacity", 0);

        if (currentDragTarget.current) {
          nodeLayer.selectAll(".node-group").filter(n => n.data.id === currentDragTarget.current.data.id)
            .select("circle")
            .attr("fill", "url(#tree-gradient-default)")
            .attr("stroke", "#fff")
            .attr("stroke-width", 4)
            .attr("r", 30);
        }

        const target = currentDragTarget.current;
        currentDragTarget.current = null;

        if (target) {
          const deepClone = (n) => {
            if (!n) return null;
            const cloned = { name: n.name, children: [], id: n.id };
            if (n.children) cloned.children = n.children.map(deepClone);
            return cloned;
          };

          const clonedRoot = deepClone(rootData);

          const findNode = (n, id) => {
            if (!n) return null;
            if (n.id === id) return n;
            if (n.children) {
              for (const child of n.children) {
                const found = findNode(child, id);
                if (found) return found;
              }
            }
            return null;
          };

          const nodeA = findNode(clonedRoot, d.data.id);
          const nodeB = findNode(clonedRoot, target.data.id);

          if (nodeA && nodeB) {
            const tempName = nodeA.name;
            nodeA.name = nodeB.name;
            nodeB.name = tempName;
            clonedRoot.__isTreeRoot = true;
            onUpdateDataRef.current(clonedRoot);
          }
        } else {
          d3.select(this).transition().duration(200).attr("transform", `translate(${d.x}, ${d.y})`);
        }
      });

    // Render Links
    const linkGenerator = d3.linkVertical().x(d => d.x).y(d => d.y);

    linkLayer.selectAll("path")
      .data(links, d => {
        const sId = d.source.data.id || d.source.data.name;
        const tId = d.target.data.id || d.target.data.name;
        return `${sId}-${tId}`;
      })
      .join(
        enter => enter.append("path")
          .attr("fill", "none")
          .attr("stroke", "var(--text-secondary)")
          .attr("stroke-width", 4)
          .attr("stroke-opacity", 0)
          .attr("d", d => {
            const o = { x: d.source.x, y: d.source.y };
            return linkGenerator({ source: o, target: o });
          })
          .call(enter => enter.transition().duration(transitionDurationRef.current)
            .attr("stroke-opacity", 0.6)
            .attr("d", d => linkGenerator(d))),
        update => update.transition().duration(transitionDurationRef.current)
          .attr("d", d => linkGenerator(d)),
        exit => exit.transition().duration(transitionDurationRef.current).attr("stroke-opacity", 0).remove()
      );

    // Render Nodes
    const groups = nodeLayer.selectAll(".node-group")
      .data(nodes, d => d.data.id || d.data.name)
      .join(
        enter => {
          const g = enter.append("g")
            .attr("class", "node-group")
            .attr("transform", d => `translate(${d.x}, ${d.y})`)
            .call(drag);

          g.append("circle")
            .attr("r", 0)
            .attr("stroke", "#fff")
            .attr("stroke-width", 4)
            .style("filter", "url(#tree-glow)");

          g.append("text")
            .attr("class", "node-text")
            .attr("text-anchor", "middle")
            .attr("dy", 5)
            .attr("opacity", 0)
            .attr("fill", "#fff")
            .style("font-size", "16px")
            .style("font-weight", "bold");

          return g;
        },
        update => update.call(drag),
        exit => exit.transition().duration(transitionDurationRef.current).attr("opacity", 0).remove()
      );

    // Transitions for all nodes (including enter)
    groups.transition().duration(transitionDurationRef.current)
      .attr("transform", d => `translate(${d.x}, ${d.y})`)
      .attr("opacity", 1);

    groups.select("circle")
      .transition().duration(transitionDurationRef.current)
      .attr("fill", (d) => {
        if (step.highlight && d.data.id === step.highlight) return "url(#tree-gradient-highlight)";
        if (step.highlight && d.data.name === step.highlight) return "url(#tree-gradient-highlight)";
        if (step.visited && step.visited.includes(d.data.name)) return "url(#tree-gradient-visited)";
        return "url(#tree-gradient-default)";
      })
      .attr("r", (d) => {
        if (step.highlight && (d.data.id === step.highlight || d.data.name === step.highlight)) return 38;
        return 30;
      });

    groups.select("text")
      .text(d => d.data.name)
      .transition().duration(transitionDurationRef.current)
      .attr("opacity", 1);

    // Visited order text
    if (step.visited && step.visited.length > 0) {
      svg.selectAll(".visited-text").data([step.visited.join(', ')])
        .join("text")
        .attr("class", "visited-text info-text")
        .attr("x", width / 2)
        .attr("y", height - 20)
        .attr("text-anchor", "middle")
        .text(d => `Visited order: [${d}]`);
    } else {
      svg.selectAll(".visited-text").remove();
    }

    // Sync double click separately since it needs setEditingId closure
    groups.on("dblclick", function (event, d) {
      if (isPlayingRef.current) return;
      event.stopPropagation();
      setEditingId(d.data.id);
      setEditValue(d.data.name.toString());
      setEditPos({ x: d.x + 50, y: d.y + 80 });
    });

  }, [step, animationsEnabled]);

  return (
    <div ref={containerRef} className="tree-visualizer" style={{ position: 'relative', width: '100%', height: '100%' }}>
      <svg ref={svgRef}></svg>
      {editingId !== null && (
        <input
          autoFocus
          className="tree-edit-input"
          style={{
            left: `${editPos.x}px`,
            top: `${editPos.y}px`,
            transform: 'translate(-50%, -50%)'
          }}
          type="number"
          value={editValue}
          onBlur={handleEditSubmit}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleEditSubmit}
        />
      )}
    </div>
  );
});
