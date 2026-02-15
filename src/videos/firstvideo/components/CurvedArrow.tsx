import React from "react";

export interface CurvedArrowProps {
    start: { x: number; y: number };
    end: { x: number; y: number };
    controlPoint?: { x: number; y: number }; // Optional Quadratic Bezier control point
    color?: string;
    thickness?: number;
    arrowSize?: number;
    opacity?: number;
    // Animation progress (0 to 1) for drawing path
    progress?: number;
}

export const CurvedArrow: React.FC<CurvedArrowProps> = ({
    start,
    end,
    controlPoint,
    color = "white",
    thickness = 3,
    arrowSize = 15,
    opacity = 1,
    progress = 1,
}) => {
    // Determine path string
    let pathD = "";
    let angle = 0;

    if (controlPoint) {
        // Quadratic Bezier
        pathD = `M ${start.x} ${start.y} Q ${controlPoint.x} ${controlPoint.y} ${end.x} ${end.y}`;

        // Calculate angle at the end for arrow head
        // Derivative of Quadratic Bezier: B'(t) = 2(1-t)(P1-P0) + 2t(P2-P1)
        // At t=1: B'(1) = 2(P2-P1)
        const dx = end.x - controlPoint.x;
        const dy = end.y - controlPoint.y;
        angle = Math.atan2(dy, dx);
    } else {
        // Straight Line
        pathD = `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        angle = Math.atan2(dy, dx);
    }

    // Arrow Head Points (Triangle)
    // Tip at (0,0), Base at (-size, -size/2) and (-size, size/2)
    // Rotate and translate to end point
    const headPoints = [
        { x: 0, y: 0 },
        { x: -arrowSize, y: -arrowSize / 2 },
        { x: -arrowSize * 0.8, y: 0 }, // Slight indent for style
        { x: -arrowSize, y: arrowSize / 2 },
    ];

    const transformPoint = (p: { x: number; y: number }) => {
        // Rotate
        const xRot = p.x * Math.cos(angle) - p.y * Math.sin(angle);
        const yRot = p.x * Math.sin(angle) + p.y * Math.cos(angle);
        // Translate
        return { x: xRot + end.x, y: yRot + end.y };
    };

    const transformedHead = headPoints.map(transformPoint);
    const headPath = `M ${transformedHead[0].x} ${transformedHead[0].y} L ${transformedHead[1].x} ${transformedHead[1].y} L ${transformedHead[2].x} ${transformedHead[2].y} L ${transformedHead[3].x} ${transformedHead[3].y} Z`;

    return (
        <g style={{ opacity }}>
            <path
                d={pathD}
                fill="none"
                stroke={color}
                strokeWidth={thickness}
                strokeLinecap="round"
                strokeDasharray={progress < 1 ? "1000" : undefined}
                strokeDashoffset={progress < 1 ? 1000 * (1 - progress) : undefined}
            />
            {progress > 0.9 && ( // Only show head near end of draw
                <path
                    d={headPath}
                    fill={color}
                    stroke="none"
                />
            )}
        </g>
    );
};
