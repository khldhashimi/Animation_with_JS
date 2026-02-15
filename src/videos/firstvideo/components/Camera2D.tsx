import React, { useEffect } from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";

export interface CameraState {
    centerX: number;
    centerY: number;
    width: number;
    height: number;
}

export interface Camera2DProps {
    children: React.ReactNode;

    // Frame control
    startFrame: number;
    endFrame: number;

    // Initial camera state
    initialState: CameraState;

    // Target camera state
    targetState: CameraState;

    // Scene dimensions (pixel size of render)
    sceneWidth: number;
    sceneHeight: number;

    // Optional parameters
    easing?: "linear" | "easeInOut" | "easeIn" | "easeOut";
    maintainAspectRatio?: boolean;   // default true
    clampFrames?: boolean;           // default true
    backgroundFill?: string;         // optional

    // Additional Useful Parameters
    zoomMultiplier?: number; // default 1
    minWidth?: number;
    maxWidth?: number;
    minHeight?: number;
    maxHeight?: number;

    onUpdate?: (state: CameraState) => void;
}

export const Camera2D: React.FC<Camera2DProps> = ({
    children,
    startFrame,
    endFrame,
    initialState,
    targetState,
    sceneWidth,
    sceneHeight,
    easing = "easeInOut",
    maintainAspectRatio = true,
    clampFrames = true,
    backgroundFill,
    zoomMultiplier = 1,
    minWidth,
    maxWidth,
    minHeight,
    maxHeight,
    onUpdate
}) => {
    const frame = useCurrentFrame();

    // 1. Easing Function Logic
    const getEasing = (type: string) => {
        switch (type) {
            case "linear": return Easing.linear;
            case "easeIn": return Easing.in(Easing.quad);
            case "easeOut": return Easing.out(Easing.quad);
            case "easeInOut": return Easing.inOut(Easing.quad); // Smoothstep-like
            default: return Easing.inOut(Easing.quad);
        }
    };

    const easingFn = getEasing(easing);

    // 2. Interpolation Configuration
    const interpolateConfig = {
        extrapolateLeft: clampFrames ? "clamp" : "extend",
        extrapolateRight: clampFrames ? "clamp" : "extend",
        easing: easingFn
    } as const;

    // 3. Current State Calculation
    const currentCenterX = interpolate(
        frame,
        [startFrame, endFrame],
        [initialState.centerX, targetState.centerX],
        interpolateConfig
    );

    const currentCenterY = interpolate(
        frame,
        [startFrame, endFrame],
        [initialState.centerY, targetState.centerY],
        interpolateConfig
    );

    let currentWidth = interpolate(
        frame,
        [startFrame, endFrame],
        [initialState.width, targetState.width],
        interpolateConfig
    );

    let currentHeight = interpolate(
        frame,
        [startFrame, endFrame],
        [initialState.height, targetState.height],
        interpolateConfig
    );

    // Apply constraints
    if (minWidth) currentWidth = Math.max(currentWidth, minWidth);
    if (maxWidth) currentWidth = Math.min(currentWidth, maxWidth);
    if (minHeight) currentHeight = Math.max(currentHeight, minHeight);
    if (maxHeight) currentHeight = Math.min(currentHeight, maxHeight);

    // Apply Zoom Multiplier (Effects width/height inversely)
    // Zoom 2x -> Width 0.5x
    if (zoomMultiplier !== 1) {
        currentWidth /= zoomMultiplier;
        currentHeight /= zoomMultiplier;
    }

    // 4. Aspect Ratio Correction (if enabled)
    // If we maintain aspect ratio, we ensure the visible world box ratio matches scene ratio.
    // However, usually we define width OR height and let the other follow. 
    // Or we expand the box to cover the request.
    // Manim behavior: "The camera frame fits the height/width".
    // Let's implement: Use Width as primary, adjust Height to match scene aspect ratio.

    if (maintainAspectRatio) {
        const sceneAspect = sceneWidth / sceneHeight;
        // Construct Current Aspect
        // We redefine height based on width and scene aspect
        currentHeight = currentWidth / sceneAspect;
    }

    // Fire OnUpdate callback
    useEffect(() => {
        if (onUpdate) {
            onUpdate({
                centerX: currentCenterX,
                centerY: currentCenterY,
                width: currentWidth,
                height: currentHeight
            });
        }
    }, [currentCenterX, currentCenterY, currentWidth, currentHeight, onUpdate]);


    // 5. Transform Calculation
    // We want to map:
    // World (centerX, centerY) -> Screen Center (sceneWidth/2, sceneHeight/2)
    // Scale: sceneWidth / currentWidth

    const scale = sceneWidth / currentWidth;

    // Translation Logic:
    // ScreenX = (WorldX - centerX) * scale + sceneWidth/2
    // ScreenY = (WorldY - centerY) * scale + sceneHeight/2
    // Matrix Transform form: translate(screenWidth/2, screenHeight/2) scale(s) translate(-centerX, -centerY)
    // Simplified to single translate/scale:
    // translateX = sceneWidth/2 - centerX * scale
    // translateY = sceneHeight/2 - centerY * scale

    const translateX = sceneWidth / 2 - currentCenterX * scale;
    const translateY = sceneHeight / 2 - currentCenterY * scale;

    const transformStr = `translate(${translateX}px, ${translateY}px) scale(${scale})`;


    return (
        <div style={{
            width: sceneWidth,
            height: sceneHeight,
            position: "absolute",
            overflow: "hidden",
            backgroundColor: backgroundFill || "transparent"
        }}>
            {/* 
               Using a div container for transform. 
               Children can be SVG or HTML. 
               If SVG is needed, user puts <svg> inside.
               Or if this is inside an SVG, it should be <g>.
               Prompt says "Use SVG group transform OR CSS transform".
               Let's output a generic container that works for both if possible, or assume HTML wrapper.
               Given "2D SVG/HTML scene", CSS transform on a div is safest for generic children content.
               However, to support vector-effect="non-scaling-stroke", usually we need to be inside SVG.
               But if the user passes <svg> as children, scaling the parent div works too.
            */}
            <div
                style={{
                    transform: transformStr,
                    transformOrigin: "0 0", // Crucial
                    width: "100%",
                    height: "100%",
                    willChange: "transform"
                }}
            >
                {children}
            </div>
        </div>
    );
};
