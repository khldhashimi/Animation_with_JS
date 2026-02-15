import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";

export const HydraulicAxis01: React.FC = () => {
    const frame = useCurrentFrame();

    const x = interpolate(frame, [0, 120], [0, 900], {
        extrapolateRight: "clamp",
    });

    return (
        <AbsoluteFill
            style={{
                backgroundColor: "black",
                color: "white",
                justifyContent: "center",
                alignItems: "center",
                fontSize: 60,
                fontFamily: "Arial",
            }}
        >
            <div style={{ marginBottom: 40 }}>Hydraulic Axis – Video 01</div>

            {/* Simple “cylinder position” bar */}
            <div
                style={{
                    width: 1000,
                    height: 24,
                    border: "2px solid white",
                    position: "relative",
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        left: x,
                        top: -18,
                        width: 30,
                        height: 60,
                        backgroundColor: "white",
                    }}
                />
            </div>

            <div style={{ marginTop: 30, fontSize: 26, opacity: 0.8 }}>
                Frame: {frame}
            </div>
        </AbsoluteFill>
    );
};
