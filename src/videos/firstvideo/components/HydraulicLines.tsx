import React from "react";
import { useCurrentFrame } from "remotion";

export interface HydraulicLinesProps {
    pathA: string;
    pathB: string;
    pressureA?: number;
    pressureB?: number;
    flowA?: number; // Actual flow rate
    flowB?: number;
    maxFlow?: number; // Normalization factor (default 100)
    maxPressure?: number;
    fluidOpacity?: number;
    dotSize?: number;
    dotColor?: string;
    lineThickness?: number;
}

// Helper to parse simple polyline paths (M x y L x y ...) and get point at t (0..1)
const getPointOnPolyline = (d: string, t: number) => {
    // Parse commands: "M 10,10 L 20,20 ..."
    // This is a naive parser optimized for the specific format used in CylinderPreview
    const coords: { x: number; y: number }[] = [];

    // Split by non-numeric/comma/dot characters, but keep groups
    // Actually, simple regex to find all number pairs might be easiest
    const matches = d.matchAll(/([-\d.]+)[, ]+([-\d.]+)/g);
    for (const match of matches) {
        coords.push({ x: parseFloat(match[1]), y: parseFloat(match[2]) });
    }

    if (coords.length < 2) return { x: 0, y: 0 };

    // Calculate total length
    const segments = [];
    let totalLength = 0;
    for (let i = 0; i < coords.length - 1; i++) {
        const p1 = coords[i];
        const p2 = coords[i + 1];
        const dist = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
        segments.push({ p1, p2, length: dist, cumulative: totalLength });
        totalLength += dist;
    }

    // Find segment for t
    const targetLength = t * totalLength;

    const segment = segments.find(s => targetLength >= s.cumulative && targetLength <= s.cumulative + s.length) || segments[segments.length - 1];

    // Interpolate within segment
    const segmentOffset = targetLength - segment.cumulative;
    const segmentT = segment.length === 0 ? 0 : segmentOffset / segment.length;

    const x = segment.p1.x + (segment.p2.x - segment.p1.x) * segmentT;
    const y = segment.p1.y + (segment.p2.y - segment.p1.y) * segmentT;

    return { x, y };
};

export const HydraulicLines: React.FC<HydraulicLinesProps> = ({
    pathA,
    pathB,
    pressureA = 0,
    pressureB = 0,
    flowA = 0,
    flowB = 0,
    maxFlow = 100,
    maxPressure = 300,
    fluidOpacity = 0.5,
    dotSize = 6,
    dotColor = "white",
    lineThickness = 12,
}) => {
    const frame = useCurrentFrame();

    // Color Logic (Same as cylinder)
    const getColor = (p: number) => {
        const max = maxPressure;
        const t = Math.max(0, Math.min(p, max)) / max;
        // Stops: Blue(0), Green(0.33), Yellow(0.66), Red(1.0)

        const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
        const toHex = (c: number) => Math.round(c).toString(16).padStart(2, "0");
        const rgbToHex = (r: number, g: number, b: number) => `#${toHex(r)}${toHex(g)}${toHex(b)}`;

        const stops = [
            { offset: 0.0, color: [0, 0, 255] },   // Blue
            { offset: 0.33, color: [0, 255, 0] },   // Green
            { offset: 0.66, color: [255, 255, 0] }, // Yellow
            { offset: 1.0, color: [255, 0, 0] },   // Red
        ];

        for (let i = 0; i < stops.length - 1; i++) {
            const start = stops[i];
            const end = stops[i + 1];
            if (t >= start.offset && t <= end.offset) {
                const localT = (t - start.offset) / (end.offset - start.offset);
                const r = lerp(start.color[0], end.color[0], localT);
                const g = lerp(start.color[1], end.color[1], localT);
                const b = lerp(start.color[2], end.color[2], localT);
                return rgbToHex(r, g, b);
            }
        }
        return "#ff0000";
    };

    const colorA = getColor(pressureA);
    const colorB = getColor(pressureB);

    // --- Dot Animation Logic ---
    const renderDots = (path: string, flow: number) => {
        if (Math.abs(flow) < 0.01) return null;

        const normFlow = Math.max(-1, Math.min(1, flow / maxFlow));
        const numDots = 8;

        // Speed scaling: 
        // Let's say at max flow, dots travel full path in 2 seconds (120 frames)
        // t = (frame * speed) % 1
        // Speed factor needs to be tuned. 
        const speed = normFlow * 0.01;

        const dots = [];
        for (let i = 0; i < numDots; i++) {
            // Offset each dot
            const initialOffset = i / numDots;
            let t = (frame * speed + initialOffset) % 1;
            if (t < 0) t += 1; // Handle negative flow direction

            const pos = getPointOnPolyline(path, t);
            dots.push(
                <circle
                    key={i}
                    cx={pos.x}
                    cy={pos.y}
                    r={dotSize}
                    fill={dotColor}
                    opacity={0.8}
                />
            );
        }
        return dots;
    };

    return (
        <svg style={{ position: "absolute", width: "100%", height: "100%", pointerEvents: "none", zIndex: 0 }}>
            <defs>
                <linearGradient id="pipeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#718096" />
                    <stop offset="50%" stopColor="#a0aec0" />
                    <stop offset="100%" stopColor="#718096" />
                </linearGradient>
                <filter id="pipeShadow">
                    <feDropShadow dx="2" dy="2" stdDeviation="2" floodColor="#000000" floodOpacity="0.3" />
                </filter>
            </defs>

            {/* --- Pipe A --- */}
            <g>
                {/* Fluid Core */}
                <path
                    d={pathA}
                    fill="none"
                    stroke={colorA}
                    strokeWidth={lineThickness - 2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={fluidOpacity}
                />
                {/* Metallic Shell */}
                <path
                    d={pathA}
                    fill="none"
                    stroke="url(#pipeGradient)"
                    strokeWidth={lineThickness}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="url(#pipeShadow)"
                    opacity={0.3}
                />
                {/* Flow Dots */}
                {renderDots(pathA, flowA)}
            </g>

            {/* --- Pipe B --- */}
            <g>
                {/* Fluid Core */}
                <path
                    d={pathB}
                    fill="none"
                    stroke={colorB}
                    strokeWidth={lineThickness - 2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={fluidOpacity}
                />
                {/* Metallic Shell */}
                <path
                    d={pathB}
                    fill="none"
                    stroke="url(#pipeGradient)"
                    strokeWidth={lineThickness}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="url(#pipeShadow)"
                    opacity={0.3}
                />
                {/* Flow Dots */}
                {renderDots(pathB, flowB)}
            </g>
        </svg>
    );
};
