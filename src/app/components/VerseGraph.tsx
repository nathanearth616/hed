import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { SearchResult } from '@/app/types/search';
import { BibleVerse } from '@/app/types/bible';
import { ForceGraphProps, NodeObject, LinkObject } from 'react-force-graph-2d';
import LoadingSpinner from '@/app/components/LoadingSpinner';

// Dynamically import ForceGraph to avoid SSR issues
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
  ssr: false,
  loading: () => <p>Loading graph...</p>
});

interface VerseGraphProps {
  searchResult: SearchResult;
  onVerseSelect: (verse: BibleVerse) => void;
}

// Define our custom node type that extends the library's NodeObject
interface GraphNode extends NodeObject {
  id: string;
  name: string;
  val: number;
  color: string;
  verseData?: any;
}

// Define our custom link type that extends the library's LinkObject
interface GraphLink extends LinkObject {
  source: string;
  target: string;
  value?: number;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

interface RelatedVerseInfo {
  verse: string;
  related: string[];
}

export default function VerseGraph({ searchResult, onVerseSelect }: VerseGraphProps) {
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [isMouseInContainer, setIsMouseInContainer] = useState(false);

  useEffect(() => {
    const buildGraph = async () => {
      if (!searchResult?.verseReferences) {
          setGraphData({ nodes: [], links: [] });
          return;
        }

      // Create nodes map with proper typing
      const nodesMap = new Map<string, {
        id: string;
        name: string;
        val: number;
        color: string;
        x?: number;
        y?: number;
      }>();

      // Add primary nodes (verses from search result)
      searchResult.verseReferences.forEach((verse) => {
        nodesMap.set(verse.reference, {
          id: verse.reference,
          name: verse.reference,
          val: 15,
          color: '#60a5fa',
          x: Math.random() * 1000 - 500,
          y: Math.random() * 600 - 300
          });
        });

      // Create links array
      const links: Array<{ source: string; target: string }> = [];

      // Connect each verse to 2-3 random other verses
      Array.from(nodesMap.keys()).forEach((sourceId) => {
        const otherNodes = Array.from(nodesMap.keys()).filter(id => id !== sourceId);
        const numConnections = Math.floor(Math.random() * 2) + 2; // 2-3 connections
        
        for (let i = 0; i < numConnections && i < otherNodes.length; i++) {
          const targetId = otherNodes[Math.floor(Math.random() * otherNodes.length)];
          links.push({
            source: sourceId,
            target: targetId
          });
        }
      });

      setGraphData({
        nodes: Array.from(nodesMap.values()),
        links
      });
    };

    buildGraph();
  }, [searchResult]);

  const handleNodeHover = useCallback((node: NodeObject | null) => {
    if (!isMouseInContainer) return;
    setHoveredNode(node ? String(node.id) : null);
  }, [isMouseInContainer]);

  const handleNodeClick = useCallback((node: NodeObject) => {
    if (!isMouseInContainer || !searchResult) return;
    
    const verse = searchResult.verseReferences.find(v => v.reference === String(node.id));
    if (verse) {
      onVerseSelect({
        id: 0,
        book: verse.reference.split(' ')[0],
        chapter: parseInt(verse.reference.split(' ')[1].split(':')[0]),
        verse: parseInt(verse.reference.split(':')[1]),
        text: verse.text,
        testament: verse.reference.split(' ')[0].includes('Genesis') ? 'Old' : 'New' // Simple testament determination
      });
    }
  }, [isMouseInContainer, onVerseSelect, searchResult]);

  return (
    <div 
      className="w-full h-full relative overflow-hidden rounded-xl"
      onMouseEnter={() => setIsMouseInContainer(true)}
      onMouseLeave={() => {
        setIsMouseInContainer(false);
        setHoveredNode(null);
      }}
    >
      {graphData.nodes.length === 0 && searchResult && (
        <div className="absolute inset-0 flex items-center justify-center">
          <LoadingSpinner />
         </div>
      )}
      {graphData.nodes.length > 0 && (
        <ForceGraph2D
          graphData={graphData}
          nodeLabel={(node) => String(node.id)}
          nodeColor={(node) => hoveredNode === String(node.id) ? '#f87171' : (node as GraphNode).color}
          nodeVal={(node) => (node as GraphNode).val}
          linkColor={() => '#e2e8f0'}
          linkWidth={1}
          backgroundColor="transparent"
          enableNodeDrag={isMouseInContainer}
          enablePanInteraction={isMouseInContainer}
          enableZoom={isMouseInContainer}
          onNodeClick={handleNodeClick}
          onNodeHover={handleNodeHover}
          nodeCanvasObject={(node, ctx, globalScale) => {
            const label = String(node.id);
            const fontSize = 14;
            ctx.font = `${fontSize}px Inter, system-ui, sans-serif`;
            ctx.fillStyle = hoveredNode === String(node.id) ? '#f87171' : (node as GraphNode).color;
            ctx.beginPath();
            ctx.arc(node.x || 0, node.y || 0, 8, 0, 2 * Math.PI);
            ctx.fill();
            ctx.fillStyle = hoveredNode === String(node.id) ? '#f87171' : '#64748b';
            ctx.textAlign = 'center';
            ctx.fillText(label, node.x || 0, (node.y || 0) + 20);
          }}
          d3VelocityDecay={0.3}
          d3AlphaDecay={0.01}
          d3AlphaMin={0.001}
          warmupTicks={100}
          cooldownTicks={200}
          cooldownTime={5000}
          d3Force="link"
          d3ForceLink={{
            distance: 200
          }}
        />
      )}
    </div>
  );
} 