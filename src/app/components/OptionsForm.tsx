import { type FormActionType } from "@/app/page";
import type {
  GenerationAlgorithm,
  MazeSettings,
  SolveAlgorithm,
} from "@/lib/maze";
import { MazeController } from "@/lib/MazeController";
import { getFloatFromForm, getIntFromForm } from "@/lib/utils";
import { useCallback, useRef, type ReactElement } from "react";
import {
  Button,
  FieldError,
  Form,
  Input,
  Label,
  Switch,
  TextField,
} from "react-aria-components";
import { twMerge } from "tailwind-merge";
import GlassSelect from "./GlassSelect";

const GENERATION_ALGORITHMS: Record<GenerationAlgorithm, string> = {
  random: "Surprise Me!",
  prims: "Prim’s Algorithm",
  wilsons: "Wilson’s Algorithm",
  backtracker: "Recursive Backtracker",
} as const;

const SOLVE_ALGORITHMS: Record<SolveAlgorithm, string> = {
  random: "Surprise Me!",
  bfs: "Flood Fill (BFS)",
  tremaux: "Trémaux’s Algorithm (DFS)",
} as const;

export interface OptionsFormProps {
  onAction: (action: FormActionType, settings: MazeSettings) => void;
  solvable: boolean;
  className?: string;
}

export default function OptionsForm({
  onAction,
  solvable,
  className,
}: OptionsFormProps): ReactElement {
  const formRef = useRef<HTMLFormElement | null>(null);

  const handlePress = useCallback(
    (action: FormActionType) => {
      if (!formRef.current) return;

      const formData = new FormData(formRef.current);
      const rows: number =
        getIntFromForm(formData, "rows") ??
        MazeController.DEFAULTS.dimensions.rows;
      const cols: number =
        getIntFromForm(formData, "cols") ??
        MazeController.DEFAULTS.dimensions.cols;
      const cellWallRatio: number =
        getFloatFromForm(formData, "cellWallRatio") ??
        MazeController.DEFAULTS.dimensions.cellWallRatio;
      const generationAlgorithm: GenerationAlgorithm = formData.get(
        "generationAlgorithm",
      ) as GenerationAlgorithm;
      const doAnimateGenerating: boolean =
        formData.get("doAnimateGeneration") === "on";
      const solveAlgorithm: SolveAlgorithm = formData.get(
        "solveAlgorithm",
      ) as SolveAlgorithm;
      const doAnimateSolving: boolean =
        formData.get("doAnimateSolving") === "on";

      const settings: MazeSettings = {
        dimensions: {
          rows,
          cols,
          cellWallRatio,
        },
        generationAlgorithm,
        doAnimateGenerating,
        solveAlgorithm,
        doAnimateSolving,
      };

      if (action !== "clear" && !formRef.current.reportValidity()) return;

      onAction(action, settings);
    },
    [onAction],
  );

  return (
    <Form
      ref={formRef}
      onSubmit={(e) => {
        e.preventDefault();
      }}
      className={twMerge("flex flex-col items-center gap-4", className)}
    >
      {/* Island glass tube with majority of settings */}
      <div className="glass-tube-container mx-auto flex w-fit items-end gap-4 px-12 py-3">
        {/* Rows */}
        <TextField className="flex flex-col">
          <Label className="px-3 text-sm">Rows</Label>
          {/* Input doesn't allow ::after, a wrapper is needed */}
          <div className="relative h-8 w-16">
            <Input
              name="rows"
              type="number"
              step={1}
              min={MazeController.DIMS_RANGE.minSize}
              max={MazeController.DIMS_RANGE.maxSize}
              placeholder={MazeController.DEFAULTS.dimensions.rows.toString()}
              autoComplete="off"
              className="remove-input-arrows h-full w-full bg-transparent px-3"
            />
            {/* Glass tube */}
            <div className="glass-tube absolute inset-0"></div>
            {/* Error message */}
            <FieldError className="glass-surface absolute z-50 mt-2 block w-max max-w-prose rounded-md p-2" />
          </div>
        </TextField>

        {/* Cols */}
        <TextField className="flex flex-col">
          <Label className="px-3 text-sm">Cols</Label>
          {/* Input doesn't allow ::after, a wrapper is needed */}
          <div className="relative h-8 w-16">
            <Input
              name="cols"
              type="number"
              step={1}
              min={MazeController.DIMS_RANGE.minSize}
              max={MazeController.DIMS_RANGE.maxSize}
              placeholder={MazeController.DEFAULTS.dimensions.cols.toString()}
              autoComplete="off"
              className="remove-input-arrows h-full w-full bg-transparent px-3"
            />
            {/* Glass tube */}
            <div className="glass-tube absolute inset-0"></div>
            {/* Error message */}
            <FieldError className="glass-surface absolute z-50 mt-2 block w-max max-w-prose rounded-md p-2" />
          </div>
        </TextField>

        {/* Cell-Wall Ratio */}
        <TextField className="flex flex-col items-stretch">
          <Label className="px-3 text-sm">Cell-Wall Ratio</Label>
          {/* Input doesn't allow ::after, a wrapper is needed */}
          <div className="relative h-8">
            <Input
              name="cellWallRatio"
              type="number"
              min={MazeController.DIMS_RANGE.minRatio}
              max={MazeController.DIMS_RANGE.maxRatio}
              step={0.1}
              placeholder={MazeController.DEFAULTS.dimensions.cellWallRatio.toString()}
              autoComplete="off"
              className="remove-input-arrows h-full w-full bg-transparent px-3"
            />
            {/* Glass tube */}
            <div className="glass-tube absolute inset-0"></div>
            {/* Error message */}
            <FieldError className="glass-surface absolute z-50 mt-2 block w-max max-w-prose rounded-md p-2" />
          </div>
        </TextField>

        {/* Generation Algorithm Dropdown */}
        <GlassSelect
          name="generationAlgorithm"
          defaultSelectedKey="random"
          label="Generation Algorithm"
          items={Object.entries(GENERATION_ALGORITHMS)}
        />

        {/* Animate Generating Switch */}
        <Switch
          name="doAnimateGeneration"
          defaultSelected={true}
          className="group/switch flex flex-col items-start"
        >
          <Label className="text-sm">Animate Generation</Label>
          {/* Actual Switch */}
          {/* Track */}
          <div className="group/track glass-tube-container h-8 w-14 cursor-pointer transition-colors duration-200 group-selected/switch:bg-blue-500/20">
            {/* Circle/Handle */}
            <div className="glass-surface ms-[4px] mt-[4px] h-[24px] w-[24px] rounded-full bg-blue-500/60 transition-all duration-200 group-hover/track:bg-blue-500/70 group-pressed/switch:bg-blue-500/80 group-selected/switch:ml-[28px]"></div>
          </div>
        </Switch>

        {/* Solve Algorithm Dropdown */}
        <GlassSelect
          name="solveAlgorithm"
          defaultSelectedKey="random"
          label="Solve Algorithm"
          items={Object.entries(SOLVE_ALGORITHMS)}
        />

        {/* Animate Solving Switch */}
        <Switch
          name="doAnimateSolving"
          defaultSelected={true}
          className="group/switch flex flex-col items-start"
        >
          <Label className="text-sm">Animate Solving</Label>
          {/* Actual Switch */}
          {/* Track */}
          <div className="group/track glass-tube-container h-8 w-14 cursor-pointer transition-colors duration-200 group-selected/switch:bg-blue-500/20">
            {/* Circle/Handle */}
            <div className="glass-surface ms-[4px] mt-[4px] h-[24px] w-[24px] rounded-full bg-blue-500/60 transition-all duration-200 group-hover/track:bg-blue-500/70 group-pressed/switch:bg-blue-500/80 group-selected/switch:ml-[28px]"></div>
          </div>
        </Switch>

        <Button
          type="submit"
          onPress={() => handlePress("generate")}
          className="glass-tube-container h-8 bg-blue-500/20 px-4 transition hover:bg-blue-500/30 pressed:bg-blue-500/40"
        >
          Generate
        </Button>

        <Button
          isDisabled={!solvable}
          onPress={() => handlePress("solve")}
          className="glass-tube-container h-8 bg-blue-500/20 px-4 transition hover:bg-blue-500/30 pressed:bg-blue-500/40 disabled:cursor-not-allowed disabled:bg-slate-700/20"
        >
          Solve
        </Button>

        <Button
          onPress={() => handlePress("clear")}
          className="glass-tube-container h-8 bg-blue-500/20 px-4 transition hover:bg-blue-500/30 pressed:bg-blue-500/40"
        >
          Clear
        </Button>
      </div>
    </Form>
  );
}
