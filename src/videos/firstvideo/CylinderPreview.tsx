
import React from "react";
import { AbsoluteFill, interpolate, Easing, useCurrentFrame } from "remotion";
import { HydraulicCylinder2D } from "./components/HydraulicCylinder2D";
import { MouseCoordinateOverlay } from "./components/MouseCoordinateOverlay";
import { Camera2D } from "./components/Camera2D";
import { CurvedArrow } from "./components/CurvedArrow";
import { ServoValve2D } from "./components/ServoValve2D";
import { NumberPlane2D } from "./components/NumberPlane2D";
import { VerticalColorBar } from "./components/VerticalColorBar";
import { HydraulicLines } from "./components/HydraulicLines";

export const CylinderPreview: React.FC = () => {
    const frame = useCurrentFrame();

    // Shared logic for piston position
    // Linear ramp: 0 → 0.95 over 600 frames (10 seconds at 60fps)
    const totalFrames = 600;
    const getPistonPos = (f: number) => {
        const t = Math.min(Math.max(f, 0), totalFrames) / totalFrames;
        return t * 0.95;
    };

    const progress = getPistonPos(frame);

    // Rotation animation: -45 deg to +45 deg
    const rotation = Math.sin((frame / 150) * Math.PI * 2) * 45; // Degrees
    // At 5 seconds (frame 300), graph slides to the bottom
    const graphY = interpolate(
        frame,
        [330, 600],
        [50, 550],
        {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.inOut(Easing.ease),
        }
    );

    // --- Pressure Data (Mocked for Animation) ---
    // P1 (Cap) = Pipe A Pressure. 0 -> 300 ramp


    // Pipe Pressures matching Valve/Cylinder
    const pipeAPressure = 0;
    const pipeBPressure = 300; // High pressure line
    const fluidOpacity = 0.5;  // Parameter

    // Zoom Animation 
    // 0-600 frames: Normal view
    // 600-660 frames (10s-11s): Zoom in to Cylinder
    // Target: Cylinder is at (50, 500). We want to zoom in and center this area.
    // Center of interest: ~ (300, 600) maybe? Cylinder is width 600, height 200.
    // At scale 2.5, we need to shift the view.

    // --- Camera State Configuration ---
    const sceneWidth = 1920;
    const sceneHeight = 1080;

    const zoomStart = 600;
    const zoomDuration = 60;
    const zoomEnd = zoomStart + zoomDuration;

    // Initial View: Full Scene
    const initialState = {
        centerX: sceneWidth / 2,
        centerY: sceneHeight / 2,
        width: sceneWidth,
        height: sceneHeight,
    };

    // Target View: Zoomed in on Cylinder (x=50, y=500, w=600, h=200)
    // We want to center roughly at (350, 600) with a zoom of ~2.8
    // Calculate target width based on zoom level
    const targetZoom = 2.8;
    const targetWidth = sceneWidth / targetZoom;
    const targetHeight = sceneHeight / targetZoom;

    const targetState = {
        centerX: 350, // Approx center of cylinder area
        centerY: 544,
        width: targetWidth,
        height: targetHeight
    };

    // --- Developer Overlay Logic --- 
    // Replicate interpolation for MouseOverlay correctness without depending on Camera2D internals
    // Camera2D uses Easing.inOut(Easing.quad) by default for "easeInOut"
    const currentCameraState = {
        centerX: interpolate(frame, [zoomStart, zoomEnd], [initialState.centerX, targetState.centerX], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.quad) }),
        centerY: interpolate(frame, [zoomStart, zoomEnd], [initialState.centerY, targetState.centerY], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.quad) }),
        width: interpolate(frame, [zoomStart, zoomEnd], [initialState.width, targetState.width], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.quad) }),
        height: interpolate(frame, [zoomStart, zoomEnd], [initialState.height, targetState.height], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.quad) }),
    };

    return (
        <AbsoluteFill style={{ backgroundColor: "black" }}>
            <Camera2D
                startFrame={zoomStart}
                endFrame={zoomEnd}
                initialState={initialState}
                targetState={targetState}
                sceneWidth={sceneWidth}
                sceneHeight={sceneHeight}
                easing="easeInOut"
            >
                {/* --- Live Graph using NumberPlane2D --- */}
                {(() => {
                    const graphWidth = 600;
                    const graphHeight = 500;
                    const graphX = 1300;
                    // graphY is already defined in scope: interpolate(...) 

                    // 1. Generate Data
                    const timeData: number[] = [];
                    const posData: number[] = [];
                    // We need points from 0 to current frame
                    // Total duration 10s (600 frames).
                    // Step size: 1 frame is fine for 600 points (performance wise ok for small arrays).
                    const maxGraphFrame = 600;
                    const currentGraphFrame = Math.min(frame, maxGraphFrame);

                    for (let f = 0; f <= currentGraphFrame; f++) {
                        const t = f / 60; // 60fps
                        const v = getPistonPos(f);
                        timeData.push(t);
                        posData.push(v);
                    }

                    // 2. Calculate Tip Position (for dot and readout)
                    // Replicate NumberPlane2D mapping logic
                    // Default padding is 20
                    const padding = 60; // MathBox had generous padding: { top: 50, right: 30, bottom: 60, left: 80 }
                    // Let's use custom padding logic or just adapt NumberPlane2D padding.
                    // NumberPlane2D uses uniform padding. Let's stick to uniform 40 for now or pass padding.
                    // To match MathBoxPlot look exactly, we might need more control, but uniform is generic.

                    const xMin = 0;
                    const xMax = 10; // 600 frames / 60 fps
                    const yMin = 0;
                    const yMax = 1;

                    // Current values
                    const currentVal = getPistonPos(currentGraphFrame);

                    return (
                        <div style={{ position: "absolute", left: graphX, top: graphY, width: graphWidth, height: graphHeight }}>
                            <NumberPlane2D
                                x={0}
                                y={0}
                                width={graphWidth}
                                height={graphHeight}
                                xRange={[xMin, xMax]}
                                yRange={[yMin, yMax]}
                                xValues={timeData}
                                yValues={[posData]}
                                title="Cylinder Rod Position"
                                showTitle={true}
                                titleColor="#f1f5f9"
                                titleFontSize={22}
                                titleDx={-graphWidth / 2 + 20 + 120} // Align Left-ish like MathBox? MathBox title was x=pad.left+6 (approx 86). Center is 300. -300+86 = -214.
                                // NumberPlane2D title is centered by default.
                                // Let's just let it center efficiently or accept it.

                                grid={{
                                    showGrid: true,
                                    majorColor: "rgba(255, 255, 255, 0.15)",
                                    xMajorStep: 2, // 2s steps
                                    yMajorStep: 0.2 // 0.2 steps
                                }}

                                xAxisConfig={{
                                    axisColor: "rgba(226,232,240,0.8)",
                                    numberColor: "#cbd5e1",
                                    tickColor: "rgba(226,232,240,0.8)",
                                    showTip: false
                                }}
                                yAxisConfig={{
                                    axisColor: "rgba(226,232,240,0.8)",
                                    numberColor: "#cbd5e1",
                                    tickColor: "rgba(226,232,240,0.8)",
                                    showTip: false,
                                    numberPrecision: 2
                                }}
                                xLabel="Time [s]"
                                yLabel="Position"
                                backgroundFill="#000000ff" // Dark slate
                                graphStyles={{
                                    0: { strokeColor: "#38bdf8", strokeWidth: 4 }
                                }}
                                padding={padding}
                            />

                            {/* Custom Readout (Top Right) */}
                            <div style={{
                                position: "absolute",
                                top: 28,
                                right: padding,
                                fontFamily: "monospace",
                                fontSize: 24,
                                fontWeight: "bold",
                                color: "#38bdf8"
                            }}>
                                {currentVal.toFixed(3)}
                            </div>
                        </div>
                    );
                })()}

                {/* --- Vertical Color Bar (Pressure/Simulated) --- */}
                <VerticalColorBar
                    width={40}
                    height={600}
                    maxValue={300}
                    valueLeft={200} // Scale to max 300
                    valueRight={0} // Mock fluctuating load
                    labelLeft="Pos"
                    labelRight="Load"
                    x={100}
                    y={300}
                />

                {/* --- Hydraulic Lines (Pipes A & B with Flow Animation) --- */}
                <HydraulicLines
                    pathA="M 520,905 L 520,774 L 320,774"
                    pathB="M 680,905 L 680,572 L 320,572"
                    pressureA={pipeAPressure}
                    pressureB={pipeBPressure}
                    flowA={Math.sin(frame / 30) * 100} // Demo flow
                    flowB={-Math.sin(frame / 30) * 100} // Opposite flow
                    maxFlow={100}
                    fluidOpacity={fluidOpacity}
                    dotSize={5}
                    dotColor="white"
                />

                <div style={{ position: "absolute", top: 40, fontFamily: "sans-serif", color: "#eee", zIndex: 10 }}>
                    <h2>Hydraulic Cylinder 2D Preview</h2>
                    <p>Piston Position: {progress.toFixed(2)}</p>
                    <p>Rotation: {rotation.toFixed(2)} deg</p>
                </div>

                {/* Centered cylinder with rotation - Ports on Top (default) */}
                <HydraulicCylinder2D
                    width={600}
                    height={200}
                    strokeWidth={3}
                    pistonPosition={progress}
                    x={50}
                    y={500}
                    angle={-90}
                    portsSide="bottom"
                    p1={0}
                    p2={300}
                    maxP={300}
                    F={Math.sin(frame / 60)} // Oscillates -1 to 1
                    F_scale={30}
                />


                {/* Servo Valve Preview */}
                <div style={{ position: "absolute", bottom: 180, right: 150, textAlign: "center", color: "#eee", fontFamily: "sans-serif" }}>
                    <strong>Servo Valve</strong> (Spool: {(100).toFixed(0)}%)
                </div>
                <ServoValve2D
                    width={400}
                    height={300}
                    spool={-100}
                    x={450}
                    y={850}
                    scale={0.8}
                    P_Value={300}
                    T_Value={0}
                    A_Pressure={0}
                    B_Pressure={130}
                />

                <div style={{ position: "absolute", bottom: 40, color: "#aaa", fontSize: 14 }}>
                    (Industrial Design Style)
                </div>

                {/* Fading Arrow (Appears after 5 seconds = 300 frames) */}
                {(() => {
                    const arrowStartFrame = 300;
                    const arrowOpacity = interpolate(
                        frame,
                        [arrowStartFrame, arrowStartFrame + 30], // 0.5s fade in
                        [0, 1],
                        { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
                    );

                    if (frame < arrowStartFrame) return null;

                    return (
                        <CurvedArrow
                            start={{ x: 200, y: 400 }}
                            end={{ x: 350, y: 480 }}
                            controlPoint={{ x: 250, y: 350 }}
                            color="#00ffff"
                            thickness={4}
                            arrowSize={20}
                            opacity={arrowOpacity}
                        />
                    );
                })()}

            </Camera2D>

            {/* Dev Overlay - Placed outside Camera2D logic but fed with current camera state */}
            <MouseCoordinateOverlay
                sceneWidth={sceneWidth}
                sceneHeight={sceneHeight}
                cameraState={currentCameraState}
            />
        </AbsoluteFill>
    );
};

