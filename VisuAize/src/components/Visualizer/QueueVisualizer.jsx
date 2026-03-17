import { useEffect, useRef, useState, memo } from "react";
import * as d3 from "d3";
import "./QueueVisualizer.css";

const QueueVisualizer = memo(({ step, speed, onUpdateData, isPlaying, animationsEnabled = true }) => {
    const svgRef = useRef(null);
    const containerRef = useRef(null);
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


    // Zero out duration when animations are disabled
    const transitionDuration = animationsEnabled ? (speed ? Math.min(speed * 0.8, 500) : 300) : 0;

    // Initialize SVG structure with defs/gradients ONCE on mount
    useEffect(() => {
        const svg = d3.select(svgRef.current);

        // Clear any existing content
        svg.selectAll("*").remove();

        // Create defs with filters and gradients
        const defs = svg.append("defs");

        // Glow Filter
        const filter = defs.append("filter")
            .attr("id", "queue-glow")
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
        createGradient("queue-gradient-default", "#818cf8", "#6366f1");
        createGradient("queue-gradient-highlight", "#f472b6", "#ec4899");
        createGradient("queue-gradient-new", "#34d399", "#10b981");

        // Create layers
        svg.append("g").attr("class", "queue-group");
        svg.append("g").attr("class", "interaction-layer-g");

        return () => {
            svg.selectAll("*").remove();
        };
    }, []);

    // Handle Edit Submission
    const handleEditSubmit = (e) => {
        if (e.key === "Enter" || e.type === "blur") {
            if (editingIndex !== null) {
                const newValue = parseInt(editValue);
                if (!isNaN(newValue)) {
                    const newData = [...step.queue];
                    newData[editingIndex] = newValue;
                    onUpdateData(newData);
                }
                setEditingIndex(null);
            }
        } else if (e.key === "Escape") {
            setEditingIndex(null);
        }
    };

    useEffect(() => {
        const svg = d3.select(svgRef.current);
        const containerWidth = containerRef.current?.clientWidth || 800;
        const containerHeight = containerRef.current?.clientHeight || 400;
        const height = Math.max(containerHeight, 350);

        if (!step || !step.queue || step.queue.length === 0) {
            // Clear the queue items but keep the group structure
            svg.select(".queue-group").selectAll("*").remove();
            svg.attr("width", containerWidth).attr("height", height);

            svg.selectAll(".empty-message").data([1])
                .join("text")
                .attr("class", "empty-message")
                .attr("x", containerWidth / 2)
                .attr("y", height / 2)
                .attr("text-anchor", "middle")
                .attr("font-size", "20px")
                .attr("fill", "var(--text-muted)")
                .text("Empty Queue");
            return;
        }

        svg.selectAll(".empty-message").remove();
        svg.selectAll(".empty-message").remove();

        // Reconcile itemsRef
        const currentQueue = step.queue;
        let items = [...itemsRef.current];

        if (pendingDrag.current) {
            const { oldIndex, newIndex } = pendingDrag.current;
            if (items[oldIndex]) {
                const [moved] = items.splice(oldIndex, 1);
                items.splice(newIndex, 0, moved);
            }
            pendingDrag.current = null;
        } else {
            // Smart Reconciliation based on Action
            if (step.action === 'enqueue') {
                // Enqueue: Old items should match currentQueue prefix
                // New item is at the end
                const newItems = [];
                for (let i = 0; i < items.length; i++) {
                    // Try to match existing items
                    if (i < currentQueue.length && items[i].val === currentQueue[i]) {
                        newItems.push(items[i]);
                    } else {
                        // Deviation? Just rebuild or break? 
                        // If values don't match, trust currentQueue? 
                        // But for enqueue, they typically match.
                        newItems.push({ id: `queue-${idCounter.current++}`, val: currentQueue[i] });
                    }
                }
                // Add remaining from currentQueue (should be the new tail)
                for (let i = items.length; i < currentQueue.length; i++) {
                    newItems.push({ id: `queue-${idCounter.current++}`, val: currentQueue[i] });
                }
                items = newItems;

            } else if (step.action === 'dequeue') {
                // Dequeue: The first item of OLD items is gone.
                // The rest of OLD items (starting index 1) should match currentQueue (starting index 0)
                const newItems = [];
                let offset = 1; // Skip the first old item

                for (let i = 0; i < currentQueue.length; i++) {
                    // items[i + offset] corresponds to currentQueue[i]
                    if (i + offset < items.length && items[i + offset].val === currentQueue[i]) {
                        newItems.push(items[i + offset]);
                    } else {
                        // Value mismatch or run out of old items? New ID.
                        newItems.push({ id: `queue-${idCounter.current++}`, val: currentQueue[i] });
                    }
                }
                items = newItems;

            } else {
                // Fallback Logic (Reset, init, or complex edit)
                if (currentQueue.length !== items.length) {
                    // Length Mismatch without clear action: Regen or simplistic diff
                    // Simplest robust way: Map by index if values match, else new ID
                    const newItems = [];
                    for (let i = 0; i < currentQueue.length; i++) {
                        if (i < items.length && items[i].val === currentQueue[i]) {
                            newItems.push(items[i]);
                        } else {
                            newItems.push({ id: `queue-${idCounter.current++}`, val: currentQueue[i] });
                        }
                    }
                    items = newItems;
                } else {
                    // Same length, update values in place (e.g. edit)
                    items = items.map((it, i) => ({ ...it, val: currentQueue[i] }));
                }
            }
        }

        if (items.length !== currentQueue.length) {
            items = currentQueue.map(v => ({ id: `queue-${idCounter.current++}`, val: v }));
        }

        itemsRef.current = items;

        svg.attr("width", containerWidth).attr("height", height);

        const itemWidth = 60;
        const itemHeight = 60;
        const spacing = 10;
        const data = items;
        const totalW = data.length * (itemWidth + spacing);
        const startX = (containerWidth - totalW) / 2;
        const centerY = height / 2;

        // Queue Group (Content Layer) has the transform
        const contentLayer = svg.selectAll(".queue-group").data([1]).join("g")
            .attr("class", "queue-group");

        contentLayer.transition().duration(transitionDuration)
            .attr("transform", `translate(${startX}, ${centerY - itemHeight / 2})`);

        // Interaction Layer (Always Top, No Transform)
        const interactionLayer = svg.selectAll(".interaction-layer-g").data([1]).join("g").attr("class", "interaction-layer-g");

        // Placeholder in Interaction Layer
        let placeholder = interactionLayer.select(".drag-placeholder");
        if (placeholder.empty()) {
            placeholder = interactionLayer.append("rect")
                .attr("class", "drag-placeholder")
                .attr("width", 50)
                .attr("height", 80)
                .attr("rx", 8)
                .attr("opacity", 0);
        }
        // Ensure dimensions
        placeholder.attr("width", 50).attr("height", 80);

        // Drag Behavior
        const drag = d3.drag()
            .on("start", function (event, d) {
                if (isPlayingRef.current) return;
                const node = d3.select(this);
                node.classed("dragging", true).raise();

                const idx = data.findIndex(item => item.id === d.id);
                d._dragLastIdx = idx;

                // Placeholder position is absolute on SVG, so it needs contentLayer's transform applied
                placeholder
                    .attr("x", startX + idx * (itemWidth + spacing) - 8)
                    .attr("y", centerY - itemHeight / 2 - 8)
                    .attr("opacity", 1);
            })
            .on("drag", function (event, d) {
                if (isPlayingRef.current) return;
                const relativeX = event.x;
                d3.select(this).attr("transform", `translate(${relativeX}, 0)`);

                const dragIdx = Math.max(0, Math.min(data.length - 1, Math.round(relativeX / (itemWidth + spacing))));

                if (dragIdx !== d._dragLastIdx) {
                    d._dragLastIdx = dragIdx;

                    placeholder
                        .interrupt()
                        .transition().duration(150).ease(d3.easeCubicOut)
                        .attr("x", startX + dragIdx * (itemWidth + spacing) - 8);

                    // Magnetic sibling shift
                    const oldIdx = data.findIndex(item => item.id === d.id);
                    contentLayer.selectAll(".queue-item")
                        .filter(nd => nd.id !== d.id)
                        .each(function (ndData) {
                            const originalIdx = data.findIndex(item => item.id === ndData.id);
                            let targetIdx = originalIdx;
                            if (oldIdx < dragIdx && originalIdx > oldIdx && originalIdx <= dragIdx) targetIdx--;
                            else if (oldIdx > dragIdx && originalIdx < oldIdx && originalIdx >= dragIdx) targetIdx++;

                            d3.select(this)
                                .interrupt()
                                .transition().duration(250).ease(d3.easeCubicOut)
                                .attr("transform", `translate(${targetIdx * (itemWidth + spacing)}, 0)`);
                        });
                }
            })
            .on("end", function (event, d) {
                if (isPlayingRef.current) return;
                d3.select(this).classed("dragging", false);
                placeholder.attr("opacity", 0);

                const oldIndex = data.indexOf(d);
                const newIndex = Math.round(event.x / (itemWidth + spacing));
                const finalIdx = Math.max(0, Math.min(data.length - 1, newIndex));

                if (finalIdx !== oldIndex) {
                    pendingDrag.current = { oldIndex, newIndex: finalIdx };
                    const newData = [...step.queue];
                    const [moved] = newData.splice(oldIndex, 1);
                    newData.splice(finalIdx, 0, moved);
                    onUpdateDataRef.current(newData);
                } else {
                    contentLayer.selectAll(".queue-item")
                        .interrupt()
                        .transition().duration(200)
                        .attr("transform", (nd) => {
                            const pos = data.findIndex(item => item.id === nd.id);
                            return `translate(${pos * (itemWidth + spacing)}, 0)`;
                        });
                }
            });

        const queueItems = contentLayer.selectAll(".queue-item")
            .data(data, d => d.id); // Stable ID

        // Queue Items Join
        queueItems.join(
            enter => {
                const grp = enter.append("g")
                    .attr("class", "queue-item")
                    .attr("transform", (d, i) => `translate(${i * (itemWidth + spacing) + itemWidth / 2}, ${itemHeight / 2}) scale(0)`)
                    .attr("opacity", 0)
                    .on("dblclick", function (event, d) {
                        if (isPlayingRef.current) return;
                        const index = data.findIndex(item => item.id === d.id);
                        setEditingIndex(index);
                        setEditValue(d.val.toString());
                        setEditPos({ x: startX + index * (itemWidth + spacing) + itemWidth / 2, y: centerY });
                    })
                    .call(drag);

                grp.append("rect")
                    .attr("width", itemWidth)
                    .attr("height", itemHeight)
                    .attr("rx", 8)
                    .attr("fill", "url(#queue-gradient-default)")
                    .style("filter", "url(#queue-glow)");

                grp.append("text")
                    .attr("class", "queue-node-text")
                    .attr("x", itemWidth / 2)
                    .attr("y", itemHeight / 2)
                    .attr("dy", 5)
                    .attr("text-anchor", "middle")
                    .attr("font-size", "18px")
                    .text(d => d.val);

                return grp.transition().duration(transitionDuration * 1.2)
                    .ease(d3.easeBackOut.overshoot(1.7))
                    .attr("opacity", 1)
                    .attr("transform", (d, i) => `translate(${i * (itemWidth + spacing)}, 0) scale(1)`);
            },
            update => {
                update.select("rect")
                    .transition().duration(transitionDuration)
                    .ease(d3.easeCubicOut)
                    .attr("fill", (d) => {
                        // Use id-based position — 'i' here is the update-selection index,
                        // not the datum's position in data[], so it's wrong after a dequeue.
                        const pos = data.findIndex(item => item.id === d.id);
                        if (step.highlightIndex === pos) return "url(#queue-gradient-highlight)";
                        if (step.action === 'enqueue' && pos === data.length - 1) return "url(#queue-gradient-new)";
                        return "url(#queue-gradient-default)";
                    });

                update.select("text").text(d => d.val);

                return update
                    .on("dblclick", function (event, d) {
                        if (isPlayingRef.current) return;
                        const index = data.findIndex(item => item.id === d.id);
                        setEditingIndex(index);
                        setEditValue(d.val.toString());
                        setEditPos({ x: startX + index * (itemWidth + spacing) + itemWidth / 2, y: centerY });
                    })
                    .call(drag)
                    .each(function (d) {
                        if (!d3.select(this).classed("dragging")) {
                            const pos = data.findIndex(item => item.id === d.id);
                            if (pos !== -1) {
                                d3.select(this).transition().duration(transitionDuration)
                                    .ease(d3.easeCubicOut)
                                    .attr("transform", `translate(${pos * (spacing + itemWidth)}, 0)`);
                            }
                        }
                    });
            },
            exit => exit.transition().duration(transitionDuration)
                .ease(d3.easeCubicIn)
                .attr("opacity", 0)
                .remove()
        )
            .order(); // Anti-blinking and z-index stability

        // FINAL STEP: Raise interaction layer
        interactionLayer.raise();

    }, [step, speed, transitionDuration]);

    return (
        <div ref={containerRef} className="queue-visualizer-container" style={{ position: 'relative', width: '100%', height: '100%' }}>
            <svg ref={svgRef} className="queue-svg" style={{ width: '100%', minHeight: '400px' }}></svg>
            {editingIndex !== null && (
                <input
                    autoFocus
                    className="queue-edit-input"
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

export default QueueVisualizer;
