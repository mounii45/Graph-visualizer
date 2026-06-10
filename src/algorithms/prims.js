// ─── mirrors Java: class Edge { int dest, wt; } ──────────────────────────────
class Edge {
  constructor(dest, wt) {
    this.dest = dest;
    this.wt = wt;
  }
}

// ─── mirrors Java: class Pair { int wt, node, par; } ─────────────────────────
class Pair {
  constructor(wt, node, par) {
    this.wt = wt;
    this.node = node;
    this.par = par;   // parent — tracks which MST edge was used
  }
}

// ─── mirrors Java: class Solution { int spanningTree(V, edges) } ──────────────
export default function runPrim(nodes, edges, startId) {
  const steps = [];
  const V = nodes.length;

  // build adjacency list — mirrors: adj.get(u).add(new Edge(v,wt))
  const adj = {};
  nodes.forEach((n) => { adj[n.id] = []; });
  edges.forEach((e) => {
    adj[e.from].push(new Edge(e.to, e.weight));   // undirected
    adj[e.to].push(new Edge(e.from, e.weight));
  });

  // boolean vis[] = new boolean[V]
  const vis = {};
  nodes.forEach((n) => { vis[n.id] = false; });

  // PriorityQueue<Pair> pq — min-heap by wt
  // pq.add(new Pair(0, startId, -1))  → wt=0, node=start, par=-1
  const pq = [new Pair(0, startId, -1)];

  let sum = 0;
  const mstEdges = new Set();
  const inMST = new Set();

  steps.push({
    type: "start",
    inMST: new Set(inMST),
    mstEdges: new Set(mstEdges),
    message: `pq.add(Pair(wt=0, node=${label(nodes, startId)}, par=-1))  →  start`,
  });

  while (pq.length > 0) {
    // pq.poll() — min wt pair
    pq.sort((x, y) => x.wt - y.wt);
    const curr = pq.shift();
    const wt = curr.wt;
    const node = curr.node;
    const par = curr.par;

    // if (vis[node]) continue  — already in MST
    if (vis[node]) {
      steps.push({
        type: "skip",
        inMST: new Set(inMST),
        mstEdges: new Set(mstEdges),
        message: `Poll Pair(wt=${wt}, node=${label(nodes, node)}) → already visited, skip`,
      });
      continue;
    }

    // mark vis, add to MST
    vis[node] = true;
    inMST.add(node);
    sum += wt;

    if (par !== -1) {
      // store edge as "par-node" or "node-par" to match edgeKey format
      const key1 = `${par}-${node}`;
      const key2 = `${node}-${par}`;
      // find which direction the original edge is stored
      const exists = edges.find(
        (e) => (e.from === par && e.to === node) || (e.from === node && e.to === par)
      );
      if (exists) mstEdges.add(`${exists.from}-${exists.to}`);
      else mstEdges.add(key1);
    }

    steps.push({
      type: "add",
      edge: par !== -1 ? { from: par, to: node } : null,
      inMST: new Set(inMST),
      mstEdges: new Set(mstEdges),
      cost: sum,
      message: par === -1
        ? `Start node ${label(nodes, node)} added to MST`
        : `Add ${label(nodes, par)}→${label(nodes, node)} (wt=${wt}) to MST  | sum=${sum}`,
    });

    // for (Edge e : adj.get(node)) — add all unvisited neighbors
    for (const e of adj[node]) {
      const neigh = e.dest;
      const edgeWt = e.wt;
      if (!vis[neigh]) {
        pq.push(new Pair(edgeWt, neigh, node));
        steps.push({
          type: "enqueue",
          edge: { from: node, to: neigh },
          inMST: new Set(inMST),
          mstEdges: new Set(mstEdges),
          cost: sum,
          message: `  pq.add(Pair(wt=${edgeWt}, node=${label(nodes, neigh)}, par=${label(nodes, node)}))`,
        });
      }
    }
  }

  steps.push({
    type: "done",
    inMST: new Set(inMST),
    mstEdges: new Set(mstEdges),
    cost: sum,
    message: `MST complete! spanningTree sum = ${sum}`,
  });

  return steps;
}

function label(nodes, id) {
  if (id === -1) return "-1";
  return nodes.find((n) => n.id === id)?.label ?? id;
}