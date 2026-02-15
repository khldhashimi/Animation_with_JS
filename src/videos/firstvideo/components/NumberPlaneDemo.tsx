import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { NumberPlane2D } from "./NumberPlane2D";

export const NumberPlaneDemo: React.FC = () => {
    const frame = useCurrentFrame();

    const totalFrames = 600;
    const maxFrame = Math.min(frame, totalFrames);

    // Generate data up to current frame (progressive drawing)
    const xValues1 = [];
    const yValues1 = [];
    const yValues2 = []; // Cosine
    const yValues3 = []; // Scatter

    // We step through frames to generate points
    // Map frame -> time (x)
    // 600 frames = 10 seconds -> x = frame / 60
    for (let f = 0; f <= maxFrame; f++) {
        const x = f / 60;

        xValues1.push(x);

        // Series 1: Sine Wave (Static defined by x, revealed over time)
        yValues1.push(Math.sin(x));

        // Series 2: Cosine Wave (Dashed)
        yValues2.push(Math.cos(x) * 0.5);

        // Series 3: Scatter Points (Pointed) - maybe fewer points?
        // Let's just push same length for demo, strokeType handles appearance
        yValues3.push(0.5);

    }


    return (
        <AbsoluteFill style={{ backgroundColor: "#000000ff" }}>
            <NumberPlane2D
                x={100}
                y={100}
                width={800}
                height={500}
                xRange={[-10, 10]}
                yRange={[-1.5, 3]}
                xLabel="Time (s)"
                yLabel="Amplitude"
                grid={{
                    showGrid: true,
                    xMajorStep: 2,
                    yMajorStep: 1,
                    majorColor: "rgba(8, 141, 119, 1)",
                    opacity: 1,
                    strokeStyle: "solid"
                }}
                xAxisConfig={{
                    axisColor: "#cbd5e0",
                    tickColor: "#cbd5e0",
                    numberColor: "#cbd5e0"
                }}
                yAxisConfig={{
                    axisColor: "#cbd5e0",
                    tickColor: "#cbd5e0",
                    numberColor: "#cbd5e0"
                }}
                xValues={xValues1} // Shared X
                yValues={[yValues1, yValues2, yValues3]}
                graphStyles={{
                    0: { strokeColor: "#4fd1c5", strokeWidth: 4, strokeType: "solid" },   // Teal Sine
                    1: { strokeColor: "#f6ad55", strokeWidth: 3, strokeType: "dashed" },  // Orange Cosine
                    2: { strokeColor: "#fc8181", strokeWidth: 4, strokeType: "pointed" }, // Red Points
                }}
                padding={40}
                backgroundFill="#000000ff" // Dark slate bg

                // New Params
                title="NumberPlane2D Demo"
                showTitle={true}
                titleDx={0}
                titleDy={0}
                xLabelDx={90}
                xLabelDy={10}
                yLabelDx={0}
                yLabelDy={0}
            />

            <div style={{ position: "absolute", bottom: 50, left: 100, color: "#ebebf1ff", fontFamily: "sans-serif", fontSize: 24 }}>
                <h3>NumberPlane2D Demo</h3>
                <p>Teal: Solid Sine | Orange: Dashed Cosine | Red: Pointed Data</p>
                <p>New Features: Grid Opacity, Dashed Grid, Title Support, Label Offsets</p>
            </div>
        </AbsoluteFill>
    );
};
