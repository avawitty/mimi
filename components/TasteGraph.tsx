import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Radar, RefreshCw, Terminal, Activity, Database, GitCommit, Crosshair } from 'lucide-react';
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
 const [selectedNode, setSelectedNode] = useState<TasteGraphNode | null>(null);

 const loadGraph = async () => {
 setLoading(true);
 try {
 if (user && !user.isAnonymous) {
 const graph = await getTasteGraph(user.uid);
 setNodes(graph.nodes);
 setEdges(graph.edges);
 } else {
 setNodes([{ id: 'local_node_1', label: 'Local Resonance', type: 'concept', weight: 1 }]);
 setEdges([]);
 window.dispatchEvent(new CustomEvent('mimi:registry_alert', { 
 detail: { message:"Operating in Local Free Mode. Graph is not synced to cloud."} 
 }));
 }
 } catch (e) {
 console.error("MIMI // Failed to load taste graph:", e);
 } finally {
 setLoading(false);
 }
 };

 useEffect(() => {
 loadGraph();
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
 const d3Nodes = nodes.map((d, i) => ({ 
 ...d, 
 refId: `REF_${(i + 1).toString().padStart(3, '0')}`,
 status: Math.random() > 0.2 ? 'SYNC_01.Active' : 'SYNC_00.Dormant',
 cohesion: Math.floor(Math.random() * 20 + 80)
 })) as any[];
 const d3Edges = edges.map(d => ({ ...d })) as any[];

 const simulation = d3.forceSimulation(d3Nodes)
 .force("link", d3.forceLink(d3Edges).id((d: any) => d.id).distance(150))
 .force("charge", d3.forceManyBody().strength(-400))
 .force("center", d3.forceCenter(width / 2, height / 2))
 .force("collide", d3.forceCollide().radius(60));

 const g = svg.append("g");

 // Add zoom capabilities
 const zoom = d3.zoom<SVGSVGElement, unknown>()
 .scaleExtent([0.1, 4])
 .on("zoom", (event) => {
 g.attr("transform", event.transform);
 });

 svg.call(zoom);

 // --- BACKGROUND SCHEMATICS ---
 // Grid lines
 const gridGroup = g.append("g").attr("class","grid-lines").attr("opacity", 0.1);
 for (let i = -1000; i < 2000; i += 50) {
 gridGroup.append("line").attr("x1", i).attr("y1", -1000).attr("x2", i).attr("y2", 2000).attr("stroke","currentColor").attr("stroke-width", 0.5);
 gridGroup.append("line").attr("x1", -1000).attr("y1", i).attr("x2", 2000).attr("y2", i).attr("stroke","currentColor").attr("stroke-width", 0.5);
 }

 // Axes
 const axesGroup = g.append("g").attr("class","axes").attr("opacity", 0.3);
 axesGroup.append("line").attr("x1", width/2).attr("y1", -1000).attr("x2", width/2).attr("y2", 2000).attr("stroke","currentColor").attr("stroke-width", 1).attr("stroke-dasharray","4,4");
 axesGroup.append("line").attr("x1", -1000).attr("y1", height/2).attr("x2", 2000).attr("y2", height/2).attr("stroke","currentColor").attr("stroke-width", 1).attr("stroke-dasharray","4,4");
 
 axesGroup.append("text").attr("x", width/2 + 10).attr("y", -100).text("Y-AXIS: CULTURAL RESONANCE").attr("font-size","8px").attr("font-family","monospace").attr("fill","currentColor").attr("letter-spacing","0.2em");
 axesGroup.append("text").attr("x", 100).attr("y", height/2 - 10).text("X-AXIS: MATERIAL DENSITY").attr("font-size","8px").attr("font-family","monospace").attr("fill","currentColor").attr("letter-spacing","0.2em");

 // Draw edges
 const link = g.append("g")
 .attr("stroke","currentColor")
 .attr("stroke-opacity", 0.3)
 .selectAll("line")
 .data(d3Edges)
 .join("line")
 .attr("stroke-width", 1)
 .attr("stroke-dasharray", (d: any) => d.type === 'contrast' ?"2,2":"none");

 // Edge labels
 const linkLabels = g.append("g")
 .selectAll("text")
 .data(d3Edges)
 .join("text")
 .text((d: any) => d.type ? d.type.toUpperCase() : 'RELATES')
 .attr("font-size","6px")
 .attr("font-family","monospace")
 .attr("fill","currentColor")
 .attr("opacity", 0.5)
 .attr("text-anchor","middle")
 .attr("dy", -2);

 // Draw nodes
 const nodeGroup = g.append("g")
 .selectAll("g")
 .data(d3Nodes)
 .join("g")
 .call(d3.drag<SVGGElement, any>()
 .on("start", dragstarted)
 .on("drag", dragged)
 .on("end", dragended))
 .on("click", (event, d) => {
 setSelectedNode(d);
 });

 // Node outer ring
 nodeGroup.append("circle")
 .attr("r", (d: any) => Math.max(15, (d.weight || 1) * 4) + 4)
 .attr("fill","none")
 .attr("stroke","currentColor")
 .attr("stroke-width", 0.5)
 .attr("stroke-dasharray","2,2")
 .attr("opacity", 0.5)
 .attr("class","animate-spin-slow");

 // Node core
 nodeGroup.append("circle")
 .attr("r", (d: any) => Math.max(15, (d.weight || 1) * 4))
 .attr("fill", (d: any) => {
 switch (d.type) {
 case 'concept': return '#10b981'; // Nominal Green
 case 'motif': return '#3b82f6'; // System Blue
 case 'era': return '#f59e0b'; // Warning Amber
 default: return '#78716c'; // Neutral Stone
 }
 })
 .attr("stroke","currentColor")
 .attr("stroke-width", 1);

 // Node crosshair
 nodeGroup.append("path")
 .attr("d","M-4,0 L4,0 M0,-4 L0,4")
 .attr("stroke","#000")
 .attr("stroke-width", 1)
 .attr("opacity", 0.5);

 // Add labels & metadata
 const labelGroup = nodeGroup.append("g").attr("transform","translate(20, -10)");
 
 labelGroup.append("text")
 .text((d: any) => d.label.toUpperCase())
 .attr("font-size","10px")
 .attr("font-family","monospace")
 .attr("font-weight","bold")
 .attr("fill","currentColor")
 .attr("letter-spacing","0.1em");

 labelGroup.append("text")
 .text((d: any) => `${d.refId} // ${d.status}`)
 .attr("font-size","7px")
 .attr("font-family","monospace")
 .attr("fill","currentColor")
 .attr("opacity", 0.7)
 .attr("dy", 12)
 .attr("letter-spacing","0.1em");

 labelGroup.append("text")
 .text((d: any) => `COHESION: ${d.cohesion}%`)
 .attr("font-size","7px")
 .attr("font-family","monospace")
 .attr("fill", (d: any) => d.cohesion > 90 ? '#10b981' : 'currentColor')
 .attr("opacity", 0.7)
 .attr("dy", 22)
 .attr("letter-spacing","0.1em");

 simulation.on("tick", () => {
 link
 .attr("x1", (d: any) => d.source.x)
 .attr("y1", (d: any) => d.source.y)
 .attr("x2", (d: any) => d.target.x)
 .attr("y2", (d: any) => d.target.y);

 linkLabels
 .attr("x", (d: any) => (d.source.x + d.target.x) / 2)
 .attr("y", (d: any) => (d.source.y + d.target.y) / 2);

 nodeGroup.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
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
 <div className="flex-1 flex h-full bg dark:bg text dark:text overflow-hidden relative font-sans">
 
 {/* DOT GRID BACKGROUND */}
 <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]"
 style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)', backgroundSize: '24px 24px' }} />

 {/* SIDEBAR */}
 <div className="w-16 border-r border/20 dark:border/20 flex flex-col items-center py-6 relative z-10 bg/80 dark:bg/80 backdrop-blur-sm">
 <div className="w-8 h-8 border border-current flex items-center justify-center mb-12">
 <Crosshair size={14} />
 </div>
 
 <div className="flex-1 flex items-center justify-center relative">
 <div className="absolute -rotate-90 whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.3em] opacity-50 flex items-center gap-4">
 <span>SYS.OP.8821-X</span>
 <span className="w-12 h-px bg-current"/>
 <span>NODE: TOKYO-3</span>
 </div>
 </div>

 {/* TAPED MARGINAL NOTE */}
 <div className="absolute top-1/2 -right-32 translate-y-24 rotate-90 origin-left">
 <div className="bg dark:bg border border/30 dark:border/30 p-3 relative">
 {/* Tape effect */}
 <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-12 h-4 bg-white/40 dark:bg-black/40 backdrop-blur-md rotate-2 border border-black/5 dark:border-white/5"/>
 <p className="font-serif italic text-sm text dark:text">"Define the physics of your world."</p>
 </div>
 </div>
 </div>

 {/* MAIN CONTENT */}
 <div className="flex-1 flex flex-col relative z-10">
 
 {/* HEADER */}
 <div className="h-20 border-b border/20 dark:border/20 flex items-center justify-between px-8 bg/80 dark:bg/80 backdrop-blur-sm">
 <div className="flex items-baseline gap-6">
 <h2 className="text-3xl font-serif italic tracking-tight">Mimi Archival Complex <span className="font-sans text-sm uppercase tracking-widest opacity-50 ml-4 not-italic">// The Ward</span></h2>
 </div>
 <button 
 onClick={handleExtract}
 disabled={extracting}
 className="flex items-center gap-2 px-4 py-2 border border/30 dark:border/30 hover:bg hover:text dark:hover:bg dark:hover:text transition-colors font-mono text-[10px] uppercase tracking-widest disabled:opacity-50"
 >
 {extracting ? <Loader2 size={12} className="animate-spin"/> : <Terminal size={12} />}
 {nodes.length > 0 ? 'INTERROGATION V4.1' : 'INITIATE EXTRACTION'}
 </button>
 </div>

 {/* GRAPH AREA */}
 <div className="flex-1 relative border-b border/20 dark:border/20"ref={containerRef}>
 {loading ? (
 <div className="absolute inset-0 flex flex-col items-center justify-center opacity-50 space-y-4">
 <Loader2 size={24} className="animate-spin"/>
 <p className="font-mono text-[10px] uppercase tracking-[0.2em]">Loading Semantic Network...</p>
 </div>
 ) : nodes.length === 0 && !extracting ? (
 <div className="absolute inset-0 flex flex-col items-center justify-center opacity-50 space-y-4 text-center px-6">
 <Radar size={32} className="opacity-50"/>
 <p className="font-serif italic text-xl">Awaiting Ingestion</p>
 <p className="font-mono text-[10px] uppercase tracking-widest max-w-md">Initiate extraction to map the semantic relationships of your artifacts.</p>
 </div>
 ) : extracting ? (
 <div className="absolute inset-0 flex flex-col items-center justify-center opacity-50 space-y-4">
 <Loader2 size={24} className="animate-spin"/>
 <p className="font-mono text-[10px] uppercase tracking-[0.2em]">Analyzing Artifacts & Extracting Nodes...</p>
 </div>
 ) : (
 <svg ref={svgRef} className="w-full h-full cursor-crosshair"/>
 )}

 {/* LEGEND */}
 {nodes.length > 0 && (
 <div className="absolute bottom-6 left-6 flex flex-col gap-2 p-4 border border/20 dark:border/20 bg/90 dark:bg/90 backdrop-blur-md">
 <div className="font-mono text-[8px] uppercase tracking-widest opacity-50 mb-2 border-b border-current pb-2">Node Classification</div>
 <div className="flex items-center gap-3">
 <div className="w-2 h-2 bg"/>
 <span className="font-mono text-[9px] uppercase tracking-widest">Concept</span>
 </div>
 <div className="flex items-center gap-3">
 <div className="w-2 h-2 bg"/>
 <span className="font-mono text-[9px] uppercase tracking-widest">Motif</span>
 </div>
 <div className="flex items-center gap-3">
 <div className="w-2 h-2 bg"/>
 <span className="font-mono text-[9px] uppercase tracking-widest">Era</span>
 </div>
 </div>
 )}
 </div>

 {/* DATA TABLE (GRAPH POINTS // FEED) */}
 <div className="h-64 bg dark:bg overflow-y-auto">
 <div className="sticky top-0 bg dark:bg border-b border/20 dark:border/20 px-8 py-3 flex items-center justify-between z-10">
 <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] font-bold flex items-center gap-2">
 <Database size={12} /> Graph Points // Feed
 </h3>
 <span className="font-mono text-[10px] opacity-50">TOTAL NODES: {nodes.length.toString().padStart(3, '0')}</span>
 </div>
 
 <div className="px-8 py-4">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="border-b border/10 dark:border/10">
 <th className="font-mono text-[9px] uppercase tracking-widest opacity-50 pb-3 font-normal w-24">Ref ID</th>
 <th className="font-mono text-[9px] uppercase tracking-widest opacity-50 pb-3 font-normal">Artifact / Node</th>
 <th className="font-mono text-[9px] uppercase tracking-widest opacity-50 pb-3 font-normal w-32">Type</th>
 <th className="font-mono text-[9px] uppercase tracking-widest opacity-50 pb-3 font-normal w-32">Status</th>
 <th className="font-mono text-[9px] uppercase tracking-widest opacity-50 pb-3 font-normal w-24 text-right">Cohesion</th>
 </tr>
 </thead>
 <tbody>
 {nodes.map((node: any, i) => {
 const cohesion = Math.floor(Math.random() * 20 + 80);
 const isSelected = selectedNode?.id === node.id;
 return (
 <React.Fragment key={node.id}>
 <tr 
 className={`border-b border/5 dark:border/5 hover:bg/5 dark:hover:bg/5 cursor-pointer transition-colors ${isSelected ? 'bg/5 dark:bg/5' : ''}`}
 onClick={() => setSelectedNode(isSelected ? null : node)}
 >
 <td className="py-3 font-mono text-[10px] tracking-wider">REF_{(i + 1).toString().padStart(3, '0')}</td>
 <td className="py-3 font-mono text-[10px] tracking-wider font-bold">{node.label.toUpperCase()}</td>
 <td className="py-3 font-mono text-[10px] tracking-wider opacity-70">{node.type.toUpperCase()}</td>
 <td className="py-3 font-mono text-[10px] tracking-wider flex items-center gap-2">
 <div className={`w-1.5 h-1.5 ${Math.random() > 0.2 ? 'bg' : 'bg'}`} />
 {Math.random() > 0.2 ? 'SYNC_01.Active' : 'SYNC_00.Dormant'}
 </td>
 <td className="py-3 font-mono text-[10px] tracking-wider text-right">{cohesion}%</td>
 </tr>
 {/* STYLIST REASONING EXPANDABLE ROW */}
 <AnimatePresence>
 {isSelected && (
 <motion.tr
 initial={{ opacity: 0, height: 0 }}
 animate={{ opacity: 1, height: 'auto' }}
 exit={{ opacity: 0, height: 0 }}
 className="bg/[0.02] dark:bg/[0.02]"
 >
 <td colSpan={5} className="py-4 px-8 border-b border/10 dark:border/10">
 <div className="flex gap-4">
 <div className="w-px bg/20 dark:bg/20"/>
 <div>
 <span className="font-mono text-[8px] uppercase tracking-widest opacity-50 mb-1 block">Stylist Reasoning</span>
 <p className="font-serif italic text-sm leading-relaxed max-w-3xl">
 The integration of"{node.label}"serves as a critical structural anchor. Its presence mimics the archival tension found in 1994 collections, grounding the abstract concepts in specific, tangible design language. Cohesion load is nominal.
 </p>
 </div>
 </div>
 </td>
 </motion.tr>
 )}
 </AnimatePresence>
 </React.Fragment>
 );
 })}
 {nodes.length === 0 && !loading && (
 <tr>
 <td colSpan={5} className="py-8 text-center font-mono text-[10px] uppercase tracking-widest opacity-50">
 No data points available.
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </div>

 </div>
 </div>
 );
};

