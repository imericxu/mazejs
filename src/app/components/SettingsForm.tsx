import type { GenerationAlgorithm, SolveAlgorithm } from "@/lib/maze";
import { MazeController } from "@/lib/MazeController";
import { getFloatFromForm } from "@/lib/utils";
import { type ReactElement, useCallback, useRef } from "react";
import {
  Button,
  FieldError,
  Form,
  Input,
  Label,
  Slider,
  SliderOutput,
  SliderThumb,
  SliderTrack,
  Switch,
  TextField,
} from "react-aria-components";
import MySelect from "./MySelect";

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

export interface FormFields {
  dimensions: {
    rows: string;
    cols: string;
    cellWallRatio: number;
  };
  generationAlgorithm: GenerationAlgorithm;
  doAnimateGenerating: boolean;
  solveAlgorithm: SolveAlgorithm;
  doAnimateSolving: boolean;
}

export interface SettingsFormProps {
  fields: FormFields;
  setFields: (fields: FormFields) => void;
  close: () => void;
}

export default function SettingsForm({
  fields,
  setFields,
  close,
}: SettingsFormProps): ReactElement {
  const formRef = useRef<HTMLFormElement>(null);

  const onExit = useCallback(() => {
    if (!formRef.current?.reportValidity()) return;

    const formData = new FormData(formRef.current!);
    const settings: FormFields = {
      dimensions: {
        rows: formData.get("rows")!.toString(),
        cols: formData.get("cols")!.toString(),
        cellWallRatio: getFloatFromForm(formData, "cellWallRatio")!,
      },
      generationAlgorithm: formData.get(
        "generationAlgorithm",
      ) as GenerationAlgorithm,
      doAnimateGenerating: formData.get("doAnimateGeneration") === "on",
      solveAlgorithm: formData.get("solveAlgorithm") as SolveAlgorithm,
      doAnimateSolving: formData.get("doAnimateSolve") === "on",
    };
    setFields(settings);
    close();
  }, [close, setFields]);

  return (
    <Form
      ref={formRef}
      onSubmit={(e) => {
        e.preventDefault();
      }}
      className="mx-auto flex w-full min-w-72 max-w-screen-sm flex-col gap-4 border-2 border-border bg-surface p-4"
    >
      <h2 className="text-xl">Maze Settings</h2>

      {/* Dimensions */}
      <section className="flex flex-col gap-3">
        <h3 className="text-lg">Dimensions</h3>

        <div className="grid grid-cols-[minmax(0,1fr),auto] grid-rows-[auto,auto] gap-x-4 gap-y-3">
          <div className="flex gap-4">
            {/* Rows */}
            <TextField
              name="rows"
              inputMode="numeric"
              autoComplete="off"
              defaultValue={fields.dimensions.rows}
              className="relative flex min-w-16 grow flex-col"
            >
              <Label className="text-sm">Rows</Label>
              <Input
                type="number"
                step={1}
                min={MazeController.DIMS_RANGE.minSize}
                max={MazeController.DIMS_RANGE.maxSize}
                placeholder={MazeController.DEFAULTS.dimensions.rows.toString()}
                className="remove-input-arrows peer h-8 w-full border border-border bg-transparent px-2 transition-colors invalid:border-red-600"
              />
              <FieldError className="absolute top-full z-50 hidden w-max max-w-44 bg-error p-2 text-surface peer-focus:block" />
            </TextField>

            {/* Cols */}
            <TextField
              name="cols"
              inputMode="numeric"
              autoComplete="off"
              defaultValue={fields.dimensions.cols}
              className="relative flex min-w-16 grow flex-col"
            >
              <Label className="text-sm">Columns</Label>
              <Input
                type="number"
                step={1}
                min={MazeController.DIMS_RANGE.minSize}
                max={MazeController.DIMS_RANGE.maxSize}
                placeholder={MazeController.DEFAULTS.dimensions.cols.toString()}
                className="remove-input-arrows peer h-8 w-full border border-border bg-transparent px-2 transition-colors invalid:border-red-600"
              />
              <FieldError className="absolute top-full z-50 hidden w-max max-w-44 bg-error p-2 text-surface peer-focus:block" />
            </TextField>
          </div>

          <span className="self-end text-sm text-text-placeholder">
            <span className="sm:hidden">Range</span>
            <span className="hidden sm:inline">Rows &amp; columns range</span>:
            [{MazeController.DIMS_RANGE.minSize},&nbsp;
            {MazeController.DIMS_RANGE.maxSize}]
          </span>

          {/* Cell-Wall Ratio Slider */}
          <Slider
            minValue={MazeController.DIMS_RANGE.minRatio}
            maxValue={MazeController.DIMS_RANGE.maxRatio}
            step={0.1}
            defaultValue={fields.dimensions.cellWallRatio}
            className="col-span-full flex min-w-60 flex-col sm:col-start-2 sm:row-start-1"
          >
            <div className="flex justify-between text-sm">
              <Label>Cell-Wall Ratio</Label>
              <SliderOutput />
            </div>
            <div className="relative flex h-8 items-center px-2">
              <SliderTrack className="w-full border border-border">
                <SliderThumb
                  name="cellWallRatio"
                  className="h-4 w-4 cursor-pointer border border-b-2 border-border bg-primary transition-[margin] dragging:-mt-0.5"
                />
              </SliderTrack>
            </div>
          </Slider>
        </div>
      </section>

      {/* Generation Algorithm */}
      <section className="flex flex-col gap-3">
        <h3 className="text-lg">Algorithms</h3>

        <div className="flex flex-col gap-3 sm:flex-row">
          {/* Generation Algorithm Dropdown */}
          <MySelect
            name="generationAlgorithm"
            defaultSelectedKey={fields.generationAlgorithm}
            label="Generation"
            items={Object.entries(GENERATION_ALGORITHMS)}
          />

          {/* Solve Algorithm Dropdown */}
          <MySelect
            name="solveAlgorithm"
            defaultSelectedKey={fields.solveAlgorithm}
            label="Solve"
            items={Object.entries(SOLVE_ALGORITHMS)}
          />
        </div>
      </section>

      {/* Animation Toggles */}
      <section className="flex flex-col gap-3">
        <h3 className="text-lg">Animation</h3>

        <Switch
          name="doAnimateGeneration"
          defaultSelected={fields.doAnimateGenerating}
          className="group/switch flex items-center justify-between"
        >
          <Label aria-label="Animate Generation">Generation</Label>
          {/* Track */}
          <div className="group/track flex h-7 w-12 cursor-pointer items-center border border-t border-border bg-disabled duration-200 group-selected/switch:bg-primary">
            {/* Circle/Handle */}
            <div className="ms-[2px] h-[22px] w-[22px] border border-b-2 border-border bg-surface duration-200 group-selected/switch:ml-[22px]"></div>
          </div>
        </Switch>

        <Switch
          name="doAnimateSolve"
          defaultSelected={fields.doAnimateSolving}
          className="group/switch flex items-center justify-between"
        >
          <Label aria-label="Animate Generation">Solve</Label>
          {/* Track */}
          <div className="group/track flex h-7 w-12 cursor-pointer items-center border border-t border-border bg-disabled duration-200 group-selected/switch:bg-primary">
            {/* Circle/Handle */}
            <div className="ms-[2px] h-[22px] w-[22px] border border-b-2 border-border bg-surface duration-200 group-selected/switch:ml-[22px]"></div>
          </div>
        </Switch>
      </section>

      {/* Save-and-Exit Button */}
      <Button
        type="submit"
        onPress={onExit}
        className="h-8 border border-b-2 border-border bg-secondary px-4 pressed:border-b pressed:border-t-2 disabled:cursor-not-allowed disabled:border-b disabled:bg-disabled disabled:text-text-disabled"
      >
        Save and Exit
      </Button>
    </Form>
  );
}
