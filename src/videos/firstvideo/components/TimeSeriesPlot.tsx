import { useCurrentFrame } from 'remotion';

interface TimeSeriesPlotProps {
    width?: number;
    height?: number;
    x?: number;
    y?: number;
    /**
     * Function that returns the value for a given frame.
     * This ensures the graph shows the *exact* same math as the animation.
     */
    getValueAtFrame: (frame: number) => number;
    lineColor?: string;
    title?: string;
    yMin?: number;
    yMax?: number;
    timeWindow?: number; // How many frames to show in history
}

export const TimeSeriesPlot: React.FC<TimeSeriesPlotProps> = ({
    width = 400,
    height = 200,
    x = 0,
    y = 0,
    getValueAtFrame,
    lineColor = '#48bb78', // Default Green
    title = 'Position vs Time',
    yMin = 0,
    yMax = 1,
    timeWindow = 180, // 3 seconds at 60fps
}) => {
    const frame = useCurrentFrame();

    // Graph styling
    const padding = 40;
    const graphWidth = width - padding * 2;
    const graphHeight = height - padding * 2;

    // Generate Points
    // We want to show [frame - timeWindow, frame]
    // Or maybe just a scrolling window?
    // Let's do a sliding window: Right edge is current frame.

    const points: string[] = [];

    // We'll sample every 2 frames for performance
    const step = 2;
    const startFrame = Math.max(0, frame - timeWindow);
    const endFrame = frame;

    for (let f = startFrame; f <= endFrame; f += step) {
        const val = getValueAtFrame(f);

        // Map to coordinates
        // X: Map frame range [frame - timeWindow, frame] -> [0, graphWidth]
        // But if frame < timeWindow, we just map [0, timeWindow] -> [0, graphWidth] to keep scale constant

        // Rolling Window Logic:
        // X axis represents "Time relative to window start" or just fixed window.
        // Let's keep the window "fixed sized" so the graph scrolls left.
        // x = ( (f - (frame - timeWindow)) / timeWindow ) * graphWidth

        const relativeF = f - (frame - timeWindow);
        const px = (relativeF / timeWindow) * graphWidth + padding;

        // Y: Map [yMin, yMax] -> [height - padding, padding] (Y is down in SVG)
        // val=yMin => y=height-padding
        // val=yMax => y=padding
        const normalizedY = (val - yMin) / (yMax - yMin);
        const py = (height - padding) - (normalizedY * graphHeight);

        points.push(`${px.toFixed(1)},${py.toFixed(1)}`);
    }

    const polylinePoints = points.join(' ');

    // Current Value Dot
    const currentVal = getValueAtFrame(frame);
    const curY = (height - padding) - ((currentVal - yMin) / (yMax - yMin)) * graphHeight;
    const curX = width - padding; // Always at right edge

    return (
        <div style={{ position: 'absolute', left: x, top: y, width, height, fontFamily: 'sans-serif' }}>
            {/* Background / Container */}
            <div style={{
                position: 'absolute', width: '100%', height: '100%',
                backgroundColor: 'rgba(20, 20, 20, 0.8)',
                border: '1px solid #444',
                borderRadius: 8
            }} />

            {/* Title */}
            <div style={{ position: 'absolute', top: 10, width: '100%', textAlign: 'center', color: '#ccc', fontSize: 14, fontWeight: 'bold' }}>
                {title}
            </div>

            <svg width={width} height={height} style={{ overflow: 'visible' }}>
                {/* Axes */}
                <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#666" strokeWidth={2} /> {/* Y Axis */}
                <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#666" strokeWidth={2} /> {/* X Axis */}

                {/* Grid Lines (Horizontal) */}
                <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#333" strokeDasharray="4 4" />
                <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#333" strokeDasharray="4 4" />

                {/* Data Line */}
                <polyline
                    points={polylinePoints}
                    fill="none"
                    stroke={lineColor}
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {/* Current Value Dot */}
                <circle cx={curX} cy={curY} r={5} fill={lineColor} stroke="white" strokeWidth={2} />

                {/* Current Value Text */}
                <text x={curX - 10} y={curY - 10} fill={lineColor} textAnchor="end" fontSize={12} fontWeight="bold">
                    {currentVal.toFixed(2)}
                </text>

                {/* Y Axis Labels */}
                <text x={padding - 10} y={padding + 5} fill="#aaa" textAnchor="end" fontSize={10}>{yMax}</text>
                <text x={padding - 10} y={height - padding + 5} fill="#aaa" textAnchor="end" fontSize={10}>{yMin}</text>
            </svg>
        </div>
    );
};
