"use client";
import type { MazeEvent, MazeSettings } from "@/lib/maze";
import { MazeController } from "@/lib/MazeController";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactElement,
} from "react";
import { match } from "ts-pattern";
import ActionBar from "./components/ActionBar";
import ZoomBar from "./components/ZoomBar";

export default function Home(): ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mazeController, setMazeController] = useState<MazeController | null>(
    null,
  );
  const [solvable, setSolvable] = useState(false);

  useEffect(() => {
    const ctx = canvasRef.current!.getContext("2d");
    if (ctx === null) return;
    setMazeController(new MazeController(ctx, setSolvable));
  }, []);

  const onAction = useCallback(
    (action: MazeEvent, settings: MazeSettings) => {
      if (mazeController === null) return;
      match(action)
        .with("generate", () => {
          mazeController.generate(settings);
        })
        .with("solve", () => {
          mazeController.solve(settings);
        })
        .exhaustive();
    },
    [mazeController],
  );

  return (
    <main className="flex w-screen flex-col items-center gap-8 p-4">
      <div className="flex w-full flex-col items-center gap-2">
        <ActionBar onEvent={onAction} solvable={solvable} />
        <ZoomBar
          onChange={(value) => {
            if (mazeController === null) return;
            mazeController.zoomTo(value);
          }}
        />
      </div>

      <div className="w-screen overflow-x-scroll p-2">
        <canvas
          ref={canvasRef}
          width={1}
          height={1}
          className="mx-auto h-0 w-0 transition-all"
        >
          Your browser doesn&lsquo;t support HTML Canvas.
        </canvas>
      </div>
    </main>
  );
}
