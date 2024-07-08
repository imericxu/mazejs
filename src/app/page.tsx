"use client";
import { MazeSettings, MazeRenderer } from "@/lib/MazeRenderer";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactElement,
} from "react";
import OptionsForm from "./components/OptionsForm";
import { useImmer } from "use-immer";
import { match } from "ts-pattern";

export type FormActionType = "generate" | "solve" | "clear";

export default function Home(): ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mazeRenderer, setMazeRenderer] = useState<MazeRenderer | null>(null);
  const [mazeOptions, setMazeOptions] = useImmer<MazeSettings>(
    MazeRenderer.DEFAULTS,
  );

  useEffect(() => {
    if (canvasRef.current === null) return;
    const ctx = canvasRef.current.getContext("2d");
    if (ctx === null) return;
    setMazeRenderer((prev) => {
      if (prev !== null) return prev;
      return new MazeRenderer(ctx);
    });
  }, []);

  const onAction = useCallback(
    (action: FormActionType) => {
      if (mazeRenderer === null) return;
      match(action)
        .with("generate", () => mazeRenderer.generateMaze(mazeOptions))
        .with("solve", () => mazeRenderer.solveMaze(mazeOptions))
        .with("clear", () => mazeRenderer.clear())
        .exhaustive();
    },
    [mazeRenderer, mazeOptions],
  );

  return (
    <>
      <OptionsForm
        mazeOptions={mazeOptions}
        setMazeOptions={setMazeOptions}
        onAction={onAction}
        className="mt-4"
      />

      <div className="relative mx-auto mt-8 h-fit w-fit p-5">
        <canvas ref={canvasRef}>
          Your browser doesn&lsquo;t support HTML Canvas.
        </canvas>
        <div className="absolute inset-0 rounded-2xl border border-slate-50/80 bg-slate-50/5 bg-gradient-to-b from-transparent via-slate-50/10 via-20% to-50% shadow-lg"></div>
      </div>
    </>
  );
}
