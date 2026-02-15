import React from "react";

export type StrokeType = "solid" | "dashed" | "dotted" | "pointed";

export interface GraphStyle {
    strokeWidth?: number;      // default 3
    strokeColor?: string;      // default "#ffffff"
    strokeType?: StrokeType;   // default "solid"
    opacity?: number;          // default 1
}

export interface AxisConfig {
    showAxis?: boolean;        // default true
    axisThickness?: number;    // default 3
    axisColor?: string;        // default "#ffffff"

    showTicks?: boolean;       // default true
    tickLength?: number;       // default 8
    tickThickness?: number;    // default 2
    tickStep?: number;         // tick spacing in axis units (default auto)
    tickColor?: string;        // default same as axisColor

    showNumbers?: boolean;     // default true
    numberStep?: number;       // label spacing in axis units (default auto)
    numberFontSize?: number;   // default 16
    numberColor?: string;      // default "#ffffff"
    numberPrecision?: number;  // default 0

    showTip?: boolean;         // default true (arrow head)
    tipSize?: number;          // default 10
}

export interface GridConfig {
    showGrid?: boolean;        // default true/false (parameter)
    majorStep?: number;        // in axis units (default auto)
    xMajorStep?: number;       // override for X axis (default majorStep)
    yMajorStep?: number;       // override for Y axis (default majorStep)
    minorStep?: number;        // in axis units (default auto or disabled)
    majorColor?: string;       // default "rgba(255,255,255,0.15)"
    minorColor?: string;       // default "rgba(255,255,255,0.07)"
    majorThickness?: number;   // default 1
    minorThickness?: number;   // default 1
    opacity?: number;          // default 1
    strokeDasharray?: string;  // default "none" aka undefined
    strokeStyle?: StrokeType;  // default "solid"
}

export interface NumberPlane2DProps {
    x: number;                 // position in scene (top-left)
    y: number;
    width: number;
    height: number;

    xRange: [number, number];
    yRange: [number, number];

    xLabel?: string;
    yLabel?: string;

    // Label Offsets
    xLabelDx?: number;
    xLabelDy?: number;
    yLabelDx?: number;
    yLabelDy?: number;

    // Title
    title?: string;
    showTitle?: boolean;
    titleDx?: number;
    titleDy?: number;
    titleColor?: string;
    titleFontSize?: number;

    grid?: GridConfig;
    xAxisConfig?: AxisConfig;
    yAxisConfig?: AxisConfig;

    /**
     * xValues and yValues are arrays of series.
     * xValues can be 1D array (shared) or 2D array (per series).
     */
    xValues: number[] | number[][];
    yValues: number[][];

    graphStyles?: Record<number, GraphStyle>;

    clampToViewport?: boolean;   // default true
    showOrigin?: boolean;        // default true
    backgroundFill?: string;     // default "transparent"
    padding?: number;            // default 20
}

// --- Helper: Nice Number Steps ---
const getNiceStep = (range: number, targetTicks = 5) => {
    const rawStep = range / targetTicks;
    const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const normalized = rawStep / mag;
    let step;
    if (normalized < 1.5) step = 1 * mag;
    else if (normalized < 3.5) step = 2 * mag;
    else if (normalized < 7.5) step = 5 * mag;
    else step = 10 * mag;
    return step;
};

// --- Helper: Format Number ---
const formatNumber = (num: number, precision = 0) => {
    if (Math.abs(num) < 1e-10) return "0";
    // Check if integer
    if (Number.isInteger(num) && precision === 0) return num.toString();
    return num.toFixed(precision);
};

export const NumberPlane2D: React.FC<NumberPlane2DProps> = ({
    x,
    y,
    width,
    height,
    xRange,
    yRange,
    xLabel,
    yLabel,
    grid = {},
    xAxisConfig = {},
    yAxisConfig = {},
    xValues,
    yValues,
    graphStyles = {},
    clampToViewport = true,
    showOrigin = true,
    backgroundFill = "transparent",
    padding = 20,

    xLabelDx = 0,
    xLabelDy = 0,
    yLabelDx = 0,
    yLabelDy = 0,

    title,
    showTitle = false,
    titleDx = 0,
    titleDy = 0,
    titleColor = "#ffffff",
    titleFontSize = 24,
}) => {
    // 1. Setup Coordinate System
    const [xMin, xMax] = xRange;
    const [yMin, yMax] = yRange;
    const xSpan = xMax - xMin;
    const ySpan = yMax - yMin;

    // Use padding inside the viewbox
    const plotX = padding;
    const plotY = padding;
    const plotW = width - 2 * padding;
    const plotH = height - 2 * padding;

    // Mapping Functions
    const mapX = (val: number) => plotX + ((val - xMin) / xSpan) * plotW;
    // SVG Y is inverted (0 at top), Math Y is normal (0 at bottom)
    const mapY = (val: number) => plotY + plotH - ((val - yMin) / ySpan) * plotH;

    // 2. Compute Ticks & Grid Steps (Auto if needed)
    const xStep = xAxisConfig.tickStep || getNiceStep(xSpan, 8);
    const yStep = yAxisConfig.tickStep || getNiceStep(ySpan, 5);

    const xGridStep = grid.xMajorStep || grid.majorStep || xStep;
    const yGridStep = grid.yMajorStep || grid.majorStep || yStep;

    // Generate Tick/Grid Values
    const getTicks = (min: number, max: number, step: number) => {
        const start = Math.ceil(min / step) * step;
        const ticks = [];
        for (let v = start; v <= max + 1e-9; v += step) {
            ticks.push(v);
        }
        return ticks;
    };

    const xGridTicks = getTicks(xMin, xMax, xGridStep);
    const yGridTicks = getTicks(yMin, yMax, yGridStep);

    // Axis Ticks
    const xAxisTicks = getTicks(xMin, xMax, xStep);
    const yAxisTicks = getTicks(yMin, yMax, yStep);


    // 3. Grid Rendering
    const renderGrid = () => {
        if (grid.showGrid === false) return null;

        const stroke = grid.majorColor || "rgba(255,255,255,0.15)";

        let dashArray = grid.strokeDasharray;
        if (!dashArray && grid.strokeStyle) {
            if (grid.strokeStyle === "dashed") dashArray = "10,5";
            else if (grid.strokeStyle === "dotted") dashArray = "2,4";
        }

        return (
            <g className="grid">
                {/* Vertical Lines */}
                {xGridTicks.map(val => {
                    const px = mapX(val);
                    return (
                        <line
                            key={`v${val}`}
                            x1={px} y1={plotY}
                            x2={px} y2={plotY + plotH}
                            stroke={stroke}
                            strokeWidth={grid.majorThickness || 1}
                            strokeOpacity={grid.opacity ?? 1}
                            strokeDasharray={dashArray}
                        />
                    );
                })}
                {/* Horizontal Lines */}
                {yGridTicks.map(val => {
                    const py = mapY(val);
                    return (
                        <line
                            key={`h${val}`}
                            x1={plotX} y1={py}
                            x2={plotX + plotW} y2={py}
                            stroke={stroke}
                            strokeWidth={grid.majorThickness || 1}
                            strokeOpacity={grid.opacity ?? 1}
                            strokeDasharray={dashArray}
                        />
                    );
                })}
            </g>
        );
    };

    // 4. Axis Rendering
    const renderAxes = () => {
        // Determine Axis Positions (Screen Coords)
        // If 0 is in range, use map(0). If not, clamp to edge.

        // Clamp logic for off-screen origin
        // If Y=0 is above view (yMin > 0), axis should be at bottom? No, typically hidden or at bottom edge.
        // Let's stick to "Draw at 0". If 0 is outside, we might not see it, or we clamp it.
        // Standard behavior: Axis stays at 0. If 0 is off screen, axis is off screen.
        // Exception: If we want a "frame", that's different.
        // If user wants to see axis even if 0 is far away, they usually pan.
        // We will draw at 0. But we might adding "Frame" option later.

        // Render X Axis (Horizontal line at Y=0)
        const renderXAxis = () => {
            if (xAxisConfig.showAxis === false) return null;
            // Actually Math-like behavior: Axis is at y=0. If y=0 is not in view, you don't see the line.

            // However, for tick drawing, we usually want ticks at the bottom/left if axis is gone.
            // Let's assume standard behavior: Ticks attached to axis line.
            // If axis line is off screen, we assume user adjusted range comfortably.

            // Re-eval: Drawing axis at mapY(0).
            // Fallback: If 0 not visible, draw at edge?
            // "If origin is outside range, still draw axes at the nearest boundary" -> OK.

            let finalAxisY = mapY(0);
            if (yMin > 0) finalAxisY = mapY(yMin);
            else if (yMax < 0) finalAxisY = mapY(yMax);

            const color = xAxisConfig.axisColor || "#ffffff";

            return (
                <g className="x-axis">
                    <line
                        x1={plotX} y1={finalAxisY}
                        x2={plotX + plotW} y2={finalAxisY}
                        stroke={color}
                        strokeWidth={xAxisConfig.axisThickness || 3}
                    />
                    {/* Ticks */}
                    {xAxisConfig.showTicks !== false && xAxisTicks.map(val => {
                        const px = mapX(val);
                        // Don't draw tick at intersection if it clutters?
                        return (
                            <line
                                key={`xt${val}`}
                                x1={px} y1={finalAxisY - (xAxisConfig.tickLength || 8) / 2}
                                x2={px} y2={finalAxisY + (xAxisConfig.tickLength || 8) / 2}
                                stroke={xAxisConfig.tickColor || color}
                                strokeWidth={xAxisConfig.tickThickness || 2}
                            />
                        );
                    })}
                    {/* Numbers */}
                    {xAxisConfig.showNumbers !== false && xAxisTicks.map(val => {
                        const px = mapX(val);
                        if (Math.abs(val) < 1e-9 && showOrigin) return null; // Skip 0 if we handle origin separately

                        return (
                            <text
                                key={`xn${val}`}
                                x={px}
                                y={finalAxisY + 25} // Below axis
                                fill={xAxisConfig.numberColor || "#ffffff"}
                                fontSize={xAxisConfig.numberFontSize || 16}
                                textAnchor="middle"
                                fontFamily="sans-serif"
                            >
                                {formatNumber(val, xAxisConfig.numberPrecision)}
                            </text>
                        );
                    })}
                    {/* Label */}
                    {xLabel && (
                        <text
                            x={plotX + plotW - 10 + xLabelDx}
                            y={finalAxisY - 10 + xLabelDy}
                            fill={xAxisConfig.numberColor || "#ffffff"}
                            fontSize={18}
                            textAnchor="end"
                            fontWeight="bold"
                        >
                            {xLabel}
                        </text>
                    )}
                    {/* Tip */}
                    {xAxisConfig.showTip !== false && (
                        <polygon
                            points={`${plotX + plotW},${finalAxisY} ${plotX + plotW - 10},${finalAxisY - 5} ${plotX + plotW - 10},${finalAxisY + 5}`}
                            fill={color}
                        />
                    )}
                </g>
            );
        };

        // Render Y Axis (Vertical line at X=0)
        const renderYAxis = () => {
            if (yAxisConfig.showAxis === false) return null;

            let finalAxisX = mapX(0);
            // Clamp to edges if 0 is out
            if (xMin > 0) finalAxisX = mapX(xMin);
            else if (xMax < 0) finalAxisX = mapX(xMax);

            const color = yAxisConfig.axisColor || "#ffffff";

            return (
                <g className="y-axis">
                    <line
                        x1={finalAxisX} y1={plotY}
                        x2={finalAxisX} y2={plotY + plotH}
                        stroke={color}
                        strokeWidth={yAxisConfig.axisThickness || 3}
                    />
                    {/* Ticks */}
                    {yAxisConfig.showTicks !== false && yAxisTicks.map(val => {
                        const py = mapY(val);
                        return (
                            <line
                                key={`yt${val}`}
                                x1={finalAxisX - (yAxisConfig.tickLength || 8) / 2}
                                y1={py}
                                x2={finalAxisX + (yAxisConfig.tickLength || 8) / 2}
                                y2={py}
                                stroke={yAxisConfig.tickColor || color}
                                strokeWidth={yAxisConfig.tickThickness || 2}
                            />
                        );
                    })}
                    {/* Numbers */}
                    {yAxisConfig.showNumbers !== false && yAxisTicks.map(val => {
                        const py = mapY(val);
                        if (Math.abs(val) < 1e-9 && showOrigin) return null;

                        return (
                            <text
                                key={`yn${val}`}
                                x={finalAxisX - 15} // Left of axis
                                y={py + 5} // Centered vertically approx
                                fill={yAxisConfig.numberColor || "#ffffff"}
                                fontSize={yAxisConfig.numberFontSize || 16}
                                textAnchor="end"
                                fontFamily="sans-serif"
                            >
                                {formatNumber(val, yAxisConfig.numberPrecision)}
                            </text>
                        );
                    })}
                    {/* Label */}
                    {yLabel && (
                        <text
                            x={finalAxisX + 10 + yLabelDx}
                            y={plotY + 20 + yLabelDy}
                            fill={yAxisConfig.numberColor || "#ffffff"}
                            fontSize={18}
                            textAnchor="start"
                            fontWeight="bold"
                        >
                            {yLabel}
                        </text>
                    )}
                    {/* Tip */}
                    {yAxisConfig.showTip !== false && (
                        <polygon
                            points={`${finalAxisX},${plotY} ${finalAxisX - 5},${plotY + 10} ${finalAxisX + 5},${plotY + 10}`}
                            fill={color}
                        />
                    )}
                </g>
            );
        };

        return (
            <g>
                {renderXAxis()}
                {renderYAxis()}
                {showOrigin && (
                    <circle cx={mapX(0)} cy={mapY(0)} r={3} fill="#ffffff" />
                )}
            </g>
        );
    };


    // 5. Plot Rendering
    const renderPlots = () => {
        return yValues.map((seriesY, seriesIdx) => {
            const style = graphStyles[seriesIdx] || { strokeColor: "#ffffff", strokeWidth: 3, strokeType: "solid" };

            // Resolve X Values
            let seriesX: number[] = [];
            if (Array.isArray(xValues[0])) {
                // xValues is number[][]
                seriesX = (xValues as number[][])[seriesIdx] || [];
            } else {
                // xValues is number[]
                seriesX = xValues as number[];
            }

            if (!seriesX || !seriesY || seriesX.length < 2 || seriesY.length < 2) return null;

            const len = Math.min(seriesX.length, seriesY.length);

            // Generator Path Data
            // M x y L x y ...
            // We can optimize string generation
            let d = "";
            const renderedPoints = [];

            for (let i = 0; i < len; i++) {
                const rawX = seriesX[i];
                const rawY = seriesY[i];

                // Viewport Clamping (Optional but good for performance if plot is huge)
                // But simply mapping is safer for polyline continuity
                const px = mapX(rawX);
                const py = mapY(rawY);

                renderedPoints.push({ x: px, y: py });

                if (i === 0) d += `M ${px.toFixed(1)} ${py.toFixed(1)}`;
                else d += ` L ${px.toFixed(1)} ${py.toFixed(1)}`;
            }

            const strokeColor = style.strokeColor || "#ffffff";
            const strokeWidth = style.strokeWidth || 3;
            const opacity = style.opacity ?? 1;

            if (style.strokeType === "pointed") {
                return (
                    <g key={`plot-${seriesIdx}`} opacity={opacity}>
                        {renderedPoints.map((pt, i) => (
                            <circle key={i} cx={pt.x} cy={pt.y} r={strokeWidth} fill={strokeColor} />
                        ))}
                    </g>
                );
            }

            // Handle dashed/dotted
            const dashArray = style.strokeType === "dashed" ? "10,5" :
                style.strokeType === "dotted" ? "2,4" : undefined;

            return (
                <path
                    key={`plot-${seriesIdx}`}
                    d={d}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeDasharray={dashArray}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={opacity}
                    vectorEffect="non-scaling-stroke"
                />
            );
        });
    };

    return (
        <svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            style={{
                position: "absolute",
                left: x,
                top: y,
                overflow: "visible",
                backgroundColor: backgroundFill
            }}
        >
            {/* 1. Grid (Bottom Layer) */}
            {renderGrid()}

            {/* 2. Axes */}
            {renderAxes()}

            {/* 3. Plots (Top Layer) */}
            {renderPlots()}

            {/* 4. Title */}
            {showTitle && title && (
                <text
                    x={width / 2 + titleDx}
                    y={30 + titleDy}
                    fill={titleColor}
                    fontSize={titleFontSize}
                    textAnchor="middle"
                    fontWeight="bold"
                    fontFamily="sans-serif"
                >
                    {title}
                </text>
            )}
        </svg>
    );
};
