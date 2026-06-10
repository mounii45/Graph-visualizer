// ─── mirrors Java: class Edge { int dest, wt; } ──────────────────────────────
class Edge {
  constructor(dest, wt) {
    this.dest = dest;
    this.wt = wt;
  }
}

// ─── mirrors Java: class Pair { int dist, node; } ────────────────────────────
class Pair {
  constructor(dist, node) {
    this.dist = dist;
    this.node = node;
  }
}

// ─── mirrors Java: class Solution { int[] dijkstra(V, edges, src) } ──────────
export default function runDijkstra(nodes, edges, startId) {
  const steps = [];
  const V = nodes.length;

  // build adjacency list  — mirrors: adj.get(u).add(new Edge(v,wt))
  const adj = {};
  nodes.forEach((n) => { adj[n.id] = []; });
  edges.forEach((e) => {
    adj[e.from].push(new Edge(e.to, e.weight));   // undirected
    adj[e.to].push(new Edge(e.from, e.weight));
  });

  // dist[] — mirrors: Arrays.fill(dist, Integer.MAX_VALUE)
  const dist = {};
  nodes.forEach((n) => { dist[n.id] = Infinity; });
  dist[startId] = 0;

  const prev = {};
  nodes.forEach((n) => { prev[n.id] = null; });

  // PriorityQueue<Pair> pq — min-heap by dist, simulated as sorted array
  const pq = [new Pair(0, startId)];
  const visited = new Set();

  while (pq.length > 0) {
    // pq.poll() — pick minimum dist pair
    pq.sort((x, y) => x.dist - y.dist);
    const curr = pq.shift();
    const node = curr.node;
    const distN = curr.dist;

    if (visited.has(node)) continue;
    visited.add(node);

    steps.push({
      type: "visit",
      node,
      visited: new Set(visited),
      dist: { ...dist },
      message: `Poll Pair(dist=${distN}, node=${label(nodes, node)}) from PQ → visit`,
    });

    // for (Edge e : adj.get(node))
    for (const e of adj[node]) {
      const v = e.dest;
      const wt = e.wt;

      // if (distN + wt < dist[v])
      if (distN + wt < dist[v]) {
        dist[v] = distN + wt;
        prev[v] = node;
        pq.push(new Pair(dist[v], v));

        steps.push({
          type: "relax",
          edge: { from: node, to: v },
          visited: new Set(visited),
          dist: { ...dist },
          message: `Relax ${label(nodes, node)}→${label(nodes, v)}: dist[${label(nodes, v)}] = ${dist[v]}  →  pq.add(Pair(${dist[v]}, ${label(nodes, v)}))`,
        });
      }
    }
  }

  // build shortest path tree edges from prev[]
  const treeEdges = new Set();
  nodes.forEach((n) => {
    if (prev[n.id] !== null) treeEdges.add(`${prev[n.id]}-${n.id}`);
  });

  steps.push({
    type: "done",
    visited: new Set(visited),
    dist: { ...dist },
    treeEdges,
    message: `Done! dist[] = [${nodes.map((n) => (dist[n.id] === Infinity ? "∞" : dist[n.id])).join(", ")}]`,
  });

  return steps;
}

function label(nodes, id) {
  return nodes.find((n) => n.id === id)?.label ?? id;
}