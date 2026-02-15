import React, { useState, useRef, useMemo } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { ThreeCanvas } from '@remotion/three';
import { TransformControls, OrthographicCamera, Line } from '@react-three/drei';
import { HydraulicCylinder2D } from '../components/HydraulicCylinder2D';
import { ServoValve2D } from '../components/ServoValve2D';
import * as THREE from 'three';

// --- Types & Interfaces ---

interface InteractableItemProps {
    position: [number, number, number];
    rotation: [number, number, number];
    scale: [number, number, number];
    onTransform: (newPos: THREE.Vector3, newRot: THREE.Euler, newScale: THREE.Vector3) => void;
    children: React.ReactNode;
    mode?: 'translate' | 'rotate' | 'scale';
}

// --- Helper Components ---

const InteractableItem: React.FC<InteractableItemProps> = ({
    position,
    rotation,
    scale,
    onTransform,
    children,
    mode = 'translate'
}) => {
    return (
        <TransformControls
            mode={mode}
            position={position}
            rotation={rotation}
            scale={scale}
            onMouseUp={(e) => {
                if (e && e.target && e.target.object) {
                    const obj = e.target.object;
                    onTransform(obj.position.clone(), obj.rotation.clone(), obj.scale.clone());
                }
            }}
            translationSnap={10}
            rotationSnap={Math.PI / 12} // 15 degrees
        >
            {/* We render the children (proxy mesh) inside the controls */}
            <group>
                {children}
            </group>
        </TransformControls>
    );
};

// --- Pipe Logic ---

const calculatePipePath = (start: THREE.Vector3, end: THREE.Vector3): THREE.Vector3[] => {
    // Simple 4-point path
    // 1. Start
    // 2. Start + Up (Y offset)
    // 3. End + Up (Y offset match?)
    // 4. End

    // Y is Up in 3D.
    const startY = start.y;
    const endY = end.y;

    // We want to go "Up" relative to the component.
    // Valve ports are on Top -> Go Up (+Y).
    // Cylinder ports are on Bottom -> Go Down (-Y).

    // But calculatePipePath is generic.
    // Let's assume standard "Manhattan" routing:
    // Vertical -> Horizontal -> Vertical.

    // Mid Height
    const midY = (startY + endY) / 2;

    const p1 = start.clone();
    const p2 = new THREE.Vector3(start.x, midY, 0);
    const p3 = new THREE.Vector3(end.x, midY, 0);
    const p4 = end.clone();

    return [p1, p2, p3, p4];
};


export const HydraulicSystem: React.FC = () => {
    const frame = useCurrentFrame();
    const { width, height } = useVideoConfig();

    // Animation
    const pistonMove = (Math.sin(frame / 60) + 1) / 2;
    const spoolPos = Math.sin(frame / 60) * 100;

    // --- State ---
    // Valve: Bottom Left. x ~ -400, y ~ -300
    const [valveState, setValveState] = useState({
        position: new THREE.Vector3(-400, -300, 0),
        rotation: new THREE.Euler(0, 0, 0),
        scale: new THREE.Vector3(1, 1, 1),
    });

    // Cylinder: Top Right. x ~ 400, y ~ 200
    const [cylState, setCylState] = useState({
        position: new THREE.Vector3(400, 200, 0),
        rotation: new THREE.Euler(0, 0, 0),
        scale: new THREE.Vector3(1, 1, 1),
    });

    const [interactionMode, setInteractionMode] = useState<'translate' | 'rotate' | 'scale'>('translate');

    // --- Coordinate Helpers ---

    // Convert 3D World (0,0 @ center, Y up) to CSS Absolute (0,0 @ top-left, Y down)
    const toCssPosition = (pos: THREE.Vector3, rot: THREE.Euler, scl: THREE.Vector3) => {
        // Screen Center
        const cx = 1920 / 2;
        const cy = 1080 / 2;

        // 3D -> Screen
        // X: + is Right.
        const screenX = cx + pos.x;
        // Y: + is Up in 3D. - is Up in Screen.
        // So screenY = cy - pos.y.
        const screenY = cy - pos.y;

        // CSS transform
        // Note: We'll position the center of the div at screenX, screenY.
        // We use translate(-50%, -50%) to handle the centering of the element itself.
        // Rotation: 3D Z rotation (+CCW) -> CSS rotate (+CW).
        // Standard angle math: 0 is East.
        // CSS rotate(0) is usually East/Right if element is horizontal.
        // Actually CSS rotate uses CW. Math uses CCW. So -rot.z.
        return {
            left: screenX,
            top: screenY,
            transform: `translate(-50%, -50%) rotate(${-rot.z}rad) scale(${scl.x}, ${scl.y})`,
            position: 'absolute' as const,
        };
    };

    // Calculate Port World Positions for Pipes
    const toWorld = (localParams: { x: number, y: number }, state: typeof valveState) => {
        const vec = new THREE.Vector3(localParams.x, localParams.y, 0);
        vec.applyEuler(state.rotation);
        vec.multiply(state.scale);
        vec.add(state.position);
        return vec;
    };

    // Valve Center (0,0 local). Width 400, Height 260.
    // Port A: Top Left-ish. 
    // SVG Local Coords (Top Left 0,0): A=(w*0.3, 0).
    // Centered Local Coords (Center 0,0): A=(w*0.3 - w/2, -h/2).
    // WAIT. SVG "Top" is Y=0. Center Y=h/2.
    // In Centered Local: Top is -h/2. Bottom is +h/2.
    // BUT 3D Y is FLIPPED relative to SVG Y.
    // 3D "Up" is +Y. SVG "Top" is -Y (if centered? No, SVG Top is 0).
    // If we map SVG Top to 3D Top (+Y).
    // Then Port y = +h/2.
    const getValvePorts = () => {
        const w = 400; const h = 260;
        const portA_local = { x: w * 0.3 - w / 2, y: h / 2 };
        const portB_local = { x: w * 0.7 - w / 2, y: h / 2 };

        return {
            a: toWorld(portA_local, valveState),
            b: toWorld(portB_local, valveState),
        };
    };

    const getCylPorts = () => {
        const w = 500; const h = 150;
        // Ports on "Bottom" -> -Y in 3D.
        const portL_local = { x: w * 0.2 - w / 2, y: -h / 2 };
        const portR_local = { x: w * 0.8 - w / 2, y: -h / 2 };

        return {
            left: toWorld(portL_local, cylState),
            right: toWorld(portR_local, cylState),
        };
    };

    const vPorts = getValvePorts();
    const cPorts = getCylPorts();

    // Pipe Paths with specific routing adjustments
    // Valve A -> Cyl Left
    // Valve B -> Cyl Right
    const pathA = calculatePipePath(vPorts.a, cPorts.left);
    const pathB = calculatePipePath(vPorts.b, cPorts.right);

    return (
        <AbsoluteFill style={{ backgroundColor: '#000000' }}>
            {/* --- HTML Layer (Visible Components) --- */}
            {/* Valve */}
            <div style={toCssPosition(valveState.position, valveState.rotation, valveState.scale)}>
                <ServoValve2D width={400} height={260} spool={spoolPos} />
            </div>

            {/* Cylinder */}
            <div style={toCssPosition(cylState.position, cylState.rotation, cylState.scale)}>
                <HydraulicCylinder2D width={500} height={150} pistonPosition={pistonMove} portsSide="bottom" angle={-90} />
            </div>

            {/* UI Overlay */}
            <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 2000, color: 'white', fontFamily: 'sans-serif' }}>
                <h3>CAD Editor Mode</h3>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => setInteractionMode('translate')} style={{ padding: '5px 10px', background: interactionMode === 'translate' ? '#3182ce' : '#4a5568', border: 'none', color: 'white', cursor: 'pointer' }}>Move (G)</button>
                    <button onClick={() => setInteractionMode('rotate')} style={{ padding: '5px 10px', background: interactionMode === 'rotate' ? '#3182ce' : '#4a5568', border: 'none', color: 'white', cursor: 'pointer' }}>Rotate (R)</button>
                    <button onClick={() => setInteractionMode('scale')} style={{ padding: '5px 10px', background: interactionMode === 'scale' ? '#3182ce' : '#4a5568', border: 'none', color: 'white', cursor: 'pointer' }}>Scale (S)</button>
                </div>
            </div>

            {/* --- 3D Layer (Controls & Pipes) --- */}
            {/* Pointer Events handled here for controls */}
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1000 }}>
                <ThreeCanvas width={width} height={height}>
                    <OrthographicCamera
                        makeDefault
                        position={[0, 0, 100]}
                        zoom={1}
                        near={0.1}
                        far={2000}
                        left={-width / 2}
                        right={width / 2}
                        top={height / 2}
                        bottom={-height / 2}
                    />
                    <ambientLight intensity={1} />

                    {/* Valve Proxy & Control */}
                    <InteractableItem
                        position={[valveState.position.x, valveState.position.y, valveState.position.z]}
                        rotation={[valveState.rotation.x, valveState.rotation.y, valveState.rotation.z]}
                        scale={[valveState.scale.x, valveState.scale.y, valveState.scale.z]}
                        mode={interactionMode}
                        onTransform={(p, r, s) => setValveState({ position: p, rotation: r, scale: s })}
                    >
                        {/* Invisible plane matching size for hit testing/gizmo origin */}
                        <mesh>
                            <planeGeometry args={[400, 260]} />
                            <meshBasicMaterial transparent opacity={0.0} color="yellow" />
                        </mesh>
                    </InteractableItem>

                    {/* Cylinder Proxy & Control */}
                    <InteractableItem
                        position={[cylState.position.x, cylState.position.y, cylState.position.z]}
                        rotation={[cylState.rotation.x, cylState.rotation.y, cylState.rotation.z]}
                        scale={[cylState.scale.x, cylState.scale.y, cylState.scale.z]}
                        mode={interactionMode}
                        onTransform={(p, r, s) => setCylState({ position: p, rotation: r, scale: s })}
                    >
                        <mesh>
                            <planeGeometry args={[500, 150]} />
                            <meshBasicMaterial transparent opacity={0.0} color="yellow" />
                        </mesh>
                    </InteractableItem>

                    {/* Pipes */}
                    <Line points={pathA} color="#718096" lineWidth={5} />
                    <Line points={pathB} color="#718096" lineWidth={5} />

                </ThreeCanvas>
            </div>
        </AbsoluteFill>
    );
};
