import { useEffect, useRef, useState, useMemo, memo } from "react";
import * as d3 from "d3";
import "./HeapVisualizer.css";

const HeapVisualizer = memo(({ step, speed, onUpdateData, isPlaying, animationsEnabled = true }) => {
    const svgRef = useRef(null);
    const containerRef = useRef(null);
    const [editingIndex, setEditingIndex] = useState(null);
    const [editValue, setEditValue] = useState("");
    const [editPos, setEditPos] = useState({ x: 0, y: 0 });

    // Stable ID Management
    const itemsRef = useRef([]); // [{ id, val }]
    const idCounter = useRef(0);
    const pendingDrag = useRef(null);

    // Refs for stable callbacks
    const onUpdateDataRef = useRef(onUpdateData);
    const isPlayingRef = useRef(isPlaying);
    onUpdateDataRef.current = onUpdateData;
    isPlayingRef.current = isPlaying;

    // Zero out duration when animations are disabled
    const transitionDuration = useMemo(() =>
        animationsEnabled ? (speed ? Math.min(speed * 0.8, 500) : 300) : 0,
        [speed, animationsEnabled]);

    // Handle Edit Submission
    const handleEditSubmit = (e) => {
        if (e.key === "Enter" || e.type === "blur") {
            if (editingIndex !== null) {
                const newValue = parseInt(editValue);
                if (!isNaN(newValue)) {
                    const newData = [...step.heap];
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
            .attr("id", "heap-glow")
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
        createGradient("heap-gradient-default", "#a5b4fc", "#6366f1");
        createGradient("heap-gradient-highlight", "#f9a8d4", "#db2777");
        createGradient("heap-gradient-swap", "#6ee7b7", "#059669");
        createGradient("heap-gradient-root", "#fde047", "#f59e0b");

        // Create layers
        svg.append("g").attr("class", "connection-layer");
        svg.append("g").attr("class", "content-layer");
        svg.append("g").attr("class", "interaction-layer");

        return () => {
            svg.selectAll("*").remove();
        };
    }, []);

    useEffect(() => {
        const svg = d3.select(svgRef.current);
        const containerWidth = containerRef.current?.clientWidth || 800;
        const containerHeight = containerRef.current?.clientHeight || 400;
        const height = Math.max(containerHeight, 350);

        if (!step || !step.heap || step.heap.length === 0) {
            // Clear content layers but keep defs and layer structure
            svg.select(".connection-layer").selectAll("*").remove();
            svg.select(".content-layer").selectAll("*").remove();
            svg.select(".interaction-layer").selectAll("*").remove();
            svg.selectAll(".root-label").remove();
            svg.attr("width", containerWidth).attr("height", height);

            svg.selectAll(".empty-message").data([1])
                .join("text")
                .attr("class", "empty-message")
                .attr("x", containerWidth / 2)
                .attr("y", height / 2)
                .attr("text-anchor", "middle")
                .attr("font-size", "20px")
                .attr("fill", "var(--text-muted)")
                .text("Empty Heap");
            return;
        }

        svg.selectAll(".empty-message").remove();
        const currentHeap = step.heap;

        // Reconcile itemsRef for stable IDs
        let items = [...itemsRef.current];

        if (pendingDrag.current) {
            const { oldIndex, newIndex } = pendingDrag.current;
            if (items[oldIndex]) {
                const [moved] = items.splice(oldIndex, 1);
                items.splice(newIndex, 0, moved);
            }
            pendingDrag.current = null;
        } else {
            // Heuristic: if length differs, rebuild or simple map
            if (currentHeap.length !== items.length) {
                // Try to preserve known values
                items = currentHeap.map(v => ({ id: `heap-${idCounter.current++}`, val: v }));
            } else {
                // Update values in place
                items = items.map((it, i) => ({ ...it, val: currentHeap[i] }));
            }
        }

        // Fallback
        if (items.length !== currentHeap.length) {
            items = currentHeap.map(v => ({ id: `heap-${idCounter.current++}`, val: v }));
        }

        itemsRef.current = items;
        const data = items;

        svg.attr("width", containerWidth).attr("height", height);

        // Config
        const itemWidth = 55;
        const itemHeight = 55;
        const spacing = 12;
        const centerY = height / 2;
        const totalWidth = data.length * (itemWidth + spacing) - spacing;
        const startX = (containerWidth - totalWidth) / 2;

        // Get the pre-created layers
        const connectionLayer = svg.select(".connection-layer");
        const contentLayer = svg.select(".content-layer");
        const interactionLayer = svg.select(".interaction-layer");

        // Placeholder
        let placeholder = interactionLayer.select(".drag-placeholder");
        if (placeholder.empty()) {
            placeholder = interactionLayer.append("rect")
                .attr("class", "drag-placeholder")
                .attr("width", itemWidth + 12) // Slightly larger
                .attr("height", itemHeight + 12)
                .attr("rx", 10)
                .attr("opacity", 0);
        }
        placeholder.attr("width", itemWidth + 12).attr("height", itemHeight + 12);

        // --- Drag Behavior ---
        const drag = d3.drag()
            .on("start", function (event, d) {
                if (isPlayingRef.current) return;
                const node = d3.select(this);
                node.classed("dragging", true).raise();

                const idx = data.indexOf(d);
                d._dragLastIdx = idx;

                const curX = startX + idx * (itemWidth + spacing);
                const curY = centerY - itemHeight / 2;

                placeholder
                    .attr("x", curX - 6)
                    .attr("y", curY - 6)
                    .attr("opacity", 1);

                // Dim connections while dragging
                connectionLayer.transition().duration(200).attr("opacity", 0.2);
            })
            .on("drag", function (event, d) {
                if (isPlayingRef.current) return;

                // Wait, logic is: The GROUP is transformed. 
                // We should move the group.
                // But wait, the previous code moved `this` (the group).
                // Let's stick to moving the group absolutely.

                // Actually, let's use the mouse position relative to SVG to set transform
                // event.x is local if container is G?
                // d3.drag is attached to G.
                // To keep it simple:
                d3.select(this).attr("transform", `translate(${event.x - itemWidth / 2}, ${centerY - itemHeight / 2})`);

                // Calculate Drop Index
                // x relative to startX
                const currentX = event.x - itemWidth / 2;
                const dragIdx = Math.max(0, Math.min(data.length - 1, Math.round((currentX - startX) / (itemWidth + spacing))));

                if (dragIdx !== d._dragLastIdx) {
                    d._dragLastIdx = dragIdx;

                    placeholder
                        .interrupt()
                        .transition().duration(150).ease(d3.easeCubicOut)
                        .attr("x", startX + dragIdx * (itemWidth + spacing) - 6);

                    // Magnetic Shift
                    const oldIdx = data.indexOf(d);
                    contentLayer.selectAll(".heap-item-group")
                        .filter(nd => nd.id !== d.id)
                        .each(function (ndData) {
                            const originalIdx = data.indexOf(ndData);
                            let targetIdx = originalIdx;
                            if (oldIdx < dragIdx && originalIdx > oldIdx && originalIdx <= dragIdx) targetIdx--;
                            else if (oldIdx > dragIdx && originalIdx < oldIdx && originalIdx >= dragIdx) targetIdx++;

                            d3.select(this)
                                .interrupt()
                                .transition().duration(250).ease(d3.easeCubicOut)
                                .attr("transform", `translate(${startX + targetIdx * (itemWidth + spacing)}, ${centerY - itemHeight / 2})`);
                        });
                }
            })
            .on("end", function (event, d) {
                if (isPlayingRef.current) return;
                d3.select(this).classed("dragging", false);
                placeholder.attr("opacity", 0);
                connectionLayer.transition().duration(200).attr("opacity", 1);

                const oldIndex = data.indexOf(d);
                const currentX = event.x - itemWidth / 2;
                const newIndex = Math.max(0, Math.min(data.length - 1, Math.round((currentX - startX) / (itemWidth + spacing))));

                if (newIndex !== oldIndex) {
                    pendingDrag.current = { oldIndex, newIndex };
                    const newData = [...step.heap];
                    // Heap swap logic: Do we Swap or Insert?
                    // Previous HeapVisualizer swapped values: [newData[oldIndex], newData[newIndex]] = ...
                    // All other visualizers (Array, Queue) did Insertion (Move).
                    // Array visualizer actually did SWAP in the code I read (`[newData[oldIndex], newData[newIndex]] = ...`).
                    // Wait, let me check ArrayVisualizer... it had `[newData[oldIndex], newData[newIndex]] = ...` in `end`.
                    // BUT Linked List / Queue did splice (Move).
                    // For a Heap (Array based), SWAP is usually more consistent with "swapping elements".
                    // However, dragging "between" slots usually implies insertion.
                    // Given the "Magnetic" look, insertion/reorder feels more natural visually.
                    // If I drag idx 0 to idx 4, do I want 0 and 4 to swap? Or 0 to slide into 4 and 1,2,3 shift left?
                    // Magnetic shift implies insertion/shift.
                    // So I will use SPLICE (Move) to match the visual feedback.

                    const [moved] = newData.splice(oldIndex, 1);
                    newData.splice(newIndex, 0, moved);
                    onUpdateDataRef.current(newData);
                } else {
                    // Reset
                    contentLayer.selectAll(".heap-item-group")
                        .interrupt()
                        .transition().duration(200)
                        .attr("transform", nd => `translate(${startX + data.indexOf(nd) * (itemWidth + spacing)}, ${centerY - itemHeight / 2})`);
                }
            });

        // --- Render Items ---
        const itemsSelection = contentLayer.selectAll(".heap-item-group")
            .data(data, d => d.id);

        itemsSelection.join(
            enter => {
                const grp = enter.append("g")
                    .attr("class", "heap-item-group")
                    .attr("transform", (d, i) => `translate(${startX + i * (itemWidth + spacing) + itemWidth / 2}, ${centerY}) scale(0)`)
                    .attr("opacity", 0)
                    .on("dblclick", function (event, d) {
                        if (isPlayingRef.current) return;
                        const index = data.indexOf(d);
                        setEditingIndex(index);
                        setEditValue(d.val.toString());
                        setEditPos({ x: startX + index * (itemWidth + spacing) + itemWidth / 2, y: centerY });
                    })
                    .call(drag);

                grp.append("rect")
                    .attr("width", itemWidth)
                    .attr("height", itemHeight)
                    .attr("rx", 10)
                    .attr("fill", (d, i) => i === 0 ? "url(#heap-gradient-root)" : "url(#heap-gradient-default)")
                    .style("filter", "url(#heap-glow)");

                grp.append("text")
                    .attr("class", "heap-node-text")
                    .attr("x", itemWidth / 2)
                    .attr("y", itemHeight / 2)
                    .attr("dy", 5)
                    .attr("text-anchor", "middle")
                    .attr("font-size", "18px")
                    .text(d => d.val);

                grp.append("text")
                    .attr("class", "idx-text")
                    .attr("x", itemWidth / 2)
                    .attr("y", itemHeight + 18)
                    .attr("text-anchor", "middle")
                    .attr("font-size", "12px")
                    .text((d, i) => i); // Index needs to be dynamic if we didn't track it in `d`. Use index from enter? No, static d.id.
                // Actually, for d3 join, `i` is the index in the selection. Reordering updates `i`.

                // Correction: In `.join`, `i` might not update on reorder automatically unless we merge?
                // We'll update text in `update`.

                return grp.transition().duration(transitionDuration * 1.5)
                    .ease(d3.easeElasticOut.amplitude(1).period(0.6))
                    .attr("opacity", 1)
                    .attr("transform", (d, i) => `translate(${startX + i * (itemWidth + spacing)}, ${centerY - itemHeight / 2}) scale(1)`);
            },
            update => {
                update.select("rect")
                    .transition().duration(transitionDuration)
                    .ease(d3.easeCubicOut)
                    .attr("fill", (d) => {
                        const idx = data.indexOf(d);
                        if (step.swapIndices?.includes(idx)) return "url(#heap-gradient-swap)";
                        if (step.compareIndices?.includes(idx)) return "url(#heap-gradient-highlight)";
                        if (step.highlightIndex === idx) return "url(#heap-gradient-highlight)";
                        if (idx === 0) return "url(#heap-gradient-root)";
                        return "url(#heap-gradient-default)";
                    });

                update.select(".heap-node-text").text(d => d.val);
                update.select(".idx-text").text(d => data.indexOf(d));

                return update
                    .on("dblclick", function (event, d) {
                        if (isPlayingRef.current) return;
                        const index = data.indexOf(d);
                        setEditingIndex(index);
                        setEditValue(d.val.toString());
                        setEditPos({ x: startX + index * (itemWidth + spacing) + itemWidth / 2, y: centerY });
                    })
                    .call(drag)
                    .each(function (d) {
                        if (!d3.select(this).classed("dragging")) {
                            d3.select(this).transition().duration(transitionDuration)
                                .ease(d3.easeCubicOut)
                                .attr("transform", `translate(${startX + data.indexOf(d) * (itemWidth + spacing)}, ${centerY - itemHeight / 2})`);
                        }
                    });
            },
            exit => exit.transition().duration(transitionDuration * 0.8)
                .ease(d3.easeBackIn)
                .attr("transform", (d, i) => `translate(${startX + i * (itemWidth + spacing) + itemWidth / 2}, ${centerY}) scale(0)`)
                .attr("opacity", 0)
                .remove()
        ).order();

        interactionLayer.raise();

        // --- Render Connections ---
        // Lines rely on INDICES.
        const lines = [];
        for (let i = 0; i < data.length; i++) {
            const left = 2 * i + 1;
            const right = 2 * i + 2;
            if (left < data.length) lines.push({ parent: i, child: left });
            if (right < data.length) lines.push({ parent: i, child: right });
        }

        connectionLayer.selectAll("path")
            .data(lines, d => `${d.parent}-${d.child}`)
            .join(
                enter => enter.append("path")
                    .attr("fill", "none")
                    .attr("stroke", "var(--border-color)")
                    .attr("stroke-width", 3)
                    .attr("opacity", 0)
                    .attr("d", d => {
                        const parentX = startX + d.parent * (itemWidth + spacing) + itemWidth / 2;
                        const childX = startX + d.child * (itemWidth + spacing) + itemWidth / 2;
                        const y1 = centerY - itemHeight / 2 - 5;
                        const y2 = centerY - itemHeight / 2 - 25;
                        return `M ${parentX} ${y1} Q ${(parentX + childX) / 2} ${y2} ${childX} ${y1}`;
                    })
                    .call(enter => enter.transition().duration(transitionDuration).attr("opacity", 0.6)),
                update => update.transition().duration(transitionDuration)
                    .attr("d", d => {
                        const parentX = startX + d.parent * (itemWidth + spacing) + itemWidth / 2;
                        const childX = startX + d.child * (itemWidth + spacing) + itemWidth / 2;
                        const y1 = centerY - itemHeight / 2 - 5;
                        const y2 = centerY - itemHeight / 2 - 25;
                        return `M ${parentX} ${y1} Q ${(parentX + childX) / 2} ${y2} ${childX} ${y1}`;
                    }),
                exit => exit.transition().duration(transitionDuration).attr("opacity", 0).remove()
            );

        // Root Label
        svg.selectAll(".root-label").data(data.length > 0 ? [0] : [])
            .join("text")
            .attr("class", "root-label")
            .attr("fill", "#f59e0b")
            .attr("font-size", "12px")
            .attr("font-weight", "600")
            .attr("text-anchor", "middle")
            .text("Root (Max)")
            .transition().duration(transitionDuration)
            .attr("x", startX + itemWidth / 2)
            .attr("y", centerY - itemHeight / 2 - 35);

    }, [step, speed, transitionDuration]); // safe deps

    return (
        <div ref={containerRef} className="heap-visualizer-container" style={{ position: 'relative' }}>
            <svg ref={svgRef} className="heap-svg" style={{ width: '100%', height: '100%' }}></svg>
            {editingIndex !== null && (
                <input
                    autoFocus
                    className="heap-edit-input"
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

export default HeapVisualizer;
