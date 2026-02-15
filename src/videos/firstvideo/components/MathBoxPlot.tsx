import React from 'react';
import { useCurrentFrame } from 'remotion';

interface MathBoxPlotProps {
    width?: number;
    height?: number;
    x?: number;
    y?: number;
    getValueAtFrame: (frame: number) => number;
    title?: string;
    yMin?: number;
    yMax?: number;
    totalFrames?: number;
    lineColor?: string;
    fps?: number;
}

export const MathBoxPlot: React.FC<MathBoxPlotProps> = ({
    width = 600,
    height = 500,
    x = 0,
    y = 0,
    getValueAtFrame,
    title = 'Rod Position',
    yMin = 0,
    yMax = 1,
    totalFrames = 600,
    lineColor = '#38bdf8',
    fps = 60,
}) => {
    const frame = useCurrentFrame();

    // ── Layout ──
    const pad = { top: 50, right: 30, bottom: 60, left: 80 };
    const plotW = width - pad.left - pad.right;
    const plotH = height - pad.top - pad.bottom;
    const totalDuration = totalFrames / fps;

    // ── Mapping helpers ──
    const mapX = (f: number) => pad.left + (f / totalFrames) * plotW;
    const mapY = (val: number) => {
        const t = (val - yMin) / (yMax - yMin);
        return pad.top + plotH - t * plotH;
    };

    // ── Grid config ──
    const yDivisions = 5;
    const xDivisions = 6;

    // ── Build polyline points (only up to current frame) ──
    const maxFrame = Math.min(frame, totalFrames);
    const step = Math.max(1, Math.floor(totalFrames / 600));
    const polylinePoints: string[] = [];
    let lastVal = yMin;
    for (let f = 0; f <= maxFrame; f += step) {
        const val = getValueAtFrame(f);
        polylinePoints.push(`${mapX(f)},${mapY(val)}`);
        lastVal = val;
    }
    if (maxFrame % step !== 0) {
        lastVal = getValueAtFrame(maxFrame);
        polylinePoints.push(`${mapX(maxFrame)},${mapY(lastVal)}`);
    }
    const polylineStr = polylinePoints.join(' ');

    const headX = mapX(maxFrame);
    const headY = mapY(lastVal);

    const fillPoints = `${mapX(0)},${mapY(yMin)} ${polylineStr} ${mapX(maxFrame)},${mapY(yMin)}`;

    return (
        <div
            style={{
                position: 'absolute',
                left: x,
                top: y,
                width,
                height,
            }}
        >
            <svg
                width={width * 2}
                height={height * 2}
                style={{ width: '100%', height: '100%' }}
                viewBox={`0 0 ${width} ${height}`}
                xmlns="http://www.w3.org/2000/svg"
                shapeRendering="geometricPrecision"
                textRendering="geometricPrecision"
            >
                <defs>
                    <linearGradient id="plotBg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0f172a" />
                        <stop offset="100%" stopColor="#1e293b" />
                    </linearGradient>
                    <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={lineColor} stopOpacity={0.25} />
                        <stop offset="100%" stopColor={lineColor} stopOpacity={0.02} />
                    </linearGradient>
                </defs>

                {/* Background */}
                <rect width={width} height={height} rx={10} fill="url(#plotBg)" />

                {/* Grid lines */}
                {Array.from({ length: yDivisions + 1 }, (_, i) => {
                    const yy = pad.top + (i / yDivisions) * plotH;
                    return (
                        <line
                            key={`gy${i}`}
                            x1={pad.left} y1={yy}
                            x2={pad.left + plotW} y2={yy}
                            stroke="rgba(148,163,184,0.15)"
                            strokeWidth={1.5}
                            shapeRendering="crispEdges"
                        />
                    );
                })}
                {Array.from({ length: xDivisions + 1 }, (_, i) => {
                    const xx = pad.left + (i / xDivisions) * plotW;
                    return (
                        <line
                            key={`gx${i}`}
                            x1={xx} y1={pad.top}
                            x2={xx} y2={pad.top + plotH}
                            stroke="rgba(148,163,184,0.15)"
                            strokeWidth={1.5}
                            shapeRendering="crispEdges"
                        />
                    );
                })}

                {/* Axes */}
                <line
                    x1={pad.left} y1={pad.top}
                    x2={pad.left} y2={pad.top + plotH}
                    stroke="rgba(226,232,240,0.8)" strokeWidth={2.5}
                    shapeRendering="crispEdges"
                />
                <line
                    x1={pad.left} y1={pad.top + plotH}
                    x2={pad.left + plotW} y2={pad.top + plotH}
                    stroke="rgba(226,232,240,0.8)" strokeWidth={2.5}
                    shapeRendering="crispEdges"
                />

                {/* Y-axis tick labels */}
                {Array.from({ length: yDivisions + 1 }, (_, i) => {
                    const val = yMin + ((yDivisions - i) / yDivisions) * (yMax - yMin);
                    const yy = pad.top + (i / yDivisions) * plotH;
                    return (
                        <text
                            key={`yt${i}`}
                            x={pad.left - 12}
                            y={yy}
                            textAnchor="end"
                            dominantBaseline="middle"
                            fill="#cbd5e1"
                            fontSize={20}
                            fontFamily="monospace"
                            fontWeight="bold"
                        >
                            {val.toFixed(2)}
                        </text>
                    );
                })}

                {/* X-axis tick labels */}
                {Array.from({ length: xDivisions + 1 }, (_, i) => {
                    const timeSec = (i / xDivisions) * totalDuration;
                    const xx = pad.left + (i / xDivisions) * plotW;
                    return (
                        <text
                            key={`xt${i}`}
                            x={xx}
                            y={pad.top + plotH + 28}
                            textAnchor="middle"
                            fill="#cbd5e1"
                            fontSize={18}
                            fontFamily="monospace"
                            fontWeight="bold"
                        >
                            {timeSec.toFixed(1)}s
                        </text>
                    );
                })}

                {/* Area fill under curve */}
                {polylinePoints.length > 1 && (
                    <polygon
                        points={fillPoints}
                        fill="url(#areaFill)"
                    />
                )}

                {/* Line plot with glow */}
                {polylinePoints.length > 1 && (
                    <polyline
                        points={polylineStr}
                        fill="none"
                        stroke={lineColor}
                        strokeWidth={4}
                        strokeLinejoin="round"
                        strokeLinecap="round"
                    />
                )}

                {/* Head dot */}
                {maxFrame > 0 && (
                    <>
                        <circle cx={headX} cy={headY} r={12} fill={lineColor} opacity={0.3} />
                        <circle cx={headX} cy={headY} r={6} fill="#ffffff" stroke={lineColor} strokeWidth={3} />
                    </>
                )}

                {/* Title */}
                <text
                    x={pad.left + 6}
                    y={28}
                    fill="#f1f5f9"
                    fontSize={22}
                    fontWeight="bold"
                    fontFamily="Inter, system-ui, sans-serif"
                >
                    {title}
                </text>

                {/* Current value readout */}
                <text
                    x={width - pad.right}
                    y={28}
                    textAnchor="end"
                    fill={lineColor}
                    fontSize={24}
                    fontWeight="bold"
                    fontFamily="monospace"
                >
                    {getValueAtFrame(frame).toFixed(3)}
                </text>

                {/* Axis labels */}
                <text
                    x={pad.left + plotW / 2}
                    y={height - 10}
                    textAnchor="middle"
                    fill="rgba(203,213,225,0.8)"
                    fontSize={18}
                    fontWeight="600"
                    fontFamily="Inter, system-ui, sans-serif"
                >
                    Time [s]
                </text>
                <text
                    x={18}
                    y={pad.top + plotH / 2}
                    textAnchor="middle"
                    fill="rgba(203,213,225,0.8)"
                    fontSize={18}
                    fontWeight="600"
                    fontFamily="Inter, system-ui, sans-serif"
                    transform={`rotate(-90, 18, ${pad.top + plotH / 2})`}
                >
                    Position
                </text>
            </svg>
        </div>
    );
};
