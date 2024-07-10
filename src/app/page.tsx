"use client";
import { MazeSettings, MazeRenderer } from "@/lib/MazeController";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactElement,
} from "react";
import OptionsForm from "./components/OptionsForm";
import { match } from "ts-pattern";
import { Label, Radio, RadioGroup } from "react-aria-components";

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
    <main className="flex flex-col items-center gap-8 p-4">
      <OptionsForm onAction={onAction} />

      {/* Zoom settings island */}
      <RadioGroup
        name="zoom"
        defaultValue="1"
        className="glass-tube-container flex items-center gap-2 px-4 py-2 text-sm"
      >
        <Label>Zoom</Label>
        <Radio
          value="0.25"
          className="glass-tube-container inline-flex h-9 w-9 cursor-pointer items-center justify-center transition-colors hover:bg-blue-500/25 pressed:bg-blue-500/40 selected:cursor-default selected:bg-blue-500/20"
        >
          1/4
        </Radio>
        <Radio
          value="0.5"
          className="glass-tube-container inline-flex h-9 w-9 cursor-pointer items-center justify-center transition-colors hover:bg-blue-500/25 pressed:bg-blue-500/40 selected:cursor-default selected:bg-blue-500/20"
        >
          1/2
        </Radio>
        <Radio
          value="1"
          className="glass-tube-container inline-flex h-9 w-9 cursor-pointer items-center justify-center transition-colors hover:bg-blue-500/25 pressed:bg-blue-500/40 selected:cursor-default selected:bg-blue-500/20"
        >
          1
        </Radio>
      </RadioGroup>

      <div className="w-screen overflow-x-scroll p-2">
        <div className="glass-surface mx-auto h-fit w-fit rounded-2xl p-5">
          <canvas ref={canvasRef}>
            Your browser doesn&lsquo;t support HTML Canvas.
          </canvas>
        </div>
      </div>
    </main>
  );
}
