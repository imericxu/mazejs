"use client";
import { MazeController, type MazeSettings } from "@/lib/MazeController";
import { type RectSize } from "@/lib/twoDimens";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactElement,
} from "react";
import { Label, Radio, RadioGroup } from "react-aria-components";
import { match } from "ts-pattern";
import OptionsForm from "./components/OptionsForm";

export type FormActionType = "generate" | "solve" | "clear";

export default function Home(): ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mazeController, setMazeController] = useState<MazeController | null>(
    null,
  );
  const [solvable, setSolvable] = useState(false);

  useEffect(() => {
    if (canvasRef.current === null) return;
    const ctx = canvasRef.current.getContext("2d");
    if (ctx === null) return;
    setMazeController((prev) => {
      if (prev !== null) return prev;
      return new MazeController(
        ctx,
        (size: Readonly<RectSize>) => {
          if (containerRef.current === null) return;
          containerRef.current.style.width = `${size.width}px`;
          containerRef.current.style.height = `${size.height}px`;
        },
        setSolvable,
      );
    });
  }, []);

  const onAction = useCallback(
    (action: FormActionType, settings: MazeSettings) => {
      if (mazeController === null) return;
      match(action)
        .with("generate", () => {
          mazeController.generate(settings);
        })
        .with("solve", () => {
          mazeController.solve(settings);
        })
        .with("clear", () => {
          mazeController.clear();
        })
        .exhaustive();
    },
    [mazeController],
  );

  return (
    <main className="flex flex-col items-center gap-8 p-4">
      <OptionsForm onAction={onAction} solvable={solvable} />

      {/* Zoom settings island */}
      <RadioGroup
        name="zoom"
        defaultValue="1"
        onChange={(value) => {
          if (mazeController === null) return;
          mazeController.zoomTo(parseFloat(value));
        }}
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
        <div
          ref={containerRef}
          className="glass-surface mx-auto box-content h-0 w-0 rounded-2xl p-5 transition-all"
        >
          <canvas ref={canvasRef} className="h-0 w-0 transition-all">
            Your browser doesn&lsquo;t support HTML Canvas.
          </canvas>
        </div>
      </div>
    </main>
  );
}
