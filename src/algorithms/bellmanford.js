// ─── mirrors Java: class Solution { int[] bellmanFord(V, edges, src) } ────────
// Key insight from your Java:
//   - iterate V times (not V-1) to detect negative cycles on Vth pass
//   - uses (int) 1e8 as infinity (we use JS Infinity)
//   - directed edges only from edges[j][0] → edges[j][1]

export default function runBellmanFord(nodes, edges, startId) {
  const steps = [];
  const V = nodes.length;

  // int dist[] = new int[V];  Arrays.fill(dist, (int) 1e8);
  const dist = {};
  nodes.forEach((n) => { dist[n.id] = Infinity; });
  dist[startId] = 0;

  const prev = {};
  nodes.forEach((n) => { prev[n.id] = null; });

  steps.push({
    type: "init",
    visited: new Set(),
    dist: { ...dist },
    message: `Init: dist[${nodes.find((n) => n.id === startId)?.label}]=0, all others=∞`,
  });

  // for (int i = 0; i <= V; i++)  — V+1 iterations, Vth detects -ve cycle
  for (let i = 0; i <= V; i++) {
    let updated = false;

    steps.push({
      type: "round",
      round: i + 1,
      visited: new Set(),
      dist: { ...dist },
      message: i < V
        ? `Iteration ${i + 1} of ${V - 1} — relax all edges`
        : `Iteration ${V + 1} (negative cycle check)`,
    });

    // for (int j = 0; j < E; j++)
    for (const e of edges) {
      // treat as undirected: check both directions like your dijkstra adj list
      const pairs = [
        [e.from, e.to],
        [e.to, e.from],
      ];

      for (const [u, v] of pairs) {
        // if (dist[u] != 1e8 && dist[u] + w < dist[v])
        if (dist[u] !== Infinity && dist[u] + e.weight < dist[v]) {
          if (i === V) {
            // Vth relaxation still possible → negative cycle
            steps.push({
              type: "neg_cycle",
              visited: new Set(),
              dist: { ...dist },
              message: `⚠ Negative cycle detected! Edge ${label(nodes, u)}→${label(nodes, v)} still relaxes on pass ${V + 1}`,
            });
            return steps;
          }

          dist[v] = dist[u] + e.weight;
          prev[v] = u;
          updated = true;

          steps.push({
            type: "relax",
            edge: { from: u, to: v },
            visited: new Set(),
            dist: { ...dist },
            message: `Relax ${label(nodes, u)}→${label(nodes, v)}: dist[${label(nodes, v)}] = ${dist[v]}`,
          });
        }
      }
    }

    // early termination — if no update in full pass, done
    if (!updated && i < V) {
      steps.push({
        type: "early_stop",
        visited: new Set(),
        dist: { ...dist },
        message: `No relaxation in iteration ${i + 1} → early termination`,
      });
      break;
    }
  }

  // build tree edges from prev[]
  const treeEdges = new Set();
  nodes.forEach((n) => {
    if (prev[n.id] !== null) treeEdges.add(`${prev[n.id]}-${n.id}`);
  });

  steps.push({
    type: "done",
    visited: new Set(nodes.map((n) => n.id)),
    dist: { ...dist },
    treeEdges,
    message: `Done! No negative cycle. dist[] = [${nodes.map((n) => (dist[n.id] === Infinity ? "∞" : dist[n.id])).join(", ")}]`,
  });

  return steps;
}

function label(nodes, id) {
  return nodes.find((n) => n.id === id)?.label ?? id;
}