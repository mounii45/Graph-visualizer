import { useState, useRef, useCallback, useEffect } from "react";
import "./App.css";

// ── import your algorithm files ──────────────────────────────────────────────
import runDijkstra    from "./algorithms/dijkstras";
import runBellmanFord from "./algorithms/bellmanford";
import runPrim        from "./algorithms/prims";
import runKruskal     from "./algorithms/kruskal";

// ── constants ────────────────────────────────────────────────────────────────
const ALGOS = ["Dijkstra", "Bellman-Ford", "Prim", "Kruskal"];
const NODE_R = 22;

const DEFAULT_NODES = [
  { id: 0, x: 300, y: 80,  label: "A" },
  { id: 1, x: 150, y: 200, label: "B" },
  { id: 2, x: 450, y: 200, label: "C" },
  { id: 3, x: 80,  y: 340, label: "D" },
  { id: 4, x: 260, y: 340, label: "E" },
  { id: 5, x: 420, y: 340, label: "F" },
  { id: 6, x: 560, y: 200, label: "G" },
];

const DEFAULT_EDGES = [
  { from: 0, to: 1, weight: 4 },
  { from: 0, to: 2, weight: 2 },
  { from: 1, to: 3, weight: 5 },
  { from: 1, to: 4, weight: 1 },
  { from: 2, to: 4, weight: 8 },
  { from: 2, to: 5, weight: 3 },
  { from: 2, to: 6, weight: 7 },
  { from: 3, to: 4, weight: 2 },
  { from: 4, to: 5, weight: 6 },
  { from: 5, to: 6, weight: 4 },
];

// CSS variable values (mirrors :root in App.css)
const C = {
  edge:       "var(--edge)",
  nodeStroke: "var(--node-stroke)",
  visited:    "var(--visited)",
  inQueue:    "var(--in-queue)",
  finalPath:  "var(--final-path)",
  mstEdge:    "var(--mst-edge)",
  startNode:  "var(--start-node)",
  highlight:  "var(--highlight)",
  green:      "var(--green)",
  red:        "var(--red)",
  node:       "var(--node)",
  nodeText:   "var(--node-text)",
};

// ── color helpers ─────────────────────────────────────────────────────────────
function edgeKey(e)    { return `${e.from}-${e.to}`; }
function edgeKeyRev(e) { return `${e.to}-${e.from}`; }

function getEdgeColor(e, step, algo) {
  if (!step) return C.edge;
  const isMST = algo === "Prim" || algo === "Kruskal";

  if (isMST) {
    const mstEdges = step.mstEdges || new Set();
    if (mstEdges.has(edgeKey(e)) || mstEdges.has(edgeKeyRev(e))) return C.mstEdge;
    if (step.edge) {
      const match = edgeKey(step.edge) === edgeKey(e) || edgeKeyRev(step.edge) === edgeKey(e);
      if (match) return step.type === "skip" ? C.red : C.inQueue;
    }
    return C.edge;
  }

  const treeEdges = step.treeEdges || new Set();
  if (treeEdges.has(edgeKey(e)) || treeEdges.has(edgeKeyRev(e))) return C.finalPath;
  if (step.edge) {
    const match = edgeKey(step.edge) === edgeKey(e) || edgeKeyRev(step.edge) === edgeKey(e);
    if (match) return C.inQueue;
  }
  return C.edge;
}

function getNodeColor(node, step, algo, startId) {
  if (node.id === startId) return C.startNode;
  if (!step) return C.node;
  const isMST = algo === "Prim" || algo === "Kruskal";

  if (isMST) {
    const inMST = step.inMST || new Set();
    return inMST.has(node.id) ? C.visited : C.node;
  }

  const visited = step.visited || new Set();
  if (visited.has(node.id)) return C.visited;
  if (step.edge && (step.edge.to === node.id || step.edge.from === node.id)) return C.inQueue;
  return C.node;
}

// ── main component ────────────────────────────────────────────────────────────
export default function App() {
  const [algo, setAlgo]               = useState("Dijkstra");
  const [nodes, setNodes]             = useState(DEFAULT_NODES);
  const [edges, setEdges]             = useState(DEFAULT_EDGES);
  const [startId, setStartId]         = useState(0);
  const [steps, setSteps]             = useState([]);
  const [stepIdx, setStepIdx]         = useState(-1);
  const [playing, setPlaying]         = useState(false);
  const [speed, setSpeed]             = useState(700);
  const [dragging, setDragging]       = useState(null);
  const [addEdgeMode, setAddEdgeMode] = useState(false);
  const [edgeSrc, setEdgeSrc]         = useState(null);
  const [newEdgeWeight, setNewEdgeWeight] = useState(3);
  const [log, setLog]                 = useState([]);
  const svgRef  = useRef(null);
  const playRef = useRef(null);

  const isMST = algo === "Prim" || algo === "Kruskal";
  const currentStep = stepIdx >= 0 && steps.length > 0
    ? steps[Math.min(stepIdx, steps.length - 1)]
    : null;

  // ── generate steps ──────────────────────────────────────────────────────────
  const generate = useCallback(() => {
    let s = [];
    if (algo === "Dijkstra")      s = runDijkstra(nodes, edges, startId);
    else if (algo === "Bellman-Ford") s = runBellmanFord(nodes, edges, startId);
    else if (algo === "Prim")     s = runPrim(nodes, edges, startId);
    else if (algo === "Kruskal")  s = runKruskal(nodes, edges, startId);
    setSteps(s);
    setStepIdx(-1);
    setLog([]);
  }, [algo, nodes, edges, startId]);

  useEffect(() => { generate(); }, [algo, startId]);

  // ── playback ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!playing) { clearInterval(playRef.current); return; }
    playRef.current = setInterval(() => {
      setStepIdx((i) => {
        const next = i + 1;
        if (next >= steps.length) { setPlaying(false); return steps.length - 1; }
        setLog((l) => [...l.slice(-30), steps[next]?.message || ""]);
        return next;
      });
    }, speed);
    return () => clearInterval(playRef.current);
  }, [playing, steps, speed]);

  const handlePlay = () => {
    if (steps.length === 0) generate();
    if (stepIdx >= steps.length - 1) { setStepIdx(-1); setLog([]); }
    setPlaying((p) => !p);
  };

  const handleStep = (dir) => {
    setPlaying(false);
    setStepIdx((i) => {
      const next = Math.max(-1, Math.min(steps.length - 1, i + dir));
      if (steps[next]) setLog((l) => [...l.slice(-30), steps[next].message]);
      return next;
    });
  };

  const handleReset = () => { setPlaying(false); setStepIdx(-1); setLog([]); };

  // ── node drag ───────────────────────────────────────────────────────────────
  const onNodeMouseDown = (e, id) => {
    if (addEdgeMode) return;
    e.stopPropagation();
    setDragging(id);
  };

  useEffect(() => {
    const onMove = (e) => {
      if (dragging === null) return;
      const rect = svgRef.current.getBoundingClientRect();
      setNodes((ns) => ns.map((n) =>
        n.id === dragging ? { ...n, x: e.clientX - rect.left, y: e.clientY - rect.top } : n
      ));
    };
    const onUp = () => setDragging(null);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [dragging]);

  // ── add node on canvas click ────────────────────────────────────────────────
  const handleSvgClick = (e) => {
    if (dragging !== null || addEdgeMode) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    const newId = nodes.length ? Math.max(...nodes.map((n) => n.id)) + 1 : 0;
    const lbl = String.fromCharCode(65 + (newId % 26));
    setNodes((ns) => [...ns, { id: newId, x, y, label: lbl }]);
  };

  // ── add edge: click two nodes ───────────────────────────────────────────────
  const handleNodeClickEdge = (e, id) => {
    if (!addEdgeMode) return;
    e.stopPropagation();
    if (edgeSrc === null) { setEdgeSrc(id); return; }
    if (edgeSrc !== id && !edges.find((ed) =>
      (ed.from === edgeSrc && ed.to === id) || (ed.from === id && ed.to === edgeSrc)
    )) {
      setEdges((es) => [...es, { from: edgeSrc, to: id, weight: newEdgeWeight }]);
    }
    setEdgeSrc(null);
  };

  const removeNode = (id) => {
    setNodes((ns) => ns.filter((n) => n.id !== id));
    setEdges((es) => es.filter((e) => e.from !== id && e.to !== id));
  };

  const removeEdge = (idx) => setEdges((es) => es.filter((_, i) => i !== idx));

  // ── render ──────────────────────────────────────────────────────────────────
  return (
    <div className="app">
      {/* ── header ── */}
      <div className="header">
        <span className="header-title">Graph Visualizer</span>
        <div className="algo-tabs">
          {ALGOS.map((a) => (
            <button
              key={a}
              className={`algo-tab ${algo === a ? "active" : ""}`}
              onClick={() => { setAlgo(a); setPlaying(false); }}
            >
              {a}
            </button>
          ))}
        </div>
        <div className="header-meta">
          {isMST ? "Minimum Spanning Tree" : "Single Source Shortest Path"}
          &nbsp;·&nbsp;{nodes.length} nodes · {edges.length} edges
        </div>
      </div>

      <div className="main">
        {/* ── canvas ── */}
        <div className="canvas-area">
          <svg
            ref={svgRef}
            className={`canvas-svg ${addEdgeMode ? "edge-mode" : ""}`}
            onClick={handleSvgClick}
          >
            {/* edges */}
            {edges.map((e, i) => {
              const fn = nodes.find((n) => n.id === e.from);
              const tn = nodes.find((n) => n.id === e.to);
              if (!fn || !tn) return null;
              const dx = tn.x - fn.x, dy = tn.y - fn.y;
              const len = Math.sqrt(dx * dx + dy * dy) || 1;
              const x1 = fn.x + (dx / len) * NODE_R, y1 = fn.y + (dy / len) * NODE_R;
              const x2 = tn.x - (dx / len) * NODE_R, y2 = tn.y - (dy / len) * NODE_R;
              const col = getEdgeColor(e, currentStep, algo);
              const thick = col !== C.edge ? 3 : 1.5;
              return (
                <g key={i}>
                  <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={col} strokeWidth={thick} opacity={0.85} />
                  <text x={(x1+x2)/2} y={(y1+y2)/2 - 5} textAnchor="middle"
                    fill={col !== C.edge ? col : "var(--edge-text)"} fontSize={11}
                    style={{ userSelect: "none" }}>
                    {e.weight}
                  </text>
                  {/* invisible wide hit area for delete */}
                  <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="transparent" strokeWidth={14}
                    style={{ cursor: "pointer" }}
                    onClick={(ev) => { ev.stopPropagation(); removeEdge(i); }} />
                </g>
              );
            })}

            {/* edge-add source ring */}
            {edgeSrc !== null && (() => {
              const n = nodes.find((nd) => nd.id === edgeSrc);
              return n ? (
                <circle cx={n.x} cy={n.y} r={NODE_R + 7} fill="none"
                  stroke="var(--highlight)" strokeWidth={2} strokeDasharray="4 2" />
              ) : null;
            })()}

            {/* nodes */}
            {nodes.map((n) => {
              const col   = getNodeColor(n, currentStep, algo, startId);
              const dist  = currentStep?.dist?.[n.id];
              const isStart = n.id === startId;
              return (
                <g key={n.id}
                  style={{ cursor: addEdgeMode ? "pointer" : "grab" }}
                  onMouseDown={(e) => onNodeMouseDown(e, n.id)}
                  onClick={(e) => handleNodeClickEdge(e, n.id)}
                  onContextMenu={(e) => { e.preventDefault(); removeNode(n.id); }}
                >
                  <circle cx={n.x} cy={n.y} r={NODE_R}
                    fill={col}
                    stroke={isStart ? C.startNode : C.nodeStroke}
                    strokeWidth={isStart ? 3 : 1.5}
                  />
                  <text x={n.x} y={n.y + 1} textAnchor="middle" dominantBaseline="middle"
                    fill={C.nodeText} fontSize={13} fontWeight={700}
                    style={{ userSelect: "none" }}>
                    {n.label}
                  </text>
                  {/* show dist above node for shortest path algos */}
                  {!isMST && dist !== undefined && dist !== Infinity && (
                    <text x={n.x} y={n.y - NODE_R - 6} textAnchor="middle"
                      fill={C.green} fontSize={10} style={{ userSelect: "none" }}>
                      {dist}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
          <div className="canvas-hint">
            Click canvas → add node &nbsp;·&nbsp; Right-click node → delete &nbsp;·&nbsp; Click edge → delete
          </div>
        </div>

        {/* ── right panel ── */}
        <div className="right-panel">

          {/* 1. DISTANCE TABLE — top of panel for shortest path */}
          {!isMST && (
            <div className="panel-section">
              <div className="section-label">dist[] array</div>
              {currentStep?.type === "neg_cycle" && (
                <div className="neg-cycle-banner">⚠ Negative cycle detected!</div>
              )}
              <div className="dist-table">
                {nodes.map((n) => {
                  const d = currentStep?.dist?.[n.id];
                  return (
                    <div key={n.id} className={`dist-row ${d !== undefined && d !== Infinity ? "updated" : ""}`}>
                      <span className={`dist-node ${n.id === startId ? "start" : ""}`}>{n.label}</span>
                      <span className={`dist-val ${d !== undefined && d !== Infinity ? "finite" : ""}`}>
                        {d === undefined ? "∞" : d === Infinity ? "∞" : d}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* MST cost badge */}
          {isMST && currentStep?.cost !== undefined && (
            <div className="panel-section">
              <div className="section-label">MST Cost</div>
              <div className="mst-cost">spanningTree sum = {currentStep.cost}</div>
            </div>
          )}

          {/* 2. CONTROLS */}
          <div className="panel-section">
            <div className="section-label">Controls</div>

            <label className="ctrl-label">Start Node</label>
            <select
              className="ctrl-select"
              value={startId}
              onChange={(e) => setStartId(Number(e.target.value))}
            >
              {nodes.map((n) => (
                <option key={n.id} value={n.id}>{n.label}  (id {n.id})</option>
              ))}
            </select>

            <label className="ctrl-label">Speed — {speed}ms / step</label>
            <input
              type="range" min={100} max={1500} value={speed}
              className="ctrl-range"
              onChange={(e) => setSpeed(Number(e.target.value))}
            />

            <div className="control-row">
              <button className="btn" onClick={() => handleStep(-1)}>◀</button>
              <button className="btn btn-primary" onClick={handlePlay} style={{ flex: 1 }}>
                {playing ? "⏸ Pause" : "▶ Play"}
              </button>
              <button className="btn" onClick={() => handleStep(1)}>▶</button>
              <button className="btn btn-danger" onClick={handleReset}>↺</button>
            </div>

            <div className="step-count">
              Step {Math.max(0, stepIdx + 1)} / {steps.length}
            </div>
            <div className="progress-bar-wrap">
              <div
                className="progress-bar-fill"
                style={{ width: `${steps.length ? ((stepIdx + 1) / steps.length) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* 3. EDIT GRAPH */}
          <div className="panel-section">
            <div className="section-label">Edit Graph</div>
            <button
              className={`btn btn-full ${addEdgeMode ? "btn-highlight" : ""}`}
              onClick={() => { setAddEdgeMode((v) => !v); setEdgeSrc(null); }}
            >
              {addEdgeMode ? "✏ Click 2 nodes to connect…" : "+ Add Edge"}
            </button>
            {addEdgeMode && (
              <div className="control-row" style={{ marginBottom: 8 }}>
                <label className="ctrl-label" style={{ marginBottom: 0, whiteSpace: "nowrap" }}>Weight</label>
                <input
                  type="number" min={1} max={99} value={newEdgeWeight}
                  className="ctrl-input-num"
                  style={{ marginBottom: 0, marginLeft: 8 }}
                  onChange={(e) => setNewEdgeWeight(Number(e.target.value))}
                />
              </div>
            )}
            <button
              className="btn btn-full"
              onClick={() => { setNodes(DEFAULT_NODES); setEdges(DEFAULT_EDGES); setPlaying(false); setStepIdx(-1); setLog([]); }}
            >
              Reset Graph
            </button>
          </div>

          {/* 4. LEGEND */}
          <div className="panel-section">
            <div className="section-label">Legend</div>
            {[
              { col: C.startNode, label: "Start node (src)" },
              { col: C.visited,   label: isMST ? "In MST / vis[]" : "Visited" },
              { col: C.inQueue,   label: isMST ? "Candidate in PQ" : "In PQ (Pair)" },
              { col: isMST ? C.mstEdge : C.finalPath, label: isMST ? "MST edge added" : "Shortest path edge" },
              ...(algo === "Kruskal" ? [{ col: C.red, label: "Skipped (creates cycle)" }] : []),
            ].map(({ col, label }) => (
              <div key={label} className="legend-item">
                <div className="legend-dot" style={{ background: col }} />
                <span className="legend-text">{label}</span>
              </div>
            ))}
          </div>

          {/* 5. LOG */}
          <div className="log-section">
            <div className="section-label">Step Log</div>
            {currentStep && (
              <div className="log-current">{currentStep.message}</div>
            )}
            <div className="log-history">
              {[...log].reverse().slice(0, 20).map((m, i) => (
                <div key={i} className="log-entry" style={{ opacity: Math.max(0.2, 1 - i * 0.05) }}>
                  {m}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}