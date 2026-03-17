import { useEffect, useRef, useState, memo, useMemo } from "react";
import * as d3 from "d3";
import { debounce } from "../utils/helpers";
import "./ArrayVisualizer.css";

const ArrayVisualizer = memo(function ArrayVisualizer({ step, speed, onUpdateData, isPlaying, animationsEnabled = true }) {
  const svgRef = useRef();
  const containerRef = useRef();
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [editPos, setEditPos] = useState({ x: 0, y: 0 });

  // Stable ID Management
  const itemsRef = useRef([]); // [{ id, val }]
  const idCounter = useRef(0);
  const pendingDrag = useRef(null);

  // Refs for stable drag callbacks
  const onUpdateDataRef = useRef(onUpdateData);
  const isPlayingRef = useRef(isPlaying);
  onUpdateDataRef.current = onUpdateData;
  isPlayingRef.current = isPlaying;

  // Memoize transition duration — zero when animations are disabled
  const transitionDuration = useMemo(() =>
    animationsEnabled ? (speed ? Math.min(speed * 0.8, 500) : 300) : 0,
    [speed, animationsEnabled]);

  useEffect(() => {
    const debouncedResize = debounce(() => {
      setWindowWidth(window.innerWidth);
    }, 150);

    window.addEventListener("resize", debouncedResize);
    return () => window.removeEventListener("resize", debouncedResize);
  }, []);

  // Handle Edit Submission
  const handleEditSubmit = (e) => {
    if (e.key === "Enter" || e.type === "blur") {
      if (editingIndex !== null) {
        const newValue = parseInt(editValue);
        if (!isNaN(newValue)) {
          const newData = [...step.array];
          newData[editingIndex] = newValue;
          onUpdateData(newData);
        }
        setEditingIndex(null);
      }
    } else if (e.key === "Escape") {
      setEditingIndex(null);
    }
  };

  // Initialize SVG Structure
  useEffect(() => {
    const svg = d3.select(svgRef.current);

    svg.selectAll("defs").remove();
    svg.selectAll(".bars-layer").remove();
    svg.selectAll(".indices-layer").remove();
    svg.selectAll(".text-layer").remove();
    svg.selectAll(".interaction-layer").remove();
    svg.selectAll(".status-layer").remove();

    const defs = svg.append("defs");

    // Glow Filter
    const filter = defs.append("filter")
      .attr("id", "array-glow")
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
        .attr("x1", "0%").attr("y1", "0%")
        .attr("x2", "0%").attr("y2", "100%");
      gradient.append("stop").attr("offset", "0%").attr("stop-color", color1);
      gradient.append("stop").attr("offset", "100%").attr("stop-color", color2);
    };

    createGradient("array-gradient-default", "#818cf8", "#6366f1");
    createGradient("array-gradient-compare", "#fbbf24", "#f59e0b");
    createGradient("array-gradient-swap", "#f472b6", "#ec4899");
    createGradient("array-gradient-sorted", "#34d399", "#10b981");
    createGradient("array-gradient-insert", "#34d399", "#10b981");

    // Layers - Order matters
    // Bars and Text should be in a group that we can manipulate?
    // Actually, distinct layers is fine, but for drag we might want to group bar+text per item.
    // Let's stick to the layer structure but maybe we can group items logically if needed.
    // For now, let's use a single content layer for bars to simplify z-indexing during drag.
    // Actually, grouping bar + text into a single "node-group" is better for dragging.
    svg.append("g").attr("class", "content-layer");
    svg.append("g").attr("class", "indices-layer");
    svg.append("g").attr("class", "interaction-layer");

    // Placeholder
    const interactionLayer = svg.select(".interaction-layer");
    interactionLayer.append("rect")
      .attr("class", "drag-placeholder")
      .attr("width", 50) // dynamic
      .attr("height", 0) // dynamic
      .attr("rx", 8)
      .attr("opacity", 0);

    return () => {
      svg.selectAll("*").remove();
    };
  }, []);

  // Update Data
  useEffect(() => {
    const svg = d3.select(svgRef.current);
    const containerWidth = containerRef.current?.clientWidth || 800;
    const containerHeight = containerRef.current?.clientHeight || 350;

    if (!step || !step.array || step.array.length === 0) {
      svg.selectAll(".content-layer").selectAll("*").remove();
      svg.selectAll(".indices-layer").selectAll("*").remove();
      svg.attr("width", containerWidth).attr("height", containerHeight);

      svg.selectAll(".empty-message").data([1])
        .join("text")
        .attr("class", "empty-message")
        .attr("x", containerWidth / 2)
        .attr("y", containerHeight / 2)
        .attr("text-anchor", "middle")
        .attr("font-size", "20px")
        .attr("fill", "var(--text-muted)")
        .text("Empty Array");
      return;
    }

    svg.selectAll(".empty-message").remove();
    const currentArray = step.array;

    // Reconcile itemsRef
    let items = [...itemsRef.current];

    if (pendingDrag.current) {
      // A drag-and-drop just completed — reorder existing IDs to match
      const { oldIndex, newIndex } = pendingDrag.current;
      if (items[oldIndex]) {
        const [moved] = items.splice(oldIndex, 1);
        items.splice(newIndex, 0, moved);
      }
      pendingDrag.current = null;
    } else if (currentArray.length !== items.length) {
      // Array grew or shrank (insert/delete) — rebuild IDs entirely
      items = currentArray.map(v => ({ id: `arr-${idCounter.current++}`, val: v }));
    } else {
      // Same length — update values in-place, preserving IDs for smooth D3 transitions
      items = items.map((it, i) => ({ ...it, val: currentArray[i] }));
    }

    // Final safety
    if (items.length !== currentArray.length) {
      items = currentArray.map(v => ({ id: `arr-${idCounter.current++}`, val: v }));
    }

    itemsRef.current = items;
    const data = items;

    // Layout calculations
    const minBarWidth = 50;
    const requiredWidth = data.length * minBarWidth + 100;
    const width = Math.max(containerWidth, requiredWidth);
    const height = 350;

    svg.attr("width", width).attr("height", height);

    const xScale = d3.scaleBand()
      .domain(d3.range(data.length))
      .range([50, width - 50])
      .padding(0.3);

    const maxValue = Math.max(d3.max(data.map(d => d.val)) || 1, 10);
    const yScale = d3.scaleLinear()
      .domain([0, maxValue])
      .range([0, 200]);

    const getFillColor = (index) => {
      if (step.swap?.includes(index)) return "url(#array-gradient-swap)";
      if (step.compare?.includes(index)) return "url(#array-gradient-compare)";
      if (Number.isFinite(step.insert) && step.insert === index) return "url(#array-gradient-insert)";
      if (step.sorted?.includes(index)) return "url(#array-gradient-sorted)";
      return "url(#array-gradient-default)";
    };

    const contentLayer = svg.select(".content-layer");
    const interactionLayer = svg.select(".interaction-layer");
    let placeholder = interactionLayer.select(".drag-placeholder");

    // Update placeholder dimensions (width mainly)
    placeholder.attr("width", xScale.bandwidth());

    // Drag Behavior
    const drag = d3.drag()
      .on("start", function (event, d) {
        if (isPlayingRef.current) return;
        const node = d3.select(this);
        node.classed("dragging", true).raise();

        const idx = data.indexOf(d);
        d._dragLastIdx = idx;

        // Show Placeholder
        placeholder
          .attr("x", xScale(idx))
          .attr("y", height - 60 - yScale(d.val))
          .attr("height", yScale(d.val))
          .attr("opacity", 1);
      })
      .on("drag", function (event, d) {
        if (isPlayingRef.current) return;

        // Constrain x
        const x = Math.max(50, Math.min(width - 50 - xScale.bandwidth(), event.x - xScale.bandwidth() / 2));
        d3.select(this).attr("transform", `translate(${x}, ${height - 60 - yScale(d.val)})`);

        // Calculate new index
        const stepWidth = xScale.step();
        const dragIdx = Math.max(0, Math.min(data.length - 1, Math.round((x - 50 + xScale.bandwidth() / 2 - xScale.bandwidth() / 2) / stepWidth))); // Simplified: x relative to start / step

        if (dragIdx !== d._dragLastIdx) {
          d._dragLastIdx = dragIdx;

          // Move Placeholder
          placeholder
            .interrupt()
            .transition().duration(150).ease(d3.easeCubicOut)
            .attr("x", xScale(dragIdx)); // Snap to slot

          // Magnetic Shift of Siblings
          const oldIdx = data.indexOf(d);
          contentLayer.selectAll(".array-item-group")
            .filter(nd => nd.id !== d.id)
            .each(function (ndData) {
              const originalIdx = data.indexOf(ndData);
              let targetIdx = originalIdx;
              if (oldIdx < dragIdx && originalIdx > oldIdx && originalIdx <= dragIdx) targetIdx--;
              else if (oldIdx > dragIdx && originalIdx < oldIdx && originalIdx >= dragIdx) targetIdx++;

              d3.select(this)
                .interrupt()
                .transition().duration(250).ease(d3.easeCubicOut)
                .attr("transform", `translate(${xScale(targetIdx)}, ${height - 60 - yScale(ndData.val)})`);
            });
        }
      })
      .on("end", function (event, d) {
        if (isPlayingRef.current) return;
        d3.select(this).classed("dragging", false);
        placeholder.attr("opacity", 0);

        const oldIndex = data.indexOf(d);
        const stepWidth = xScale.step();
        // Recalculate based on final position
        // Actually, use d._dragLastIdx if valid? Or recalc from event.x?
        // Safer to recalc from event.x for consistency
        const x = event.x - xScale.bandwidth() / 2;
        const finalIdx = Math.max(0, Math.min(data.length - 1, Math.round((x - 50) / stepWidth)));

        if (finalIdx !== oldIndex) {
          pendingDrag.current = { oldIndex, newIndex: finalIdx };
          const newData = [...step.array];
          const [moved] = newData.splice(oldIndex, 1);
          newData.splice(finalIdx, 0, moved);
          onUpdateDataRef.current(newData);
        } else {
          // Reset
          contentLayer.selectAll(".array-item-group")
            .interrupt()
            .transition().duration(200)
            .attr("transform", (nd) => `translate(${xScale(data.indexOf(nd))}, ${height - 60 - yScale(nd.val)})`);
        }
      });

    // Render Items (Groups of Rect + Text)
    const itemsSelection = contentLayer.selectAll(".array-item-group")
      .data(data, d => d.id);

    itemsSelection.join(
      enter => {
        const grp = enter.append("g")
          .attr("class", "array-item-group")
          .attr("transform", (d, i) => `translate(${xScale(i)}, ${height - 60}) scale(1, 0)`) // Grow from bottom
          .attr("opacity", 0)
          .on("dblclick", function (event, d) {
            if (isPlayingRef.current) return;
            const index = data.indexOf(d);
            setEditingIndex(index);
            setEditValue(d.val.toString());
            setEditPos({ x: xScale(index) + xScale.bandwidth() / 2, y: height - 100 - yScale(d.val) });
          })
          .call(drag);

        grp.append("rect")
          .attr("width", xScale.bandwidth())
          .attr("height", d => yScale(d.val))
          .attr("rx", 8)
          .attr("fill", (d, i) => getFillColor(i))
          .style("filter", "url(#array-glow)");

        grp.append("text")
          .attr("class", "val-text")
          .attr("x", xScale.bandwidth() / 2)
          .attr("y", -10) // Above bar
          .attr("text-anchor", "middle")
          .attr("font-weight", "700")
          .attr("font-size", "16px")
          .text(d => d.val);

        return grp.transition().duration(transitionDuration * 1.2)
          .ease(d3.easeBackOut.overshoot(1.7))
          .attr("opacity", 1)
          .attr("transform", (d, i) => `translate(${xScale(i)}, ${height - 60 - yScale(d.val)}) scale(1, 1)`);
      },
      update => {
        update.select("rect")
          .transition().duration(transitionDuration)
          .ease(d3.easeCubicOut)
          .attr("width", xScale.bandwidth())
          .attr("height", d => yScale(d.val))
          .attr("fill", (d, i) => getFillColor(i));

        update.select("text")
          .text(d => d.val)
          .transition().duration(transitionDuration)
          .attr("x", xScale.bandwidth() / 2);

        return update
          .on("dblclick", function (event, d) {
            if (isPlayingRef.current) return;
            const index = data.indexOf(d);
            setEditingIndex(index);
            setEditValue(d.val.toString());
            setEditPos({ x: xScale(index) + xScale.bandwidth() / 2, y: height - 100 - yScale(d.val) });
          })
          .call(drag)
          .each(function (d) {
            if (!d3.select(this).classed("dragging")) {
              d3.select(this).transition().duration(transitionDuration)
                .ease(d3.easeCubicOut)
                .attr("transform", `translate(${xScale(data.indexOf(d))}, ${height - 60 - yScale(d.val)})`);
            }
          });
      },
      exit => exit.transition().duration(transitionDuration * 0.8)
        .attr("transform", (d, i) => `translate(${xScale(i)}, ${height - 60}) scale(1, 0)`)
        .attr("opacity", 0)
        .remove()
    ).order(); // Ensure z-order

    interactionLayer.raise(); // Always on top

    // Indices Layer
    const indicesLayer = svg.select(".indices-layer");
    indicesLayer.selectAll(".idx-text")
      .data(data)
      .join(
        enter => enter.append("text")
          .attr("class", "idx-text")
          .attr("x", (d, i) => xScale(i) + xScale.bandwidth() / 2)
          .attr("y", height - 35)
          .attr("text-anchor", "middle")
          .attr("font-size", "12px")
          .attr("opacity", 0)
          .text((d, i) => i)
          .call(enter => enter.transition().duration(800).attr("opacity", 1)),
        update => update.transition().duration(transitionDuration)
          .attr("x", (d, i) => xScale(i) + xScale.bandwidth() / 2)
          .text((d, i) => i),
        exit => exit.remove()
      );

  }, [step, speed, transitionDuration, windowWidth]); // Removed isPlaying/onUpdateData from deps to prev flicker

  return (
    <div ref={containerRef} className="array-visualizer-container" style={{ position: 'relative' }}>
      <svg ref={svgRef} className="array-svg" />
      {editingIndex !== null && (
        <input
          autoFocus
          className="array-edit-input"
          style={{
            left: `${editPos.x}px`,
            top: `${editPos.y}px`,
            transform: 'translateX(-50%)'
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

ArrayVisualizer.displayName = 'ArrayVisualizer';

export default ArrayVisualizer;
