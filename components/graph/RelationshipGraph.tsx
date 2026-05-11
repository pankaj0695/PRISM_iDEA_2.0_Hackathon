"use client";

import { useEffect, useMemo, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  type Edge,
  type Node,
} from "reactflow";
import "reactflow/dist/style.css";

interface NetworkResponse {
  employee_id: string;
  nodes: Array<{ id: string; label: string; kind: string; meta?: Record<string, unknown> }>;
  edges: Array<{ id: string; source: string; target: string; kind: string; weight?: number }>;
}

const KIND_COLOR: Record<string, { bg: string; ring: string; fg: string }> = {
  EMPLOYEE: { bg: "#003B71", ring: "#003B71", fg: "#ffffff" },
  DEPENDENT: { bg: "#FFB81C", ring: "#b88600", fg: "#1f2937" },
  ACCOUNT: { bg: "#ffffff", ring: "#cbd5e1", fg: "#0f172a" },
  CUSTOMER: { bg: "#E30613", ring: "#b50410", fg: "#ffffff" },
  BRANCH: { bg: "#0f172a", ring: "#0f172a", fg: "#ffffff" },
};

function radialLayout(nodes: NetworkResponse["nodes"], rootId: string): Node[] {
  const root = nodes.find((n) => n.id === rootId)!;
  const others = nodes.filter((n) => n.id !== rootId);
  const radius = 240;
  return [
    {
      id: root.id,
      position: { x: 0, y: 0 },
      data: { label: root.label },
      type: "default",
      style: nodeStyle(root.kind),
    },
    ...others.map<Node>((n, i) => {
      const angle = (i / Math.max(1, others.length)) * Math.PI * 2;
      return {
        id: n.id,
        position: { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius },
        data: { label: n.label },
        type: "default",
        style: nodeStyle(n.kind),
      };
    }),
  ];
}

function nodeStyle(kind: string): React.CSSProperties {
  const c = KIND_COLOR[kind] || KIND_COLOR.ACCOUNT;
  return {
    background: c.bg,
    color: c.fg,
    border: `2px solid ${c.ring}`,
    borderRadius: 8,
    padding: "6px 8px",
    fontSize: 11,
    width: 150,
    whiteSpace: "pre",
    textAlign: "center",
  };
}

const EDGE_STYLE: Record<string, { stroke: string; label: string }> = {
  OWNS: { stroke: "#475569", label: "OWNS" },
  DEPENDENT_OF: { stroke: "#FFB81C", label: "DEP" },
  MANAGES: { stroke: "#003B71", label: "MNG" },
  TRANSACTED_WITH: { stroke: "#E30613", label: "TX" },
  AT_BRANCH: { stroke: "#94a3b8", label: "BR" },
};

export function RelationshipGraph({ employeeId, height = 560 }: { employeeId: string; height?: number }) {
  const [data, setData] = useState<NetworkResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/graph/network?employee_id=${encodeURIComponent(employeeId)}`, { credentials: "include" })
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error || `HTTP ${r.status}`);
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e.message || "Failed to load"))
      .finally(() => setLoading(false));
  }, [employeeId]);

  const nodes = useMemo<Node[]>(() => {
    if (!data) return [];
    return radialLayout(data.nodes, data.employee_id);
  }, [data]);

  const edges = useMemo<Edge[]>(() => {
    if (!data) return [];
    return data.edges.map<Edge>((e) => {
      const s = EDGE_STYLE[e.kind] || { stroke: "#94a3b8", label: e.kind };
      return {
        id: e.id,
        source: e.source,
        target: e.target,
        label: s.label,
        style: { stroke: s.stroke, strokeWidth: 1 + Math.min(3, (e.weight || 1) / 3) },
        labelStyle: { fontSize: 9, fill: s.stroke },
      };
    });
  }, [data]);

  if (loading) return <div className="p-4 text-sm text-[var(--fg-muted)]">Loading network…</div>;
  if (error) return <div className="p-4 text-sm text-[var(--critical)]">{error}</div>;

  return (
    <div style={{ height }} className="rounded-md border border-[var(--border)] bg-white">
      <ReactFlow nodes={nodes} edges={edges} fitView nodesDraggable nodesConnectable={false}>
        <Background gap={20} color="#e2e8f0" />
        <Controls showInteractive={false} />
        <MiniMap pannable zoomable />
      </ReactFlow>
    </div>
  );
}
