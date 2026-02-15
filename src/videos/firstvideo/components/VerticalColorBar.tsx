import React from 'react';

export interface VerticalColorBarProps {
    width: number;          // bar width in px
    height: number;         // bar height in px
    maxValue: number;       // maximum value of the scale

    // Independent values for left and right indicators
    valueLeft: number;
    valueRight: number;

    // Optional titles (e.g. "Pos", "Load")
    labelLeft?: string;
    labelRight?: string;

    // Position in the scene (top-left anchor)
    x: number;
    y: number;

    // Optional styling
    strokeWidth?: number;   // default 2
    borderRadius?: number;  // default 10
    fontSize?: number;      // default 18 (for single line fallback)
}

export const VerticalColorBar: React.FC<VerticalColorBarProps> = ({
    width,
    height,
    maxValue,
    valueLeft,
    valueRight,
    labelLeft,
    labelRight,
    x,
    y,
    strokeWidth = 2,
    borderRadius = 10,
    fontSize = 18,
}) => {
    // Helper to calculate Y position and values
    const calcIndicator = (val: number, labelTitle?: string) => {
        const safeValue = Math.max(0, Math.min(val, maxValue));
        const t = maxValue > 0 ? safeValue / maxValue : 0;
        // 0 at bottom (height), max at top (0)
        const yPos = height - (t * height);

        const valueText = maxValue >= 1000
            ? Math.round(safeValue).toString()
            : safeValue.toFixed(1);

        return { yPos, labelTitle, valueText };
    };

    const left = calcIndicator(valueLeft, labelLeft);
    const right = calcIndicator(valueRight, labelRight);

    // Dimensions
    const triangleSize = 12;
    const labelWidth = 80;
    const labelHeight = 44; // Increased for 2 lines
    const labelGap = 8;
    const halfLabelH = labelHeight / 2;

    // Clamp label Y positions
    const clampY = (y: number) => Math.max(halfLabelH, Math.min(y, height - halfLabelH));

    const leftLabelY = clampY(left.yPos);
    const rightLabelY = clampY(right.yPos);

    // Content renderer
    const renderLabelContent = (item: { labelTitle?: string, valueText: string }) => (
        <>
            <rect
                width={labelWidth}
                height={labelHeight}
                rx={4}
                fill="#1a1a1a"
                stroke="#888"
                strokeWidth={1}
                filter="url(#labelShadow)"
            />
            {item.labelTitle ? (
                <>
                    <text
                        x={labelWidth / 2}
                        y={15}
                        fill="#aaa"
                        fontSize={13}
                        fontFamily="Inter, sans-serif"
                        fontWeight="600"
                        textAnchor="middle"
                    >
                        {item.labelTitle}
                    </text>
                    <text
                        x={labelWidth / 2}
                        y={34}
                        fill="#fff"
                        fontSize={17}
                        fontFamily="monospace"
                        fontWeight="bold"
                        textAnchor="middle"
                    >
                        {item.valueText}
                    </text>
                </>
            ) : (
                <text
                    x={labelWidth / 2}
                    y={labelHeight / 2}
                    fill="#eee"
                    fontSize={fontSize}
                    fontFamily="monospace"
                    fontWeight="bold"
                    textAnchor="middle"
                    dominantBaseline="central"
                >
                    {item.valueText}
                </text>
            )}
        </>
    );

    return (
        <svg
            width={width + 300}
            height={height + 50}
            style={{
                position: 'absolute',
                left: x - 150,
                top: y - 25,
                overflow: 'visible',
            }}
            xmlns="http://www.w3.org/2000/svg"
        >
            <defs>
                <linearGradient id="barGradient" x1="0%" y1="100%" x2="0%" y2="0%">
                    <stop offset="0%" stopColor="#0000ff" />
                    <stop offset="33%" stopColor="#00ff00" />
                    <stop offset="66%" stopColor="#ffff00" />
                    <stop offset="100%" stopColor="#ff0000" />
                </linearGradient>

                <filter id="labelShadow">
                    <feDropShadow dx="1" dy="1" stdDeviation="1" floodOpacity="0.5" />
                </filter>
            </defs>

            <g transform="translate(150, 25)">

                {/* Main Bar */}
                <rect
                    x={0}
                    y={0}
                    width={width}
                    height={height}
                    rx={borderRadius}
                    ry={borderRadius}
                    fill="url(#barGradient)"
                    stroke="#ffffff"
                    strokeWidth={strokeWidth}
                />

                {/* Inner Highlight */}
                <rect
                    x={strokeWidth}
                    y={strokeWidth}
                    width={Math.max(0, width - strokeWidth * 2)}
                    height={Math.max(0, height - strokeWidth * 2)}
                    rx={Math.max(0, borderRadius - 1)}
                    ry={Math.max(0, borderRadius - 1)}
                    fill="none"
                    stroke="rgba(255,255,255,0.3)"
                    strokeWidth={2}
                />

                {/* --- Max Value (Top) --- */}
                <text
                    x={width / 2}
                    y={-12}
                    fill="#ccc"
                    fontSize={18}
                    fontFamily="monospace"
                    fontWeight="bold"
                    textAnchor="middle"
                >
                    {maxValue >= 1000 ? Math.round(maxValue) : maxValue.toFixed(1)}
                </text>

                {/* --- Min Value (Bottom) --- */}
                <text
                    x={width / 2}
                    y={height + 20}
                    fill="#ccc"
                    fontSize={18}
                    fontFamily="monospace"
                    fontWeight="bold"
                    textAnchor="middle"
                >
                    0.0
                </text>

                {/* --- Left Indicator Group --- */}
                <path
                    d={`M -${triangleSize * 1.5},${left.yPos - triangleSize / 2} 
                        L -2,${left.yPos} 
                        L -${triangleSize * 1.5},${left.yPos + triangleSize / 2} Z`}
                    fill="#333"
                    stroke="#fff"
                    strokeWidth={1}
                />
                <g transform={`translate(-${triangleSize * 1.5 + labelGap + labelWidth}, ${leftLabelY - labelHeight / 2})`}>
                    {renderLabelContent(left)}
                </g>

                {/* --- Right Indicator Group --- */}
                <path
                    d={`M ${width + triangleSize * 1.5},${right.yPos - triangleSize / 2} 
                        L ${width + 2},${right.yPos} 
                        L ${width + triangleSize * 1.5},${right.yPos + triangleSize / 2} Z`}
                    fill="#333"
                    stroke="#fff"
                    strokeWidth={1}
                />
                <g transform={`translate(${width + triangleSize * 1.5 + labelGap}, ${rightLabelY - labelHeight / 2})`}>
                    {renderLabelContent(right)}
                </g>

            </g>
        </svg>
    );
};
