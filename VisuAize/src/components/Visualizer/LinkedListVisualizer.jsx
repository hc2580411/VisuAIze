import React, { useEffect, useRef, useState, memo, useMemo } from "react";
import * as d3 from "d3";
import { debounce } from "../utils/helpers";
import "./LinkedListVisualizer.css";

const LinkedListVisualizer = memo(({ step, speed, onUpdateData, isPlaying, animationsEnabled = true }) => {
    const svgRef = useRef(null);
    const containerRef = useRef(null);
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const [editingIndex, setEditingIndex] = useState(null);
    const [editValue, setEditValue] = useState("");
    const [editPos, setEditPos] = useState({ x: 0, y: 0 });

    // Memoize so the value is referentially stable — prevents the D3 effect
    // from re-running just because transitionDuration was recomputed inline.
    const transitionDuration = useMemo(
        () => animationsEnabled ? (speed ? Math.min(speed * 0.8, 500) : 300) : 0,
        [speed, animationsEnabled]
    );

    // Stable ID Management & Performance Guards
    const itemsRef = useRef([]);
    const idCounter = useRef(0);
    const prevNodesRef = useRef(null);
    const pendingDragRef = useRef(null);
    const isDraggingRef = useRef(false);
    const prevNodeCountRef = useRef(-1);
    const prevContainerSizeRef = useRef({ w: 0, h: 0 });

    // Context Refs for D3 Handlers
    const onUpdateDataRef = useRef(onUpdateData);
    const isPlayingRef = useRef(isPlaying);
    onUpdateDataRef.current = onUpdateData;
    isPlayingRef.current = isPlaying;

    useEffect(() => {
        const debouncedResize = debounce(() => setWindowWidth(window.innerWidth), 200);
        window.addEventListener("resize", debouncedResize);
        return () => window.removeEventListener("resize", debouncedResize);
    }, []);

    const handleEditSubmit = (e) => {
        if (e.key === "Enter" || e.type === "blur") {
            if (editingIndex !== null) {
                const newValue = parseInt(editValue);
                if (!isNaN(newValue)) {
                    const newData = [...step.nodes];
                    newData[editingIndex] = newValue;
                    onUpdateDataRef.current(newData);
                }
                setEditingIndex(null);
            }
        } else if (e.key === "Escape") {
            setEditingIndex(null);
        }
    };

    // MOUNT-ONLY: Setup static SVG elements (Markers, Filters, Gradients)
    useEffect(() => {
        const svg = d3.select(svgRef.current);
        svg.selectAll("defs").remove();
        svg.selectAll(".main-group").remove();
        svg.selectAll(".interaction-layer").remove();

        const defs = svg.append("defs");

        const filter = defs.append("filter")
            .attr("id", "ll-glow-stable")
            .attr("x", "-50%").attr("y", "-50%")
            .attr("width", "200%").attr("height", "200%");
        filter.append("feGaussianBlur").attr("stdDeviation", "3.0").attr("result", "coloredBlur");
        const feMerge = filter.append("feMerge");
        feMerge.append("feMergeNode").attr("in", "coloredBlur");
        feMerge.append("feMergeNode").attr("in", "SourceGraphic");

        const createGradient = (id, color1, color2) => {
            const gradient = defs.append("linearGradient")
                .attr("id", id).attr("x1", "0%").attr("y1", "0%").attr("x2", "0%").attr("y2", "100%");
            gradient.append("stop").attr("offset", "0%").attr("stop-color", color1);
            gradient.append("stop").attr("offset", "100%").attr("stop-color", color2);
        };

        createGradient("ll-gradient-default", "#818cf8", "#6366f1");
        createGradient("ll-gradient-action", "#f472b6", "#ec4899");
        createGradient("ll-gradient-success", "#34d399", "#10b981");

        defs.append("marker")
            .attr("id", "arrowhead-ll-stable")
            .attr("viewBox", "0 -6 12 12")
            .attr("refX", 32).attr("refY", 0)
            .attr("markerWidth", 8).attr("markerHeight", 8)
            .attr("orient", "auto")
            .attr("markerUnits", "userSpaceOnUse")
            .append("path")
            .attr("d", "M0,-4 L10,0 L0,4")
            .attr("fill", "#94a3b8")
            .attr("stroke", "none");

        const g = svg.append("g").attr("class", "main-group");
        g.append("g").attr("class", "link-layer");
        g.append("g").attr("class", "node-layer");

        const interactionLayer = svg.append("g").attr("class", "interaction-layer");
        interactionLayer.append("rect")
            .attr("class", "drag-placeholder")
            .attr("width", 76).attr("height", 76).attr("rx", 16).attr("opacity", 0);

        return () => svg.selectAll("*").remove();
    }, []);

    // MAIN EFFECT: Sync D3 with State
    useEffect(() => {
        if (isDraggingRef.current) return;

        const svg = d3.select(svgRef.current);
        // Use a minimum height fallback — but also re-measure after a tick if 0
        const parentWidth = containerRef.current?.clientWidth || 800;
        const rawHeight = containerRef.current?.clientHeight || 0;
        const parentHeight = rawHeight > 50 ? rawHeight : 500;
        const centerY = parentHeight / 2;

        if (!step?.nodes || step.nodes.length === 0) {
            svg.selectAll(".empty-message").data([1]).join("text")
                .attr("class", "empty-message")
                .attr("x", parentWidth / 2).attr("y", centerY)
                .attr("text-anchor", "middle").text("Empty List");
            svg.select(".main-group").selectAll("g").selectAll("*").remove();
            return;
        }
        svg.selectAll(".empty-message").remove();

        const currentNodes = step.nodes;
        const isDataFresh = prevNodesRef.current !== currentNodes;

        let items = [...itemsRef.current];
        if (pendingDragRef.current) {
            if (isDataFresh) {
                const { oldIndex, newIndex } = pendingDragRef.current;
                if (items[oldIndex]) {
                    const [moved] = items.splice(oldIndex, 1);
                    items.splice(newIndex, 0, moved);
                }
                pendingDragRef.current = null;
            }
        }

        const reconciled = currentNodes.map((val, i) => {
            if (i < items.length) return { ...items[i], val };
            return { id: `node-stable-${idCounter.current++}`, val };
        });
        if (reconciled.length > currentNodes.length) reconciled.length = currentNodes.length;

        itemsRef.current = reconciled;
        prevNodesRef.current = currentNodes;
        const data = reconciled;

        const nodeSpacing = 120;
        const nodesWidth = (data.length - 1) * nodeSpacing;
        const startX = Math.max(50, (parentWidth - nodesWidth) / 2);
        const getX = (i) => i * nodeSpacing;

        svg.attr("width", Math.max(parentWidth, nodesWidth + 100)).attr("height", parentHeight);
        const g = svg.select(".main-group");

        // Only re-apply the group transform when the container size or node count
        // actually changes. Applying it on every step change (during animation)
        // causes unnecessary transitions and can interfere with drag positions.
        const sizeChanged =
            prevContainerSizeRef.current.w !== parentWidth ||
            prevContainerSizeRef.current.h !== parentHeight;
        const countChanged = prevNodeCountRef.current !== data.length;
        if (sizeChanged || countChanged) {
            prevContainerSizeRef.current = { w: parentWidth, h: parentHeight };
            prevNodeCountRef.current = data.length;
            g.transition().duration(transitionDuration)
                .attr("transform", `translate(${startX}, ${centerY})`);
        } else {
            // Ensure transform is set (no transition needed, just confirm it's right)
            g.attr("transform", `translate(${startX}, ${centerY})`);
        }

        const linkLayer = g.select(".link-layer");
        const nodeLayer = g.select(".node-layer");
        const placeholder = svg.select(".drag-placeholder");

        const drag = d3.drag()
            .on("start", function (event, d) {
                if (isPlayingRef.current) return;
                isDraggingRef.current = true;

                d3.select(this).classed("dragging", true).raise();

                const idx = data.findIndex(item => item.id === d.id);
                d._dragStartIdx = idx;
                d._dragLastIdx = idx;

                placeholder.attr("x", startX + getX(idx) - 38).attr("y", centerY - 38).attr("opacity", 1);
                linkLayer.transition().duration(150).attr("opacity", 0.1);
            })
            .on("drag", function (event, d) {
                if (isPlayingRef.current) return;

                const x = event.x;
                d3.select(this).attr("transform", `translate(${x}, 0)`);

                const dragIdx = Math.max(0, Math.min(data.length - 1, Math.round(x / nodeSpacing)));

                if (dragIdx !== d._dragLastIdx) {
                    d._dragLastIdx = dragIdx;
                    placeholder.interrupt().transition().duration(150).ease(d3.easeCubicOut)
                        .attr("x", startX + getX(dragIdx) - 38);

                    const movedNodeId = d.id;
                    const oldIdx = d._dragStartIdx;

                    nodeLayer.selectAll(".node-group").filter(n => n.id !== movedNodeId).each(function (n) {
                        const originalIdx = data.findIndex(item => item.id === n.id);
                        if (originalIdx === -1) return;

                        let targetIdx = originalIdx;
                        if (oldIdx < dragIdx && originalIdx > oldIdx && originalIdx <= dragIdx) targetIdx--;
                        else if (oldIdx > dragIdx && originalIdx < oldIdx && originalIdx >= dragIdx) targetIdx++;

                        d3.select(this).interrupt().transition().duration(250).ease(d3.easeCubicOut)
                            .attr("transform", `translate(${getX(targetIdx)}, 0)`);
                        d3.select(this).select(".idx-text").text(`i=${targetIdx}`);
                    });
                }
            })
            .on("end", function (event, d) {
                isDraggingRef.current = false;
                if (isPlayingRef.current) return;
                d3.select(this).classed("dragging", false);
                placeholder.attr("opacity", 0);
                linkLayer.attr("opacity", 1);

                const oldIndex = data.findIndex(item => item.id === d.id);
                const newIndex = d._dragLastIdx;

                if (newIndex !== oldIndex) {
                    pendingDragRef.current = { oldIndex, newIndex };
                    const newValues = [...step.nodes];
                    const [val] = newValues.splice(oldIndex, 1);
                    newValues.splice(newIndex, 0, val);
                    onUpdateDataRef.current(newValues);
                } else {
                    nodeLayer.selectAll(".node-group")
                        .transition().duration(200)
                        .attr("transform", (nd) => `translate(${getX(data.findIndex(item => item.id === nd.id))}, 0)`);
                    nodeLayer.selectAll(".node-group").each(function (nd) {
                        const ni = data.findIndex(item => item.id === nd.id);
                        d3.select(this).select(".idx-text").text(`i=${ni}`);
                    });
                }
            });

        // LINKS
        const linkData = d3.range(data.length - 1).map(i => ({ i }));
        linkLayer.selectAll(".link")
            .data(linkData, d => d.i)
            .join(
                enter => enter.append("line").attr("class", "link")
                    .attr("x1", d => getX(d.i)).attr("x2", d => getX(d.i + 1) - 25)
                    .attr("y1", 0).attr("y2", 0).attr("opacity", 0)
                    .call(e => e.transition().duration(600).attr("opacity", 1)),
                update => update.transition().duration(transitionDuration)
                    .attr("x1", d => getX(d.i)).attr("x2", d => getX(d.i + 1) - 25),
                exit => exit.remove()
            )
            .attr("marker-end", "url(#arrowhead-ll-stable)")
            .attr("stroke-width", 4)
            .attr("stroke", "#94a3b8");

        // NODES
        nodeLayer.selectAll(".node-group")
            .data(data, d => d.id)
            .join(
                enter => {
                    const nodeGroup = enter.append("g")
                        .attr("class", "node-group")
                        .attr("transform", (d, i) => `translate(${getX(i)}, 0) scale(0)`)
                        .on("dblclick", (e, d) => {
                            if (isPlayingRef.current) return;
                            e.stopPropagation();
                            // Use id-based lookup — data.indexOf(d) fails after reconciliation
                            // creates new object references
                            const idx = data.findIndex(item => item.id === d.id);
                            if (idx === -1) return;
                            // Read container dimensions fresh at click time
                            const cw = containerRef.current?.clientWidth || 800;
                            const ch = containerRef.current?.clientHeight || 500;
                            const cx = Math.max(50, (cw - (data.length - 1) * nodeSpacing) / 2);
                            const cy = ch / 2;
                            setEditingIndex(idx);
                            setEditValue(d.val.toString());
                            setEditPos({ x: cx + idx * nodeSpacing, y: cy });
                        })
                        .call(drag);

                    nodeGroup.append("circle").attr("r", 25)
                        .style("filter", "url(#ll-glow-stable)")
                        .attr("stroke-width", 2).attr("stroke", "white");
                    nodeGroup.append("text").attr("class", "val-text")
                        .attr("dy", 6).attr("text-anchor", "middle")
                        .style("font-weight", 700).style("fill", "white");
                    nodeGroup.append("text").attr("class", "idx-text")
                        .attr("dy", 45).attr("text-anchor", "middle")
                        .style("font-size", "12px").style("fill", "var(--text-secondary)");

                    return nodeGroup.transition().duration(transitionDuration)
                        .ease(d3.easeCubicOut)
                        .attr("transform", (d, i) => `translate(${getX(i)}, 0) scale(1)`);
                },
                update => update.each(function (d) {
                    const group = d3.select(this);
                    if (!group.classed("dragging")) {
                        // Use id-based lookup — data.indexOf(d) returns -1 because
                        // reconciled() creates new object references each render.
                        const idx = data.findIndex(item => item.id === d.id);
                        if (idx !== -1) {
                            group.transition().duration(transitionDuration)
                                .ease(d3.easeCubicOut)
                                .attr("transform", `translate(${getX(idx)}, 0) scale(1)`);
                        }
                    }
                }),
                exit => exit.transition().duration(transitionDuration)
                    .attr("transform", (d, i) => `translate(${getX(i)}, 0) scale(0)`)
                    .remove()
            )
            .order();

        // Node Content Sync
        nodeLayer.selectAll(".node-group").each(function (d) {
            const group = d3.select(this);
            // Use id-based lookup for same reason as update branch above
            const idx = data.findIndex(item => item.id === d.id);
            if (idx === -1) return;
            group.select("circle")
                .transition().duration(transitionDuration)
                .attr("fill", () => {
                    if (step.action === "insert" && idx === step.insertPosition) return "url(#ll-gradient-success)";
                    if (step.action === "delete" && idx === step.deletePosition) return "url(#ll-gradient-action)";
                    return "url(#ll-gradient-default)";
                })
                .attr("r", (step.action === "insert" || step.action === "delete") &&
                    (idx === step.insertPosition || idx === step.deletePosition) ? 30 : 25);

            group.select(".val-text").text(d.val);
            group.select(".idx-text").text(`i=${idx}`);
        });

    }, [step, windowWidth, transitionDuration]);

    return (
        <div ref={containerRef} className="linkedlist-visualizer-container" style={{ position: 'relative' }}>
            <svg ref={svgRef} className="linkedlist-svg"></svg>
            {editingIndex !== null && (
                <input autoFocus className="ll-edit-input"
                    style={{ left: editPos.x, top: editPos.y, transform: 'translate(-50%, -50%)' }}
                    type="number" value={editValue}
                    onBlur={handleEditSubmit}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={handleEditSubmit} />
            )}
        </div>
    );
});

LinkedListVisualizer.displayName = 'LinkedListVisualizer';
export default LinkedListVisualizer;
