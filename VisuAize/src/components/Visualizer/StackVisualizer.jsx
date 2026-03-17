import { useEffect, useRef, useState, memo } from "react";
import * as d3 from "d3";
import "./StackVisualizer.css";

const StackVisualizer = memo(({ step, speed, onUpdateData, isPlaying, animationsEnabled = true }) => {
    const svgRef = useRef(null);
    const containerRef = useRef(null);
    const [editingIndex, setEditingIndex] = useState(null);
    const [editValue, setEditValue] = useState("");
    const [editPos, setEditPos] = useState({ x: 0, y: 0 });

    // Stable ID Management
    const itemsRef = useRef([]); // [{ id, val }]
    const idCounter = useRef(0);
    const pendingDrag = useRef(null);

    // Refs for stable drag callbacks to prevent re-creation of drag behavior
    const onUpdateDataRef = useRef(onUpdateData);
    const isPlayingRef = useRef(isPlaying);
    onUpdateDataRef.current = onUpdateData;
    isPlayingRef.current = isPlaying;


    // Zero out duration when animations are disabled
    const transitionDuration = animationsEnabled ? (speed ? Math.min(speed * 0.8, 500) : 300) : 0;

    // Handle Edit Submission
    const handleEditSubmit = (e) => {
        if (e.key === "Enter" || e.type === "blur") {
            if (editingIndex !== null) {
                const newValue = parseInt(editValue);
                if (!isNaN(newValue)) {
                    const newData = [...step.stack];
                    newData[editingIndex] = newValue;
                    onUpdateData(newData);
                }
                setEditingIndex(null);
            }
        } else if (e.key === "Escape") {
            setEditingIndex(null);
        }
    };

    // Initialize SVG structure with defs/gradients ONCE on mount
    useEffect(() => {
        const svg = d3.select(svgRef.current);

        // Clear any existing content
        svg.selectAll("*").remove();

        // Create defs with filters and gradients
        const defs = svg.append("defs");

        // Glow Filter
        const filter = defs.append("filter")
            .attr("id", "stack-glow")
            .attr("x", "-20%")
            .attr("y", "-20%")
            .attr("width", "140%")
            .attr("height", "140%");
        filter.append("feGaussianBlur")
            .attr("stdDeviation", "2")
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
        createGradient("stack-gradient-default", "#818cf8", "#6366f1");
        createGradient("stack-gradient-highlight", "#f472b6", "#ec4899");
        createGradient("stack-gradient-new", "#34d399", "#10b981");

        // Create layers
        svg.append("g").attr("class", "base-layer-g");
        svg.append("g").attr("class", "content-layer-g");
        svg.append("g").attr("class", "interaction-layer-g");

        return () => {
            svg.selectAll("*").remove();
        };
    }, []);

    useEffect(() => {
        const svg = d3.select(svgRef.current);
        const containerWidth = containerRef.current?.clientWidth || 600;
        const containerHeight = containerRef.current?.clientHeight || 400;
        const height = Math.max(containerHeight, 350);

        if (!step || !step.stack || step.stack.length === 0) {
            // Clear content layers but keep defs and layer structure
            svg.select(".base-layer-g").selectAll("*").remove();
            svg.select(".content-layer-g").selectAll("*").remove();
            svg.select(".interaction-layer-g").selectAll("*").remove();
            svg.attr("width", containerWidth).attr("height", height);

            svg.selectAll(".empty-message").data([1])
                .join("text")
                .attr("class", "empty-message")
                .attr("x", containerWidth / 2)
                .attr("y", height / 2)
                .attr("text-anchor", "middle")
                .attr("font-size", "20px")
                .attr("fill", "var(--text-muted)")
                .text("Empty Stack");
            return;
        }

        // Remove empty message if exists
        svg.selectAll(".empty-message").remove();
        const stack = step.stack;

        // Reconcile itemsRef
        const currentStack = step.stack;
        let items = [...itemsRef.current];

        if (pendingDrag.current) {
            const { oldIndex, newIndex } = pendingDrag.current;
            if (items[oldIndex]) {
                const [moved] = items.splice(oldIndex, 1);
                items.splice(newIndex, 0, moved);
            }
            pendingDrag.current = null;
        } else {
            // Heuristics for external updates (push/pop)
            if (currentStack.length > items.length) {
                // Push
                // Usually push is at end? Or depends on implementation.
                // Assuming standard stack push to end? 
                // Wait, VisuAize stack might be visualized bottom-up or top-down?
                // Lines 116 "baseY - (d.i+1)*itemHeight" implies index 0 is at bottom (baseY - itemHeight).
                // So index 0 is bottom used.
                // push usually adds to end.

                // However, "action" might be available?
                // If not, use diff.
                let oldIdx = 0;
                const newItems = [];
                for (let i = 0; i < currentStack.length; i++) {
                    if (oldIdx < items.length && items[oldIdx].val === currentStack[i]) {
                        newItems.push(items[oldIdx]);
                        oldIdx++;
                    } else {
                        newItems.push({ id: `stack-${idCounter.current++}`, val: currentStack[i] });
                    }
                }
                items = newItems;
            } else if (currentStack.length < items.length) {
                // Pop
                // Simple diff
                const newItems = [];
                let currIdx = 0;
                for (let i = 0; i < items.length; i++) {
                    if (currIdx < currentStack.length && items[i].val === currentStack[currIdx]) {
                        newItems.push(items[i]);
                        currIdx++;
                    }
                }
                items = newItems;
            } else {
                items = items.map((it, i) => ({ ...it, val: currentStack[i] }));
            }
        }

        // Safety Fallback
        if (items.length !== currentStack.length) {
            items = currentStack.map(v => ({ id: `stack-${idCounter.current++}`, val: v }));
        }

        itemsRef.current = items;
        // Don't need to wrap in {val, i} anymore, items has val directly. 
        // We will compute i on the fly.

        svg.attr("width", containerWidth).attr("height", height);

        // Get the pre-created layers
        const baseLayer = svg.select(".base-layer-g");
        const contentLayer = svg.select(".content-layer-g");
        const interactionLayer = svg.select(".interaction-layer-g");

        const itemHeight = 50;
        const itemWidth = 120;
        const centerX = containerWidth / 2;
        const centerY = height / 2;

        const stackHeight = stack.length * itemHeight;
        const baseY = centerY + stackHeight / 2;

        // Base Line in Base Layer
        baseLayer.selectAll(".base-line").data([1]).join("line")
            .attr("class", "base-line")
            .attr("stroke-width", 5)
            .attr("stroke", "var(--border-color)")
            .attr("stroke-linecap", "round")
            .attr("x1", centerX - itemWidth)
            .attr("x2", centerX + itemWidth)
            .attr("y1", baseY)
            .attr("y2", baseY);

        // Placeholder in Interaction Layer (Always Top)
        let placeholder = interactionLayer.select(".drag-placeholder");
        if (placeholder.empty()) {
            placeholder = interactionLayer.append("rect")
                .attr("class", "drag-placeholder")
                .attr("width", 80)
                .attr("height", 50)
                .attr("rx", 8)
                .attr("opacity", 0);
        }
        // Ensure dimensions
        placeholder.attr("width", itemWidth + 16).attr("height", itemHeight - 5 + 16);

        const data = items;

        // Drag Behavior - Uses references to avoid closure staleness
        const drag = d3.drag()
            .on("start", function (event, d) {
                if (isPlayingRef.current) return;
                const node = d3.select(this);
                node.classed("dragging", true).raise();

                const idx = data.indexOf(d);
                d._dragLastIdx = idx;

                placeholder
                    .attr("x", centerX - (itemWidth + 16) / 2)
                    .attr("y", baseY - (idx + 1) * itemHeight - 8)
                    .attr("opacity", 1);
            })
            .on("drag", function (event, d) {
                if (isPlayingRef.current) return;
                const absoluteY = event.y;
                d3.select(this).attr("transform", `translate(${centerX - itemWidth / 2}, ${absoluteY - itemHeight / 2})`);

                const dragIdx = Math.max(0, Math.min(data.length - 1, Math.round((baseY - absoluteY) / itemHeight) - 1));

                if (dragIdx !== d._dragLastIdx) {
                    d._dragLastIdx = dragIdx;

                    placeholder
                        .interrupt()
                        .transition().duration(150).ease(d3.easeCubicOut)
                        .attr("y", baseY - (dragIdx + 1) * itemHeight - 8);

                    // Magnetic sibling shift
                    const oldIdx = data.indexOf(d);
                    contentLayer.selectAll(".stack-box")
                        .filter(nd => nd.id !== d.id)
                        .each(function (ndData) {
                            const originalIdx = data.indexOf(ndData);
                            let targetIdx = originalIdx;
                            if (oldIdx < dragIdx && originalIdx > oldIdx && originalIdx <= dragIdx) targetIdx--;
                            else if (oldIdx > dragIdx && originalIdx < oldIdx && originalIdx >= dragIdx) targetIdx++;

                            d3.select(this)
                                .interrupt()
                                .transition().duration(250).ease(d3.easeCubicOut)
                                .attr("transform", `translate(${centerX - itemWidth / 2}, ${baseY - (targetIdx + 1) * itemHeight})`);
                        });
                }
            })
            .on("end", function (event, d) {
                if (isPlayingRef.current) return;
                d3.select(this).classed("dragging", false);
                placeholder.attr("opacity", 0);

                const oldIndex = data.indexOf(d);
                const absoluteY = event.y;
                const dragIdx = Math.round((baseY - absoluteY) / itemHeight) - 1;
                const finalIdx = Math.max(0, Math.min(data.length - 1, dragIdx));

                if (finalIdx !== oldIndex) {
                    pendingDrag.current = { oldIndex, newIndex: finalIdx };
                    const newData = [...step.stack];
                    const [moved] = newData.splice(oldIndex, 1);
                    newData.splice(finalIdx, 0, moved);
                    onUpdateDataRef.current(newData);
                } else {
                    contentLayer.selectAll(".stack-box")
                        .interrupt()
                        .transition().duration(200)
                        .attr("transform", (nd) => `translate(${centerX - itemWidth / 2}, ${baseY - (data.indexOf(nd) + 1) * itemHeight})`);
                }
            });

        // Items in Content Layer
        const boxes = contentLayer.selectAll(".stack-box")
            .data(data, d => d.id); // Stable ID

        boxes.join(
            enter => {
                const grp = enter.append("g")
                    .attr("class", "stack-box")
                    .attr("transform", (d, i) => `translate(${centerX}, ${baseY - (i + 1) * itemHeight + itemHeight / 2}) scale(0)`) // Start from center scaled 0
                    .attr("opacity", 0)
                    .on("dblclick", function (event, d) {
                        if (isPlayingRef.current) return;
                        const index = data.indexOf(d);
                        setEditingIndex(index);
                        setEditValue(d.val.toString());
                        setEditPos({ x: centerX, y: baseY - (index + 1) * itemHeight + itemHeight / 2 });
                    })
                    .call(drag);

                grp.append("rect")
                    .attr("width", itemWidth)
                    .attr("height", itemHeight - 5)
                    .attr("rx", 6)
                    .attr("fill", "url(#stack-gradient-default)")
                    .style("filter", "url(#stack-glow)");

                grp.append("text")
                    .attr("class", "stack-node-text")
                    .attr("x", itemWidth / 2)
                    .attr("y", itemHeight / 2)
                    .attr("dy", 5)
                    .attr("text-anchor", "middle")
                    .text(d => d.val);

                return grp.transition().duration(transitionDuration * 1.2)
                    .ease(d3.easeBackOut.overshoot(1.7))
                    .attr("opacity", 1)
                    .attr("transform", (d, i) => `translate(${centerX - itemWidth / 2}, ${baseY - (i + 1) * itemHeight}) scale(1)`);
            },
            update => {
                // Check highlight
                update.select("rect")
                    .transition().duration(transitionDuration)
                    .ease(d3.easeCubicOut)
                    .attr("fill", (d, i) => {
                        if (step.highlightIndex === i) return "url(#stack-gradient-highlight)";
                        if (step.newValue === d.val && i === data.length - 1) return "url(#stack-gradient-new)";
                        return "url(#stack-gradient-default)";
                    });

                update.select("text").text(d => d.val);

                return update
                    .on("dblclick", function (event, d) {
                        if (isPlayingRef.current) return;
                        const index = data.indexOf(d);
                        setEditingIndex(index);
                        setEditValue(d.val.toString());
                        setEditPos({ x: centerX, y: baseY - (index + 1) * itemHeight + itemHeight / 2 });
                    })
                    .call(drag)
                    .each(function (d) {
                        if (!d3.select(this).classed("dragging")) {
                            d3.select(this).transition().duration(transitionDuration)
                                .ease(d3.easeCubicOut)
                                .attr("transform", `translate(${centerX - itemWidth / 2}, ${baseY - (data.indexOf(d) + 1) * itemHeight})`);
                        }
                    });
            },
            exit => exit.transition().duration(transitionDuration * 0.8)
                .ease(d3.easeCubicIn)
                .attr("transform", (d, i) => `translate(${centerX}, ${baseY - (i + 1) * itemHeight + itemHeight / 2}) scale(0)`)
                .attr("opacity", 0)
                .remove()
        )
            .order(); // Anti-blinking and DOM stability

        // Arrows / Labels (in Content Layer or Interaction Layer? Content makes sense)
        const topIndicator = contentLayer.selectAll(".top-indicator").data(stack.length > 0 ? [stack.length - 1] : []);
        topIndicator.join(
            enter => enter.append("text")
                .attr("class", "top-indicator")
                .attr("font-size", "14px")
                .attr("text-anchor", "start")
                .text("← Top"),
            update => update,
            exit => exit.remove()
        )
            .transition().duration(transitionDuration)
            .ease(d3.easeCubicOut)
            .attr("x", centerX + itemWidth / 2 + 10)
            .attr("y", d => baseY - (d + 1) * itemHeight + itemHeight / 2 + 5);

    }, [step, speed, transitionDuration]); // REMOVED isPlaying, onUpdateData from deps to stop flickering

    return (
        <div ref={containerRef} className="stack-visualizer-container" style={{ position: 'relative', width: '100%', height: '100%' }}>
            <svg ref={svgRef} className="stack-svg" style={{ width: '100%', minHeight: '400px' }}></svg>
            {editingIndex !== null && (
                <input
                    autoFocus
                    className="stack-edit-input"
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
            <div className="stack-info">
                <div>Size: <strong>{step?.stack?.length || 0}</strong></div>
            </div>
        </div>
    );
});


export default StackVisualizer;
