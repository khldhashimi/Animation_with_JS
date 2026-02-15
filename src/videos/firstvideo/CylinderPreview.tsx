
import React from "react";
import { AbsoluteFill, interpolate, Easing, useCurrentFrame } from "remotion";
import { HydraulicCylinder2D } from "./components/HydraulicCylinder2D";
import { MouseCoordinateOverlay } from "./components/MouseCoordinateOverlay";
import { ServoValve2D } from "./components/ServoValve2D";
import { MathBoxPlot } from "./components/MathBoxPlot";
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

    const zoomStart = 600;
    const zoomDuration = 60;

    const scale = interpolate(
        frame,
        [zoomStart, zoomStart + zoomDuration],
        [1, 2.8], // Zoom level
        { extrapolateRight: "clamp", easing: Easing.inOut(Easing.ease) }
    );

    const translateX = interpolate(
        frame,
        [zoomStart, zoomStart + zoomDuration],
        [0, 600], // Shift right to bring left side to center? No, we want to move the scene LEFT.
        // Wait, positive translate moves the scene right. If we want to focus on (50, 500), we need to move it towards center (1920/2, 1080/2).
        // Let's rely on visual adjustment or calculation.
        // Initial Center: (960, 540)
        // Target Center: (350, 600) (Approximate middle of cylinder area)
        // Delta: (960-350, 540-600) * scale?
        // Let's try explicit values.
        { extrapolateRight: "clamp", easing: Easing.inOut(Easing.ease) }
    );

    const translateY = interpolate(
        frame,
        [zoomStart, zoomStart + zoomDuration],
        [0, -400], // Move up to center the cylinder vertically
        { extrapolateRight: "clamp", easing: Easing.inOut(Easing.ease) }
    );

    return (
        <AbsoluteFill style={{ backgroundColor: "black" }}>
            <AbsoluteFill
                style={{
                    transform: `scale(${scale}) translate(${translateX}px, ${translateY}px)`,
                    transformOrigin: "center center", // Or top left? Center implies zooming into the center of the frame.
                    // If we zoom into center, we just need to translate the target point to the center.
                }}
            >
                {/* --- Live Graph --- */}
                <MathBoxPlot
                    width={600}
                    height={500}
                    x={1300}
                    y={graphY}
                    getValueAtFrame={getPistonPos}
                    title="Cylinder Rod Position"
                    yMin={0}
                    yMax={1}
                    totalFrames={600}
                    fps={60}
                />

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
            </AbsoluteFill>
            {/* Dev Overlay */}
            <MouseCoordinateOverlay
                sceneWidth={1920}
                sceneHeight={1080}
                // We don't have active camera state tracking here efficiently exposed yet without context,
                // but we can pass the zoom/pan values if we calculate them here or just pass static for now
                // to show pixel coords at least.
                // For dynamic camera support, we'd need to lift the interpolate logic to state or pass it in.
                // For now, let's show pixel coords and default world (1:1).
                /* 
                 * To show "World" coords correctly during zoom, we need the CURRENT scale/translate.
                 * calculated above as `scale`, `translateX`, `translateY`.
                 * CenterX can be derived: 
                 * translate = Width/2 - Center * Scale
                 * Center * Scale = Width/2 - translate
                 * Center = (Width/2 - translate) / Scale
                 */
                cameraState={{
                    centerX: (1920 / 2 - translateX) / scale,
                    centerY: (1080 / 2 - translateY) / scale, // Note: This assumes Y increases downwards (SVG default)
                    width: 1920 / scale,
                    height: 1080 / scale
                }}
            />
        </AbsoluteFill>
    );
};
