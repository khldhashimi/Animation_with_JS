# Project Setup & User Manual

This project is built using [Remotion](https://www.remotion.dev/), a framework for creating videos programmatically with React.

## 1. Project Structure

- **`src/videos/`**: Contains your video compositions and components.
  - **`components/`**: Reusable parts like `HydraulicCylinder2D` and `ServoValve2D`.
  - **`CylinderPreview.tsx`**: A composition used to verify components in the browser.
- **`src/Root.tsx`**: The main entry point where all compositions (videos) are registered.

## 2. Viewing in Browser (Studio)

To see your work instantly and debug animations:

1.  Open your terminal.
2.  Run the following command:
    ```bash
    npm run dev
    ```
3.  Open the link shown (usually `http://localhost:3000`).
4.  Use the left sidebar to switch between different **Compositions** (e.g., `Scene`, `HydraulicAxis01`, `CylinderPreview`).

## 3. Creating a New Component

To add a new visual element (e.g., a pump):

1.  Create a new file in `src/videos/firstvideo/components/`, e.g., `HydraulicPump.tsx`.
2.  Define a React Functional Component (`React.FC`).
3.  Use standard SVG elements (`<rect>`, `<circle>`, `<path>`) or HTML/CSS to draw it.
4.  Export the component and import it where needed (e.g., in a composition file).

## 4. Creating & Registering a New Composition

A "Composition" is a playable video sequence.

1.  Create a new file, e.g., `src/videos/firstvideo/MyNewScene.tsx`.
2.  Export a component (e.g., `export const MyNewScene ...`).
3.  Open `src/Root.tsx` and register it inside `<RemotionRoot>`:
    ```tsx
    <Composition
      id="MyNewScene"
      component={MyNewScene}
      durationInFrames={300} // 10 seconds at 30fps
      fps={30}
      width={1920}
      height={1080}
    />
    ```
4.  Save and checking the browser Studio. "MyNewScene" will appear in the list.

## 5. Video Settings (FPS, Resolution, Duration)

You can check or change settings in `src/Root.tsx` inside the `<Composition />` tag:

- **`fps`**: Frames per second (e.g., 30 or 60).
- **`width` / `height`**: Resolution (e.g., 1920x1080 for HD, 3840x2160 for 4K).
- **`durationInFrames`**: Total length of the video (Duration in seconds = `durationInFrames` / `fps`).

## 6. Rendering to Video

To generate an MP4 file, use the command line:

**Basic Render:**
```bash
npx remotion render <CompositionID> out/<filename>.mp4
```
*Example:* `npx remotion render CylinderPreview out/preview.mp4`

**Common Options:**
- **scale**: upscale the video (e.g. `--scale=2` turns 1080p into 4K).
- **pixel-format**: `--pixel-format=yuv420p` ensures compatibility with players like QuickTime/Windows Media Player.

**Check Available Compositions:**
To see a list of IDs and their settings:
```bash
npx remotion compositions
```
