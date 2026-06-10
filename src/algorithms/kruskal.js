// ─── mirrors Java: static class DisjointSet { int[] parent, rank; } ──────────
class DisjointSet {
  constructor(nodes) {
    this.parent = {};
    this.rank = {};
    nodes.forEach((n) => {
      this.parent[n.id] = n.id;   // parent[i] = i
      this.rank[n.id] = 0;
    });
  }

  // mirrors: int findPar(u) — with path compression
  findPar(u) {
    if (u === this.parent[u]) return u;
    this.parent[u] = this.findPar(this.parent[u]); // path compression
    return this.parent[u];
  }

  // mirrors: void unionByRank(u, v)
  unionByRank(u, v) {
    const pu = this.findPar(u);
    const pv = this.findPar(v);
    if (pu === pv) return;

    if (this.rank[pu] < this.rank[pv]) {
      this.parent[pu] = pv;
    } else if (this.rank[pv] < this.rank[pu]) {
      this.parent[pv] = pu;
    } else {
      this.parent[pv] = pu;
      this.rank[pu]++;
    }
  }
}

// ─── mirrors Java: static int kruskalsMST(V, edges) ──────────────────────────
export default function runKruskal(nodes, edges, _startId) {
  const steps = [];

  // Arrays.sort(edges, (a,b) -> a[2] - b[2])  — sort by weight
  const sorted = [...edges].sort((a, b) => a.weight - b.weight);

  steps.push({
    type: "start",
    mstEdges: new Set(),
    message: `Sort ${edges.length} edges by weight: [${sorted.map((e) => e.weight).join(", ")}]`,
  });

  // DisjointSet ds = new DisjointSet(V)
  const ds = new DisjointSet(nodes);

  let mstWeight = 0;
  const mstEdges = new Set();

  // for (int[] edge : edges)
  for (const e of sorted) {
    const u = e.from;
    const v = e.to;
    const wt = e.weight;

    steps.push({
      type: "consider",
      edge: e,
      mstEdges: new Set(mstEdges),
      message: `Consider edge ${label(nodes, u)}-${label(nodes, v)} (wt=${wt})  →  findPar(${label(nodes, u)})=${ds.findPar(u)}, findPar(${label(nodes, v)})=${ds.findPar(v)}`,
    });

    // if (ds.findPar(u) != ds.findPar(v))  — not same component → no cycle
    if (ds.findPar(u) !== ds.findPar(v)) {
      mstWeight += wt;
      ds.unionByRank(u, v);
      mstEdges.add(`${e.from}-${e.to}`);

      steps.push({
        type: "add",
        edge: e,
        mstEdges: new Set(mstEdges),
        cost: mstWeight,
        message: `✓ Different components → unionByRank(${label(nodes, u)}, ${label(nodes, v)})  | mstWeight=${mstWeight}`,
      });
    } else {
      steps.push({
        type: "skip",
        edge: e,
        mstEdges: new Set(mstEdges),
        message: `✗ Same component (findPar=${ds.findPar(u)}) → creates cycle, skip`,
      });
    }
  }

  steps.push({
    type: "done",
    mstEdges: new Set(mstEdges),
    cost: mstWeight,
    message: `kruskalsMST = ${mstWeight}`,
  });

  return steps;
}

function label(nodes, id) {
  return nodes.find((n) => n.id === id)?.label ?? id;
}