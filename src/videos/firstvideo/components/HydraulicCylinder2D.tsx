import React from "react";

interface HydraulicCylinder2DProps {
    width?: number;
    height?: number;
    strokeWidth?: number; // Visual stroke width for outlines
    pistonPosition?: number; // 0 to 1 range, default 0.5
    angle?: number; // Rotation in degrees
    x?: number; // Horizontal position
    y?: number; // Vertical position
    portsSide?: "top" | "bottom"; // Side for the fluid ports
    p1?: number; // Pressure in piston side (cap end)
    p2?: number; // Pressure in rod side (rod end)
    maxP?: number; // Max pressure for color scaling (default 300)
    F?: number; // Force value (-1 to 1)
    F_scale?: number; // Visual scale factor for the arrow length (e.g. 100)
}

export const HydraulicCylinder2D: React.FC<HydraulicCylinder2DProps> = ({
    width = 300,
    height = 100,
    strokeWidth = 2,
    pistonPosition = 0.5,
    angle = 0,
    x,
    y,
    portsSide = "top",
    p1 = 0,
    p2 = 0,
    maxP = 300,
    F = 0,
    F_scale = 80,
}) => {
    // SVG ViewBox dimensions 
    const vbWidth = 400;
    const vbHeight = 150;

    // Cylinder Dimensions
    const cylinderLength = 200;
    const cylinderDiameter = 150;
    const cylinderX = 50;
    const cylinderY = (vbHeight - cylinderDiameter) / 2;
    const wallThickness = 6;

    // Rod Dimensions
    const rodDiameter = 80;
    const rodLength = 200;

    // Piston Dimensions
    const pistonWidth = 25;
    const pistonDiameter = cylinderDiameter - wallThickness * 2;

    // Calculate Piston X Position
    // Range: from left wall to right wall minus piston width
    const minPistonX = cylinderX + wallThickness;
    const maxPistonX = cylinderX + cylinderLength - wallThickness - pistonWidth;
    const currentPistonX = minPistonX + (maxPistonX - minPistonX) * Math.min(Math.max(pistonPosition, 0), 1);

    // Rod Position
    // Rod is attached to piston center and extends to the right
    const rodX = currentPistonX + pistonWidth;
    const rodY = (vbHeight - rodDiameter) / 2;

    // Colors
    const colors = {
        barrel: "url(#barrelGradient)",
        piston: "url(#pistonGradient)",
        rod: "url(#rodGradient)",
        port: "#3e6dbeff",
        stroke: "#2d3748",
    };

    const style: React.CSSProperties = {
        overflow: "visible",
        transform: `rotate(${angle}deg)`, // Use degrees directly
        transformOrigin: "center", // rotate around center
        ...(x !== undefined && { left: x }), // apply left if x is defined
        ...(y !== undefined && { top: y }), // apply top if y is defined
        position: (x !== undefined || y !== undefined) ? "absolute" : undefined, // set absolute if positioning is used
    };

    // Calculate Port Y position and direction based on portsSide
    const portY = portsSide === "top" ? cylinderY - 15 : cylinderY + cylinderDiameter + 15;
    const portRotation = portsSide === "top" ? 0 : 180;

    // Helper for color interpolation (Blue -> Green -> Yellow -> Red)
    const getColor = (p: number) => {
        const max = maxP || 300;

        // Normalize and clamp 0 → 1
        const t = Math.max(0, Math.min(p, max)) / max;

        // Gradient stops (exactly like SVG)
        const stops = [
            { offset: 0.0, color: [0, 0, 255] },   // Blue
            { offset: 0.33, color: [0, 255, 0] },   // Green
            { offset: 0.66, color: [255, 255, 0] }, // Yellow
            { offset: 1.0, color: [255, 0, 0] },   // Red
        ];

        // Helper functions
        const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
        const toHex = (c: number) => Math.round(c).toString(16).padStart(2, "0");
        const rgbToHex = (r: number, g: number, b: number) =>
            `#${toHex(r)}${toHex(g)}${toHex(b)}`;

        // Find active segment
        for (let i = 0; i < stops.length - 1; i++) {
            const start = stops[i];
            const end = stops[i + 1];

            if (t >= start.offset && t <= end.offset) {
                const localT =
                    (t - start.offset) / (end.offset - start.offset);

                const r = lerp(start.color[0], end.color[0], localT);
                const g = lerp(start.color[1], end.color[1], localT);
                const b = lerp(start.color[2], end.color[2], localT);

                return rgbToHex(r, g, b);
            }
        }

        // Fallback (should not happen)
        return "#ff0000";
    };

    const colorP1 = getColor(p1);
    const colorP2 = getColor(p2);
    const gapGradId = "pistonGapGradient";

    // --- Force Arrow Logic ---
    const renderForceArrow = () => {
        // Only hide if effectively 0
        if (Math.abs(F) < 0.001) return null;

        const isPositive = F > 0; // > 0: Extension (Left -> Right)

        // Enforce visible arrow even for very small F (0.01)
        // Arrow length = base (40px) + scaled magnitude
        const absF = Math.abs(F);
        const scale = F_scale || 80;

        // Length Scaling
        const baseLen = 40;
        const variableLen = absF * scale;
        const arrowLength = baseLen + variableLen;

        // Thickness Scaling (also using F_scale)
        // e.g. width grows by 30% of the length growth factor
        const baseWidth = 6;
        const variableWidth = absF * (scale * 0.3);
        const arrowWidth = baseWidth + variableWidth;

        // Head size proportional to thickness
        const arrowHeadSize = arrowWidth * 2.5;

        // Center Y
        const cy = cylinderY + cylinderDiameter / 2;

        let startX, endX;
        let headPoints;

        if (isPositive) {
            // Arrow in Cap End, pointing Right towards Piston
            // End point is slightly left of piston face
            endX = currentPistonX - 10;
            startX = endX - arrowLength;

            headPoints = `${endX},${cy} ${endX - arrowHeadSize},${cy - arrowHeadSize} ${endX - arrowHeadSize},${cy + arrowHeadSize}`;
        } else {
            // Arrow in Rod End, pointing Left towards Piston
            // End point is slightly right of piston face
            endX = currentPistonX + pistonWidth + 10;
            startX = endX + arrowLength;

            headPoints = `${endX},${cy} ${endX + arrowHeadSize},${cy - arrowHeadSize} ${endX + arrowHeadSize},${cy + arrowHeadSize}`;
        }

        return (
            <g>
                {/* Shaft */}
                <line
                    x1={startX}
                    y1={cy}
                    x2={isPositive ? endX - arrowHeadSize + 2 : endX + arrowHeadSize - 2}
                    y2={cy}
                    stroke="#ec0b0bff" // Amber/Yellow
                    strokeWidth={arrowWidth}
                    strokeLinecap="round"
                />
                {/* Head */}
                <polygon
                    points={headPoints}
                    fill="#ec0b0bff"
                />
            </g>
        );
    };


    return (
        <svg
            width={width}
            height={height}
            viewBox={`0 0 ${vbWidth} ${vbHeight}`}
            preserveAspectRatio="xMidYMid meet"
            style={style}
        >
            <defs>
                {/* Barrel Gradient */}
                <linearGradient id="barrelGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#e2e8f0" />
                    <stop offset="30%" stopColor="#cbd5e0" />
                    <stop offset="50%" stopColor="#edf2f7" />
                    <stop offset="70%" stopColor="#cbd5e0" />
                    <stop offset="100%" stopColor="#a0aec0" />
                </linearGradient>

                {/* Rod Gradient */}
                <linearGradient id="rodGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#80a6ebff" />
                    <stop offset="25%" stopColor="#a2bbe9ff" />
                    <stop offset="50%" stopColor="#ffffff" />
                    <stop offset="75%" stopColor="#a2bbe9ff" />
                    <stop offset="100%" stopColor="#80a6ebff" />
                </linearGradient>

                {/* Piston Gradient */}
                <linearGradient id="pistonGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#4a5568" />
                    <stop offset="50%" stopColor="#718096" />
                    <stop offset="100%" stopColor="#2d3748" />
                </linearGradient>

                {/* Piston Gap Gradient */}
                <linearGradient id={gapGradId} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={colorP1} />
                    <stop offset="100%" stopColor={colorP2} />
                </linearGradient>
            </defs>

            {/* --- Piston Gap Gradient (Behind Head) --- */}
            <rect
                x={currentPistonX}
                y={cylinderY}
                width={pistonWidth}
                height={cylinderDiameter}
                fill={`url(#${gapGradId})`}
                opacity={1.0}
            />

            {/* --- Cap End Chamber (Left of Piston) --- */}
            <rect
                x={cylinderX}
                y={cylinderY}
                width={Math.max(0, currentPistonX - cylinderX)}
                height={cylinderDiameter}
                rx={5} ry={5}
                fill={colorP1}
                opacity={1.0}
            />

            {/* --- Rod End Chamber (Right of Piston) --- */}
            <rect
                x={currentPistonX + pistonWidth}
                y={cylinderY}
                width={Math.max(0, (cylinderX + cylinderLength) - (currentPistonX + pistonWidth))}
                height={cylinderDiameter}
                rx={5} ry={5}
                fill={colorP2}
                opacity={1.0}
            />

            {/* --- Piston Rod --- */}
            <rect
                x={rodX}
                y={rodY}
                width={rodLength}
                height={rodDiameter}
                fill={colors.rod}
                stroke={colors.stroke}
                strokeWidth={strokeWidth}
            />

            {/* --- Piston Head --- */}
            <rect
                x={currentPistonX}
                y={cylinderY + wallThickness}
                width={pistonWidth}
                height={pistonDiameter}
                rx={2}
                ry={2}
                fill={colors.piston}
                stroke={colors.stroke}
                strokeWidth={strokeWidth}
            />

            {/* Piston Rings */}
            <line
                x1={currentPistonX + 8}
                y1={cylinderY + wallThickness}
                x2={currentPistonX + 8}
                y2={cylinderY + wallThickness + pistonDiameter}
                stroke="#2d3748"
                strokeWidth={1}
                opacity={0.5}
            />
            <line
                x1={currentPistonX + 17}
                y1={cylinderY + wallThickness}
                x2={currentPistonX + 17}
                y2={cylinderY + wallThickness + pistonDiameter}
                stroke="#2d3748"
                strokeWidth={1}
                opacity={0.5}
            />

            {/* --- Cylinder Barrel Body (Transparent/Outline Only) --- */}
            <path
                d={`
          M ${cylinderX},${cylinderY} 
          L ${cylinderX + cylinderLength},${cylinderY} 
          L ${cylinderX + cylinderLength},${cylinderY + cylinderDiameter} 
          L ${cylinderX},${cylinderY + cylinderDiameter} 
          Z
        `}
                fill="none"
                opacity={1.0}
                stroke={colors.stroke}
                strokeWidth={strokeWidth}
            />

            {/* --- Ports --- */}
            {/* Port 1 (Left / Cap End) */}
            <g transform={`translate(${cylinderX + 20}, ${portY}) rotate(${portRotation})`}>
                <rect x={-10} y={0} width={20} height={15} fill={colors.port} stroke={colors.stroke} strokeWidth={strokeWidth} />
                <rect x={-12} y={-5} width={24} height={5} fill={colors.port} stroke={colors.stroke} strokeWidth={strokeWidth} />
            </g>

            {/* Port 2 (Right / Rod End) */}
            <g transform={`translate(${cylinderX + cylinderLength - 30}, ${portY}) rotate(${portRotation})`}>
                <rect x={-10} y={0} width={20} height={15} fill={colors.port} stroke={colors.stroke} strokeWidth={strokeWidth} />
                <rect x={-12} y={-5} width={24} height={5} fill={colors.port} stroke={colors.stroke} strokeWidth={strokeWidth} />
            </g>

            {/* --- Rod Seal / End Cap --- */}
            <rect
                x={cylinderX + cylinderLength - 10}
                y={cylinderY}
                width={10}
                height={cylinderDiameter}
                fill="#a0aec0"
                stroke={colors.stroke}
                strokeWidth={strokeWidth}
            />
            <rect
                x={cylinderX + cylinderLength - 12}
                y={(vbHeight - rodDiameter) / 2 - 2}
                width={14}
                height={rodDiameter + 4}
                rx={2}
                fill="#4a5568"
                stroke={colors.stroke}
                strokeWidth={1}
            />

            {/* --- Main Outline --- */}
            <rect
                x={cylinderX}
                y={cylinderY}
                width={cylinderLength}
                height={cylinderDiameter}
                rx={5}
                ry={5}
                fill="none"
                stroke={colors.stroke}
                strokeWidth={strokeWidth}
            />

            {/* --- Force Arrow (Above everything) --- */}
            {renderForceArrow()}

        </svg>
    );
};
