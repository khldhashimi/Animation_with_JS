import React from "react";

import { NumberPlane2D } from "./NumberPlane2D";
import { Camera2D } from "./Camera2D";

export const CameraDemo: React.FC = () => {
    // --- Keyframes (Seconds) ---
    // 0-2s: Static
    // 2-4s: Zoom in to (300, 300)
    // 4-6s: Pan to (800, 600)
    // 6-8s: Zoom out to center (1x)

    // We can chain multiple Camera2D components or switch them based on frame time.
    // Or just use one for a demonstration.
    // Let's demo a simple transition: Center -> Zoomed in to (300, 300)

    const sceneWidth = 1920;
    const sceneHeight = 1080;

    // Sequence 1: Init -> Zoom In
    const startFrame = 0;
    const endFrame = 120; // 2 seconds

    // Initial State: View full 1920x1080 centered at (960, 540)
    const initialState = {
        centerX: 960,
        centerY: 540,
        width: 1920,
        height: 1080
    };

    // Target State: View 600 width box centered at (300, 300) -> ~3.2x zoom
    const targetState = {
        centerX: 300,
        centerY: 300,
        width: 600,
        height: 1080 * (600 / 1920) // Maintain Aspect 
    };

    return (
        <Camera2D
            startFrame={startFrame}
            endFrame={endFrame}
            sceneWidth={sceneWidth}
            sceneHeight={sceneHeight}
            initialState={initialState}
            targetState={targetState}
            backgroundFill="#111"
        >
            {/* Background Grid */}
            <NumberPlane2D
                x={0}
                y={0}
                width={1920}
                height={1080}
                xRange={[0, 192]} // 10px per unit
                yRange={[0, 108]}
                grid={{ showGrid: true, majorStep: 10, opacity: 0.2 }}
                xAxisConfig={{ showNumbers: false }}
                yAxisConfig={{ showNumbers: false }}
                xValues={[]}
                yValues={[]}
            />

            {/* World Objects */}
            <div style={{ position: "absolute", left: 300, top: 300, width: 20, height: 20, background: "cyan", borderRadius: "50%", transform: "translate(-50%, -50%)" }} />
            <div style={{ position: "absolute", left: 300, top: 300, color: "cyan", transform: "translate(15px, -50%)", fontSize: 24, fontFamily: "monospace" }}>(300, 300)</div>

            <div style={{ position: "absolute", left: 800, top: 600, width: 20, height: 20, background: "orange", borderRadius: "50%", transform: "translate(-50%, -50%)" }} />
            <div style={{ position: "absolute", left: 800, top: 600, color: "orange", transform: "translate(15px, -50%)", fontSize: 24, fontFamily: "monospace" }}>(800, 600)</div>

            <div style={{ position: "absolute", left: 960, top: 540, width: 20, height: 20, background: "white", borderRadius: "50%", transform: "translate(-50%, -50%)" }} />
            <div style={{ position: "absolute", left: 960, top: 540, color: "white", transform: "translate(15px, -50%)", fontSize: 24, fontFamily: "monospace" }}>Center</div>
        </Camera2D>
    );
};
