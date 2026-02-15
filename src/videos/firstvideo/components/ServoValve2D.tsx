import React from "react";

export interface ServoValve2DProps {
    width?: number;
    height?: number;
    strokeWidth?: number;
    /**
     * Spool position in percent:
     * -100 = fully negative (P->B, A->T)
     *    0 = closed center (All blocked)
     * +100 = fully positive (P->A, B->T)
     */
    spool?: number; // range [-100, +100]
    x?: number;
    y?: number;
    scale?: number;
    P_Value?: number; // Pressure for P channel
    T_Value?: number; // Pressure for T channel
    A_Pressure?: number; // Pressure for A channel
    B_Pressure?: number; // Pressure for B channel
    maxP?: number; // Max pressure for color scaling
}

export const ServoValve2D: React.FC<ServoValve2DProps> = ({
    width = 900,
    height = 260,
    strokeWidth = 3,
    spool = 0,
    x,
    y,
    scale = 1,
    P_Value = 0,
    T_Value = 0,
    A_Pressure = 0,
    B_Pressure = 0,
    maxP = 300,
}) => {
    // Clamp spool value
    const clampedSpool = Math.max(-100, Math.min(100, spool));

    // --- Dimensions & Layout Strategy ---
    // Using a fixed internal coordinate system (ViewBox) 
    // and scaling via SVG width/height props.
    // ViewBox: 0 0 900 260

    const vbW = 900;
    const vbH = 260;

    // Valve Body Dimensions
    const bodyPadding = 10;
    const bodyW = vbW - 2 * bodyPadding;
    const bodyH = 200; // Main block height
    const bodyX = bodyPadding;
    const bodyY = (vbH - bodyH) / 2; // Centered vertically

    // Spool Bore Dimensions
    // The bore runs through the center of the block.
    // 5 chambers: T_left, A, P, B, T_right
    const boreHeight = 80;
    const boreY = bodyY + (bodyH - boreHeight) / 2;
    const chamberWidth = bodyW / 9; // Divide into slots roughly
    // Construct simplified geometry for the bore:
    // We need lands and grooves.

    // Spool Geometry
    // The spool slides left/right.
    // Max mechanical slide = chamberWidth (approx).
    // 100% signal => move by 1 chamber width (roughly).
    const maxTravel = chamberWidth * 0.8;
    const currentOffset = (clampedSpool / 100) * maxTravel;

    // Land Dimensions (Static width, dynamic X)
    const landWidth = chamberWidth;

    // Land 2 (Seals A/P separation) - Base Center 30%
    const land2BaseX = bodyX + bodyW * 0.3;
    const land2CenterX = land2BaseX + currentOffset;
    const land2Left = land2CenterX - landWidth / 2;
    const land2Right = land2CenterX + landWidth / 2;

    // Land 3 (Seals P/B separation) - Base Center 70%
    const land3BaseX = bodyX + bodyW * 0.7;
    const land3CenterX = land3BaseX + currentOffset;
    const land3Left = land3CenterX - landWidth / 2;
    const land3Right = land3CenterX + landWidth / 2;

    // Bore Boundaries
    const boreLeftX = bodyX + 20;
    const boreRightX = bodyX + bodyW - 20;


    // Colors
    const colors = {
        bodyGradient: "url(#valveBodyGradient)",
        spoolGradient: "url(#spoolGradient)",
        stroke: "#2d3748", // Dark slate
        portText: "#1a202c",
        portConnector: "#4a5568",
    };

    // --- Helper for Port Connectors ---
    const PortConnector = ({
        x,
        y,
        label,
        isTop,
        dx = 0,
        dy = 0
    }: {
        x: number,
        y: number,
        label: string,
        isTop: boolean,
        dx?: number,
        dy?: number
    }) => (
        <g transform={`translate(${x}, ${y})`}>
            {/* Pipe stub */}
            <rect
                x={-15}
                y={isTop ? -30 : 0}
                width={30}
                height={30}
                fill={colors.portConnector}
                stroke={colors.stroke}
                strokeWidth={strokeWidth}
            />
            {/* Flange/Fitting */}
            <rect
                x={-20}
                y={isTop ? -5 : 0}
                width={40}
                height={5}
                fill="#2d3748"
                stroke="none"
            />
            {/* Label */}
            <text
                x={dx}
                y={(isTop ? -40 : 50) + dy}
                textAnchor="middle"
                fontFamily="Inter, Arial, sans-serif"
                fontWeight="bold"
                fontSize="60"
                fill="#ffffff"
            >
                {label}
            </text>
        </g>
    );

    // Helper for color interpolation (Blue -> Green -> Yellow -> Red)
    // Copied from HydraulicCylinder2D
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

    const colorP = getColor(P_Value);
    const colorT = getColor(T_Value);
    const colorA = getColor(A_Pressure);
    const colorB = getColor(B_Pressure);


    const style: React.CSSProperties = {
        overflow: "visible",
        ...(x !== undefined && { left: x }),
        ...(y !== undefined && { top: y }),
        position: (x !== undefined || y !== undefined) ? "absolute" : undefined,
    };

    return (
        <svg
            width={width * scale}
            height={height * scale}
            viewBox={`0 0 ${vbW} ${vbH}`}
            preserveAspectRatio="xMidYMid meet"
            style={style}
        >
            <defs>
                {/* Valve Body Gradient - Machined Steel block */}
                <linearGradient id="valveBodyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#e2e8f0" />
                    <stop offset="20%" stopColor="#d5dce6" />
                    <stop offset="50%" stopColor="#edf2f7" />
                    <stop offset="80%" stopColor="#d5dce6" />
                    <stop offset="100%" stopColor="#a0aec0" />
                </linearGradient>

                {/* Spool Gradient - Polished Steel / Chrome */}
                <linearGradient id="spoolGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#718096" />
                    <stop offset="20%" stopColor="#cbd5e0" />
                    <stop offset="50%" stopColor="#ffffff" />
                    <stop offset="80%" stopColor="#cbd5e0" />
                    <stop offset="100%" stopColor="#4a5568" />
                </linearGradient>
            </defs>

            {/* --- Valve Body (Manifold) --- */}
            <rect
                x={bodyX}
                y={bodyY}
                width={bodyW}
                height={bodyH}
                rx={10}
                ry={10}
                fill={colors.bodyGradient}
                stroke={colors.stroke}
                strokeWidth={strokeWidth}
            />

            {/* --- Ports Connectors --- */}
            {/* Port A - Top Left */}
            <PortConnector x={bodyX + bodyW * 0.3} y={bodyY} label="A" isTop={true} dx={50} />
            {/* Port B - Top Right */}
            <PortConnector x={bodyX + bodyW * 0.7} y={bodyY} label="B" isTop={true} dx={50} />

            {/* Port P - Bottom Center-ish */}
            <PortConnector x={bodyX + bodyW * 0.5} y={bodyY + bodyH} label="P 300[bar]" isTop={false} dy={40} />
            {/* Port T - Bottom Right/Left */}
            <PortConnector x={bodyX + bodyW * 0.15} y={bodyY + bodyH} label="T" isTop={false} dy={40} />
            <PortConnector x={bodyX + bodyW * 0.85} y={bodyY + bodyH} label="T" isTop={false} dy={40} />

            {/* --- Internal Bore Background (Pressure Colored Regions) --- */}

            {/* 1. T-Left Channel (Bore Left -> Land 2 Left) */}
            <rect
                x={boreLeftX}
                y={boreY}
                width={Math.max(0, land2Left - boreLeftX)}
                height={boreHeight}
                fill={colorT}
                stroke="none"
                opacity={1.0}
            />

            {/* 2. P-Center Channel (Land 2 Right -> Land 3 Left) */}
            <rect
                x={land2Right}
                y={boreY}
                width={Math.max(0, land3Left - land2Right)}
                height={boreHeight}
                fill={colorP}
                stroke="none"
                opacity={1.0}
            />

            {/* 3. T-Right Channel (Land 3 Right -> Bore Right) */}
            <rect
                x={land3Right}
                y={boreY}
                width={Math.max(0, boreRightX - land3Right)}
                height={boreHeight}
                fill={colorT}
                stroke="none"
                opacity={1.0}
            />


            {/* --- Spool Assembly --- */}
            <g transform={`translate(${currentOffset}, 0)`}>
                {/* Central Rod */}
                <rect
                    x={bodyX - 50} // Extend past body visually
                    y={boreY + boreHeight * 0.35}
                    width={bodyW + 100}
                    height={boreHeight * 0.3}
                    fill={colors.spoolGradient}
                    stroke={colors.stroke}
                    strokeWidth={1}
                />

                {/* Land 2 (Seals A/P separation) - Centered under A (30%) */}
                <rect
                    x={bodyX + bodyW * 0.3 - chamberWidth / 2} // Centered on 30% mark
                    y={boreY}
                    width={chamberWidth}
                    height={boreHeight}
                    fill={colors.spoolGradient}
                    stroke={colors.stroke}
                    strokeWidth={strokeWidth}
                    rx={2}
                />

                {/* Land 3 (Seals P/B separation) - Centered under B (70%) */}
                <rect
                    x={bodyX + bodyW * 0.7 - chamberWidth / 2} // Centered on 70% mark
                    y={boreY}
                    width={chamberWidth}
                    height={boreHeight}
                    fill={colors.spoolGradient}
                    stroke={colors.stroke}
                    strokeWidth={strokeWidth}
                    rx={2}
                />
            </g>

            {/* --- Flow Path Channels (Darker "drilled" holes) --- */}
            {/* These overlay the bore colors, providing context for the ports */}

            {/* Channel A (Top Left to Bore) */}
            <rect
                x={bodyX + bodyW * 0.3 - 15}
                y={bodyY}
                width={30}
                height={(bodyH - boreHeight) / 2}
                fill={colorA}
                opacity={1.0}
            />

            {/* Channel B (Top Right to Bore) */}
            <rect
                x={bodyX + bodyW * 0.7 - 15}
                y={bodyY}
                width={30}
                height={(bodyH - boreHeight) / 2}
                fill={colorB}
                opacity={1.0}
            />

            {/* Channel P (Bottom Center to Bore) */}
            <rect
                x={bodyX + bodyW * 0.5 - 15}
                y={boreY + boreHeight}
                width={30}
                height={(vbH - boreHeight) / 2}
                fill={colorP}
                opacity={1.0}
            />

            {/* Channel T_Left (Bottom Left to Bore) */}
            <rect
                x={bodyX + bodyW * 0.15 - 15}
                y={boreY + boreHeight}
                width={30}
                height={(vbH - boreHeight) / 2}
                fill={colorT}
                opacity={1.0}
            />

            {/* Channel T_Right (Bottom Right to Bore) */}
            <rect
                x={bodyX + bodyW * 0.85 - 15}
                y={boreY + boreHeight}
                width={30}
                height={(vbH - boreHeight) / 2}
                fill={colorT}
                opacity={1.0}
            />

        </svg>
    );
};
