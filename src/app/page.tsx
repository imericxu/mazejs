"use client";
import { MazeOptions, MazeRenderer } from "@/lib/MazeRenderer";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactElement,
} from "react";
import OptionsForm from "./components/OptionsForm";

export default function Home(): ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mazeRenderer, setMazeRenderer] = useState<MazeRenderer | null>(null);
  const [mazeOptions, setMazeOptions] = useState<MazeOptions>({
    dimensions: {},
    doAnimateGenerating: true,
    doAnimateSolving: true,
  });

  useEffect(() => {
    if (mazeRenderer !== null || canvasRef.current === null) return;
    const ctx = canvasRef.current.getContext("2d");
    if (ctx === null) return;
    const renderer = new MazeRenderer(ctx);
    setMazeRenderer(renderer);
  }, [mazeRenderer]);

  const onClear = useCallback(() => {
    mazeRenderer?.clear();
  }, [mazeRenderer]);

  const onGenerate = useCallback(() => {
    mazeRenderer?.generateMaze(mazeOptions);
  }, [mazeRenderer, mazeOptions]);

  const onSolve = useCallback(() => {
    mazeRenderer?.solveMaze(mazeOptions);
  }, [mazeRenderer, mazeOptions]);

  return (
    <>
      <OptionsForm
        mazeOptions={mazeOptions}
        setMazeOptions={setMazeOptions}
        onClear={onClear}
        onGenerate={onGenerate}
        onSolve={onSolve}
      />
      <canvas ref={canvasRef} className="m-auto">
        Your browser doesn&lsquo;t support HTML Canvas.
      </canvas>
    </>
  );
}
