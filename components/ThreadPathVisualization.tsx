import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { TasteGraphNode, TasteGraphEdge } from '../types';

interface ThreadPathVisualizationProps {
  nodes: TasteGraphNode[];
  edges: TasteGraphEdge[];
}

export const ThreadPathVisualization: React.FC<ThreadPathVisualizationProps> = ({ nodes, edges }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 600;
    const height = 400;

    const simulation = d3.forceSimulation(nodes as any)
      .force('link', d3.forceLink(edges).id((d: any) => d.id))
      .force('charge', d3.forceManyBody().strength(-100))
      .force('center', d3.forceCenter(width / 2, height / 2));

    const link = svg.append('g')
      .selectAll('line')
      .data(edges)
      .join('line')
      .attr('stroke', '#a8a29e')
      .attr('stroke-width', (d: any) => d.strength * 2);

    const node = svg.append('g')
      .selectAll('circle')
      .data(nodes)
      .join('circle')
      .attr('r', (d: any) => d.weight * 5)
      .attr('fill', '#1c1917');

    const label = svg.append('g')
      .selectAll('text')
      .data(nodes)
      .join('text')
      .text((d: any) => d.label)
      .attr('font-size', '10px')
      .attr('fill', '#a8a29e');

    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node
        .attr('cx', (d: any) => d.x)
        .attr('cy', (d: any) => d.y);

      label
        .attr('x', (d: any) => d.x + 10)
        .attr('y', (d: any) => d.y + 5);
    });

    return () => {
      simulation.stop();
    };
  }, [nodes, edges]);

  return <svg ref={svgRef} width="100%" height="400" viewBox="0 0 600 400" />;
};
