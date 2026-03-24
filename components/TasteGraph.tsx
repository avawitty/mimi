import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { motion } from 'framer-motion';
import { Loader2, Radar, RefreshCw } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { getTasteGraph, saveTasteGraph } from '../services/tasteGraphService';
import { extractTasteGraphNodes } from '../services/geminiService';
import { getAllShadowMemory } from '../services/vectorSearch';
import { TasteGraphNode, TasteGraphEdge } from '../types';

export const TasteGraph: React.FC = () => {
  const { user } = useUser();
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [nodes, setNodes] = useState<TasteGraphNode[]>([]);
  const [edges, setEdges] = useState<TasteGraphEdge[]>([]);
  const [loading, setLoading] = useState(true);
  const [extracting, setExtracting] = useState(false);

  const loadGraph = async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const graph = await getTasteGraph(user.uid);
      setNodes(graph.nodes);
      setEdges(graph.edges);
    } catch (e) {
      console.error("MIMI // Failed to load taste graph:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.uid) {
      loadGraph();
    }
  }, [user]);

  const handleExtract = async () => {
    if (!user?.uid) return;
    setExtracting(true);
    try {
      const artifacts = await getAllShadowMemory();
      if (artifacts.length === 0) {
        alert("No artifacts found. Please add some artifacts first.");
        setExtracting(false);
        return;
      }
      
      const graph = await extractTasteGraphNodes(artifacts as any);
      if (graph.nodes.length > 0) {
        await saveTasteGraph(user.uid, graph.nodes, graph.edges);
        setNodes(graph.nodes);
        setEdges(graph.edges);
      }
    } catch (e) {
      console.error("Failed to extract graph:", e);
    } finally {
      setExtracting(false);
    }
  };

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || nodes.length === 0) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous render

    // Create a deep copy of nodes and edges for d3 to mutate
    const d3Nodes = nodes.map(d => ({ ...d })) as any[];
    const d3Edges = edges.map(d => ({ ...d })) as any[];

    const simulation = d3.forceSimulation(d3Nodes)
      .force("link", d3.forceLink(d3Edges).id((d: any) => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius(40));

    const g = svg.append("g");

    // Add zoom capabilities
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    // Draw edges
    const link = g.append("g")
      .attr("stroke", "#57534e") // stone-600
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(d3Edges)
      .join("line")
      .attr("stroke-width", (d: any) => Math.sqrt(d.strength || 1));

    // Draw nodes
    const node = g.append("g")
      .attr("stroke", "#1c1917") // stone-900
      .attr("stroke-width", 1.5)
      .selectAll("circle")
      .data(d3Nodes)
      .join("circle")
      .attr("r", (d: any) => Math.max(3, (d.weight || 1) * 1.5))
      .attr("fill", (d: any) => {
        switch (d.type) {
          case 'concept': return '#10b981'; // emerald-500
          case 'motif': return '#6366f1'; // indigo-500
          case 'era': return '#f59e0b'; // amber-500
          default: return '#a8a29e'; // stone-400
        }
      })
      .call(d3.drag<SVGCircleElement, any>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    // Add labels
    const labels = g.append("g")
      .selectAll("text")
      .data(d3Nodes)
      .join("text")
      .text((d: any) => d.label)
      .attr("font-size", "10px")
      .attr("font-family", "monospace")
      .attr("fill", "#a8a29e") // stone-400
      .attr("dx", 12)
      .attr("dy", 4);

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node
        .attr("cx", (d: any) => d.x)
        .attr("cy", (d: any) => d.y);

      labels
        .attr("x", (d: any) => d.x)
        .attr("y", (d: any) => d.y);
    });

    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [nodes, edges]);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f5f2ed] dark:bg-[#050505] text-stone-900 dark:text-stone-100 p-6 md:p-12 relative">
      <div className="flex justify-between items-end mb-8 z-10">
        <div>
          <h2 className="text-4xl md:text-5xl font-serif italic">Taste Graph</h2>
          <p className="text-stone-500 font-sans text-[10px] uppercase tracking-[0.2em] mt-2">Semantic Network of Aesthetics</p>
        </div>
        <button 
          onClick={handleExtract}
          disabled={extracting}
          className="flex items-center gap-2 px-4 py-2 bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 rounded-full transition-colors font-sans text-[10px] uppercase tracking-widest disabled:opacity-50"
        >
          {extracting ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          {nodes.length > 0 ? 'Regenerate Graph' : 'Extract Graph'}
        </button>
      </div>

      <div className="flex-1 relative border border-stone-200 dark:border-stone-800 rounded-lg overflow-hidden" ref={containerRef}>
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-stone-400 space-y-4">
            <Loader2 size={24} className="animate-spin" />
            <p className="font-sans text-[10px] uppercase tracking-[0.2em]">Loading Semantic Network...</p>
          </div>
        ) : nodes.length === 0 && !extracting ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-stone-400 space-y-4 text-center px-6">
            <Radar size={32} className="opacity-20" />
            <p className="font-serif italic text-xl">No Graph Data</p>
            <p className="font-sans text-[10px] uppercase tracking-widest max-w-md">Extract the semantic graph to visualize the relationships between your artifacts.</p>
          </div>
        ) : extracting ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-stone-400 space-y-4">
            <Loader2 size={24} className="animate-spin" />
            <p className="font-sans text-[10px] uppercase tracking-[0.2em]">Analyzing Artifacts & Extracting Nodes...</p>
          </div>
        ) : (
          <svg ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
        )}
      </div>
      
      {nodes.length > 0 && (
        <div className="absolute bottom-16 left-16 flex gap-6 z-10 bg-white/80 dark:bg-black/80 backdrop-blur-md p-4 rounded-lg border border-stone-200 dark:border-stone-800">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="font-sans text-[10px] uppercase tracking-widest text-stone-500">Concept</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-indigo-500" />
            <span className="font-sans text-[10px] uppercase tracking-widest text-stone-500">Motif</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="font-sans text-[10px] uppercase tracking-widest text-stone-500">Era</span>
          </div>
        </div>
      )}
    </div>
  );
};
