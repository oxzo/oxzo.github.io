import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface Node extends d3.SimulationNodeDatum {
    id: string;
    group: 'thought' | 'tag';
    val: number;
    url?: string;
}

interface Link extends d3.SimulationLinkDatum<Node> {
    source: string | Node;
    target: string | Node;
}

interface MindmapProps {
    data: {
        nodes: Node[];
        links: Link[];
    };
}

const Mindmap: React.FC<MindmapProps> = ({ data }) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!svgRef.current || !containerRef.current || !data.nodes.length) return;

        const updateDimensions = () => {
            if (!svgRef.current || !containerRef.current) return;
            const width = containerRef.current.clientWidth;
            const height = containerRef.current.clientHeight;

            svg.attr("viewBox", [0, 0, width, height]);
            simulation.force("center", d3.forceCenter(width / 2, height / 2));
            simulation.alpha(0.3).restart();
        };

        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;

        // Clear previous render
        d3.select(svgRef.current).selectAll("*").remove();

        const svg = d3.select(svgRef.current)
            .attr("viewBox", [0, 0, width, height])
            .attr("class", "w-full h-full");

        // Define arrow marker
        svg.append("defs").append("marker")
            .attr("id", "arrowhead")
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", 20)
            .attr("refY", 0)
            .attr("markerWidth", 6)
            .attr("markerHeight", 6)
            .attr("orient", "auto")
            .append("path")
            .attr("d", "M0,-5L10,0L0,5")
            .attr("fill", "#ffb000")
            .attr("fill-opacity", 0.4);

        const simulation = d3.forceSimulation(data.nodes)
            .force("link", d3.forceLink(data.links).id((d: any) => d.id).distance(150))
            .force("charge", d3.forceManyBody().strength(-400))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("collide", d3.forceCollide().radius((d: any) => d.val * 10 + 20));

        const link = svg.append("g")
            .attr("stroke", "#ffb000")
            .attr("stroke-opacity", 0.2)
            .selectAll("line")
            .data(data.links)
            .join("line")
            .attr("stroke-width", 1)
        //.attr("marker-end", "url(#arrowhead)"); // Optional: arrows

        const node = svg.append("g")
            .selectAll("g")
            .data(data.nodes)
            .join("g")
            .call(drag(simulation) as any);

        // Node shapes (Squares for thoughts, Diamonds/Rects for tags)
        node.append("rect")
            .attr("width", (d) => d.group === 'tag' ? 20 : 12)
            .attr("height", (d) => d.group === 'tag' ? 20 : 12)
            .attr("x", (d) => d.group === 'tag' ? -10 : -6)
            .attr("y", (d) => d.group === 'tag' ? -10 : -6)
            .attr("fill", "#000")
            .attr("stroke", "#ffb000")
            .attr("stroke-width", (d) => d.group === 'tag' ? 2 : 1)
            .attr("class", "cursor-pointer transition-all duration-200 hover:fill-[#ffb000] hover:text-black group-hover:fill-[#ffb000]");

        // Node labels
        node.append("text")
            .text((d) => d.id)
            .attr("x", 16)
            .attr("y", 4)
            .attr("class", "text-xs fill-[#ffb000] pointer-events-none select-none font-mono tracking-wider")
            .style("font-size", (d) => d.group === 'tag' ? "14px" : "12px")
            .style("font-weight", (d) => d.group === 'tag' ? "bold" : "normal")
            .style("text-shadow", "0 0 2px rgba(0,0,0,1)");

        // Click handler
        node.on("click", (event, d) => {
            if (d.url) {
                window.location.href = d.url;
            }
        });

        // Hover effects handled via CSS classes on parent group if needed, 
        // or D3 events for more complex interactions
        node.on("mouseover", function () {
            d3.select(this).select("rect").attr("fill", "#ffb000");
            d3.select(this).select("text").style("text-shadow", "0 0 8px #ffb000");
        })
            .on("mouseout", function () {
                d3.select(this).select("rect").attr("fill", "#000");
                d3.select(this).select("text").style("text-shadow", "0 0 2px rgba(0,0,0,1)");
            });

        simulation.on("tick", () => {
            link
                .attr("x1", (d: any) => d.source.x)
                .attr("y1", (d: any) => d.source.y)
                .attr("x2", (d: any) => d.target.x)
                .attr("y2", (d: any) => d.target.y);

            node
                .attr("transform", (d: any) => `translate(${d.x},${d.y})`);
        });

        function drag(simulation: d3.Simulation<Node, undefined>) {
            function dragstarted(event: d3.D3DragEvent<SVGGElement, Node, Node>) {
                if (!event.active) simulation.alphaTarget(0.3).restart();
                event.subject.fx = event.subject.x;
                event.subject.fy = event.subject.y;
            }

            function dragged(event: d3.D3DragEvent<SVGGElement, Node, Node>) {
                event.subject.fx = event.x;
                event.subject.fy = event.y;
            }

            function dragended(event: d3.D3DragEvent<SVGGElement, Node, Node>) {
                if (!event.active) simulation.alphaTarget(0);
                event.subject.fx = null;
                event.subject.fy = null;
            }

            return d3.drag<SVGGElement, Node>()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended);
        }

        window.addEventListener('resize', updateDimensions);

        return () => {
            simulation.stop();
            window.removeEventListener('resize', updateDimensions);
        };
    }, [data]);

    return (
        <div ref={containerRef} className="w-full h-full bg-[var(--color-background)] overflow-hidden relative">
            {/* Optional Grid Background */}
            <div className="absolute inset-0 opacity-10 pointer-events-none"
                style={{
                    backgroundImage: 'linear-gradient(#ffb000 1px, transparent 1px), linear-gradient(90deg, #ffb000 1px, transparent 1px)',
                    backgroundSize: '40px 40px'
                }}>
            </div>
            <svg ref={svgRef} className="w-full h-full"></svg>
        </div>
    );
};

export default Mindmap;
