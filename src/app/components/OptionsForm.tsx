import { type MazeOptions, MazeRenderer } from "@/lib/MazeRenderer";
import { type ChangeEvent, type ReactElement, useCallback } from "react";

export interface OptionsFormProps {
  mazeOptions: MazeOptions;
  setMazeOptions: (options: MazeOptions) => void;
  onGenerate: () => void;
  onSolve: () => void;
  onClear: () => void;
}

export default function OptionsForm({
  mazeOptions,
  setMazeOptions,
  onGenerate,
  onSolve,
  onClear,
}: OptionsFormProps): ReactElement {
  const onDimensionChange = useCallback(
    (
      e: ChangeEvent<HTMLInputElement>,
      key: keyof MazeOptions["dimensions"],
    ) => {
      const strValue: string = e.target.value;
      const value: number | undefined = strValue
        ? parseInt(strValue)
        : undefined;

      setMazeOptions({
        ...mazeOptions,
        dimensions: {
          ...mazeOptions.dimensions,
          [key]: value,
        },
      });
    },
    [mazeOptions, setMazeOptions],
  );

  return (
    <form
      className="flex flex-nowrap gap-2"
      onSubmit={(e) => {
        e.preventDefault();
      }}
    >
      {/* Rows */}
      <label className="flex flex-col">
        <span className="text-sm">Rows</span>
        <input
          type="number"
          min={3}
          step={1}
          value={mazeOptions.dimensions.rows ?? ""}
          placeholder={MazeRenderer.DEFAULT_DIMENSIONS.rows.toString()}
          onChange={(e) => {
            onDimensionChange(e, "rows");
          }}
          className="w-16 px-1 py-px"
        />
      </label>

      {/* Cols */}
      <label className="flex flex-col">
        <span className="text-sm">Cols</span>
        <input
          type="number"
          min={3}
          step={1}
          value={mazeOptions.dimensions.cols ?? ""}
          placeholder={MazeRenderer.DEFAULT_DIMENSIONS.cols.toString()}
          onChange={(e) => {
            onDimensionChange(e, "cols");
          }}
          className="w-16 px-1 py-px"
        />
      </label>

      {/* Animate Toggle */}
      <label className="h-min-full flex flex-col items-start">
        <span className="text-sm">Animate</span>
        <input
          type="checkbox"
          checked={mazeOptions.doAnimateGenerating}
          onChange={(e) => {
            setMazeOptions({
              ...mazeOptions,
              doAnimateGenerating: e.target.checked,
            });
          }}
          className="grow"
        />
      </label>

      <button
        onClick={onGenerate}
        className="self-end bg-green-800 px-4 py-2 text-zinc-100"
      >
        Generate
      </button>
      <button
        onClick={onClear}
        className="self-end bg-pink-800 px-4 py-2 text-zinc-100"
      >
        Clear
      </button>
    </form>
  );
}
