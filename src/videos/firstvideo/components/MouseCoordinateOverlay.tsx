import React, { useState, useEffect, useRef } from "react";
import { AbsoluteFill } from "remotion";

export interface MouseCoordinateOverlayProps {
    sceneWidth: number;
    sceneHeight: number;

    // Optional world transform
    cameraState?: {
        centerX: number;
        centerY: number;
        width: number;
        height: number;
    };

    // Toggle features
    showCrosshair?: boolean;      // default true
    showPixelCoords?: boolean;    // default true
    showWorldCoords?: boolean;    // default true

    // Styling
    fontSize?: number;            // default 16
    color?: string;               // default "#00ffcc"
}

export const MouseCoordinateOverlay: React.FC<MouseCoordinateOverlayProps> = ({
    sceneWidth,
    sceneHeight,
    cameraState,
    showCrosshair = true,
    showPixelCoords = true,
    showWorldCoords = true,
    fontSize = 16,
    color = "#00ffcc"
}) => {
    // Development only check
    // if (process.env.NODE_ENV === "production") {
    //    return null;
    // }

    const [mousePos, setMousePos] = useState<{ x: number, y: number } | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!containerRef.current) return;

            // Get bounding rect of the container (which should fill the scene)
            const rect = containerRef.current.getBoundingClientRect();

            // Calculate scale factors (in case preview is zoomed in Remotion Player)
            const scaleX = sceneWidth / rect.width;
            const scaleY = sceneHeight / rect.height;

            const x = (e.clientX - rect.left) * scaleX;
            const y = (e.clientY - rect.top) * scaleY;

            // Clamp
            const clampedX = Math.max(0, Math.min(x, sceneWidth));
            const clampedY = Math.max(0, Math.min(y, sceneHeight));

            setMousePos({ x: clampedX, y: clampedY });
        };

        // We attach listener to window or document to catch moves over the iframe
        // Ideally we attach to our overlay container, but we need pointer-events: none for the overlay itself usually.
        // Wait, if we want to track mouse, we need pointer-events: auto on a transparent layer.
        // But that might block interaction with underlying elements if user wants to click them (devtools?).
        // For a coordinate viewer, blocking clicks is usually fine or we use 'passive' tracking.
        // Let's attach to window and check if within bounds, OR use a transparent overlay that captures events.
        // If we want "no external dependencies", we use a transparent div.

        window.addEventListener("mousemove", handleMouseMove);
        // window.addEventListener("mouseleave", handleMouseLeave); // Window leave is tricky

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            // window.removeEventListener("mouseleave", handleMouseLeave);
        };
    }, [sceneWidth, sceneHeight]);

    // Calculate World Coords
    let worldX = 0;
    let worldY = 0;

    if (mousePos && cameraState) {
        // Pixel to World conversion
        // Scale = pixels / world_units
        // If maintainAspectRatio is assumed true or we take min scale
        const scaleX = sceneWidth / cameraState.width;
        const scaleY = sceneHeight / cameraState.height;
        const scale = Math.min(scaleX, scaleY);

        // 1. Shift origin to center
        const centeredX = mousePos.x - sceneWidth / 2;
        const centeredY = mousePos.y - sceneHeight / 2;

        // 2. Descale
        const unscaledX = centeredX / scale;
        const unscaledY = centeredY / scale;

        // 3. Add Camera Center
        worldX = unscaledX + cameraState.centerX;

        // 4. Invert Y?
        // In SVG/Canvas, Y increases downwards.
        // In Math (World), Y (often) increases upwards.
        // If our engine treats +Y as Down (standard 2D/SVG), we just add.
        // If we want Math coords (+Y Up), we negate.
        // The prompt says "World Y should increase upward (mathematical orientation)."
        // BUT, our NumberPlane2D likely draws standard SVG coords unless flipped.
        // CylinderPreview uses (50, 500) etc, which are SVG coords (Top-Left 0,0).
        // If the user wants "Mathematical Orientation", it means Screen Y 0 -> World Y Max.
        // But if CylinderPreview is built with SVG coords (Y=500 is below Y=50), then "World Y" is just Y.
        // "Mathematical orientation" usually implies cartesian flip.
        // However, if the user's scene is built in SVG coords, showing Cartesian might be confusing.
        // Let's stick to the prompt: "Invert Y axis correctly if necessary... World Y should increase upward".
        // Use case: (0,0) at bottom-left? Or center?
        // Let's assume standard math conversion: Y_world = -Y_screen_from_center?
        // Actually, let's just reverse the sign of the offset from center if we want Up = Positive relative to center.
        // worldY = cameraState.centerY - unscaledY; // If moving mouse UP (negative pixel dy), adds to WorldY.

        // Let's stick to what's likely useful: If `cameraState.centerY` is 500, and we move up, we expect < 500 if SVG, > 500 if Math.
        // Prompt explicitly says "World Y should increase upward".
        worldY = cameraState.centerY - unscaledY;
    }



    return (
        <AbsoluteFill
            ref={containerRef}
            style={{
                pointerEvents: "none", // Let clicks pass through
                zIndex: 9999
            }}
        >
            {/* Crosshair */}
            {mousePos && showCrosshair && (
                <>
                    <div style={{
                        position: "absolute",
                        top: 0,
                        left: mousePos.x,
                        width: 1,
                        height: "100%",
                        backgroundColor: color,
                        opacity: 0.5
                    }} />
                    <div style={{
                        position: "absolute",
                        top: mousePos.y,
                        left: 0,
                        width: "100%",
                        height: 1,
                        backgroundColor: color,
                        opacity: 0.5
                    }} />
                </>
            )}

            {/* Info Panel */}
            <div style={{
                position: "absolute",
                top: 20,
                left: 20,
                backgroundColor: "rgba(0, 0, 0, 0.8)",
                padding: "8px 12px",
                borderRadius: 6,
                fontFamily: "monospace",
                fontSize: fontSize,
                color: color,
                border: `1px solid ${color}`,
                pointerEvents: "none"
            }}>
                {mousePos && showPixelCoords && (
                    <div>
                        PX: {mousePos.x.toFixed(0)}, {mousePos.y.toFixed(0)}
                    </div>
                )}
                {/* World Coords - calculated outside, but only valid if mousePos valid.
                    Actually worldX/worldY depend on mousePos. If mousePos null, worldX is 0 (default init).
                    But we shouldn't show them if mouse not active?
                    The 'worldX' variable is calculated at top level: `let worldX = 0; if (mousePos...) ...`
                    So if mousePos is null, worldX is 0.
                    We should only show WD if mousePos is present.
                */}
                {mousePos && showWorldCoords && cameraState && (
                    <div style={{ marginTop: 4 }}>
                        WD: {worldX.toFixed(1)}, {worldY.toFixed(1)}
                    </div>
                )}
                {!cameraState && showWorldCoords && (
                    <div style={{ marginTop: 4, opacity: 0.5 }}>
                        (No Camera State)
                    </div>
                )}
            </div>

        </AbsoluteFill>
    );
};
