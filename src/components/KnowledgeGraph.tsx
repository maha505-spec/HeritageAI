import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface Node extends d3.SimulationNodeDatum {
  id: string;
  group: string;
}

interface Link extends d3.SimulationLinkDatum<Node> {
  source: string;
  target: string;
}

interface Props {
  entities: {
    kings: string[];
    places: string[];
    temples: string[];
    events: string[];
    dynasties: string[];
  };
}

const KnowledgeGraph: React.FC<Props> = ({ entities }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 800;
    const height = 600;

    const nodes: Node[] = [];
    const links: Link[] = [];

    // Create nodes and links based on entities
    const addEntity = (list: string[], group: string) => {
      list.forEach(name => {
        if (!nodes.find(n => n.id === name)) {
          nodes.push({ id: name, group });
        }
      });
    };

    addEntity(entities.kings, 'king');
    addEntity(entities.places, 'place');
    addEntity(entities.temples, 'temple');
    addEntity(entities.events, 'event');
    addEntity(entities.dynasties, 'dynasty');

    // Simple heuristic links (e.g., all kings linked to their dynasty if any)
    // For now, let's just create some random links or link everything to a central manuscript node
    nodes.push({ id: 'Manuscript', group: 'root' });
    nodes.forEach(node => {
      if (node.id !== 'Manuscript') {
        links.push({ source: 'Manuscript', target: node.id });
      }
    });

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const simulation = d3.forceSimulation<Node>(nodes)
      .force('link', d3.forceLink<Node, Link>(links).id(d => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2));

    const link = svg.append('g')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke-width', 2);

    const node = svg.append('g')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5)
      .selectAll('circle')
      .data(nodes)
      .join('circle')
      .attr('r', d => d.group === 'root' ? 15 : 8)
      .attr('fill', d => {
        switch (d.group) {
          case 'king': return '#ef4444';
          case 'place': return '#3b82f6';
          case 'temple': return '#10b981';
          case 'event': return '#f59e0b';
          case 'dynasty': return '#8b5cf6';
          default: return '#6b7280';
        }
      })
      .call(drag(simulation));

    node.append('title').text(d => d.id);

    const labels = svg.append('g')
      .selectAll('text')
      .data(nodes)
      .join('text')
      .text(d => d.id)
      .attr('font-size', '12px')
      .attr('dx', 12)
      .attr('dy', 4);

    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as any).x)
        .attr('y1', d => (d.source as any).y)
        .attr('x2', d => (d.target as any).x)
        .attr('y2', d => (d.target as any).y);

      node
        .attr('cx', d => d.x!)
        .attr('cy', d => d.y!);

      labels
        .attr('x', d => d.x!)
        .attr('y', d => d.y!);
    });

    function drag(simulation: d3.Simulation<Node, undefined>) {
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

      return d3.drag<SVGCircleElement, Node>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended);
    }

  }, [entities]);

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
      <svg ref={svgRef} viewBox="0 0 800 600" className="w-full h-auto" />
    </div>
  );
};

export default KnowledgeGraph;
