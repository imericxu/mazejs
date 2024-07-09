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
import { match } from "ts-pattern";

export type FormActionType = "generate" | "solve" | "clear";

export default function Home(): ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mazeRenderer, setMazeRenderer] = useState<MazeRenderer | null>(null);

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
    (action: FormActionType, settings: MazeSettings) => {
      if (mazeRenderer === null) return;
      match(action)
        .with("generate", () => {
          mazeRenderer.generate(settings);
        })
        .with("solve", () => {
          mazeRenderer.solve(settings);
        })
        .with("clear", () => {
          mazeRenderer.clear();
        })
        .exhaustive();
    },
    [mazeRenderer],
  );

  return (
    <>
      <OptionsForm onAction={onAction} className="mt-4" />

      <div className="glass-surface mx-auto mt-8 h-fit w-fit rounded-2xl p-5">
        <canvas ref={canvasRef}>
          Your browser doesn&lsquo;t support HTML Canvas.
        </canvas>
      </div>
    </>
  );
}
