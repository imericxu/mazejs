import { MazeRenderer, type MazeSettings } from "@/lib/MazeRenderer";
import { getFloatFromForm, getIntFromForm } from "@/lib/utils";
import { useCallback, useRef, type ReactElement } from "react";
import {
  Button,
  FieldError,
  Form,
  Input,
  Label,
  Radio,
  RadioGroup,
  Switch,
  TextField,
} from "react-aria-components";
import { twMerge } from "tailwind-merge";
import { FormActionType } from "../page";

export interface OptionsFormProps {
  onAction: (action: FormActionType, settings: MazeSettings) => void;
  className?: string;
}

export default function OptionsForm({
  onAction,
  className,
}: OptionsFormProps): ReactElement {
  const formRef = useRef<HTMLFormElement | null>(null);

  const handlePress = useCallback(
    (action: FormActionType) => {
      if (!formRef.current) return;

      const formData = new FormData(formRef.current);
      const rows: number =
        getIntFromForm(formData, "rows") ??
        MazeRenderer.DEFAULTS.dimensions.rows;
      const cols: number =
        getIntFromForm(formData, "cols") ??
        MazeRenderer.DEFAULTS.dimensions.cols;
      const cellWallRatio: number =
        getFloatFromForm(formData, "cellWallRatio") ??
        MazeRenderer.DEFAULTS.dimensions.cellWallRatio;
      const zoomLevel: number =
        getFloatFromForm(formData, "zoom") ??
        MazeRenderer.DEFAULTS.dimensions.zoomLevel;
      const doAnimateGenerating: boolean =
        formData.get("doAnimateGeneration") === "on";
      const doAnimateSolving: boolean =
        formData.get("doAnimateSolving") === "on";

      const settings: MazeSettings = {
        dimensions: {
          rows,
          cols,
          cellWallRatio,
          zoomLevel,
        },
        doAnimateGenerating,
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
              min={MazeRenderer.DIMS_RANGE.minSize}
              max={MazeRenderer.DIMS_RANGE.maxSize}
              placeholder={MazeRenderer.DEFAULTS.dimensions.rows.toString()}
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
              min={MazeRenderer.DIMS_RANGE.minSize}
              max={MazeRenderer.DIMS_RANGE.maxSize}
              placeholder={MazeRenderer.DEFAULTS.dimensions.cols.toString()}
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
              min={MazeRenderer.DIMS_RANGE.minRatio}
              max={MazeRenderer.DIMS_RANGE.maxRatio}
              step={0.1}
              placeholder={MazeRenderer.DEFAULTS.dimensions.cellWallRatio.toString()}
              autoComplete="off"
              className="remove-input-arrows h-full w-full bg-transparent px-3"
            />
            {/* Glass tube */}
            <div className="glass-tube absolute inset-0"></div>
            {/* Error message */}
            <FieldError className="glass-surface absolute z-50 mt-2 block w-max max-w-prose rounded-md p-2" />
          </div>
        </TextField>

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

        {/* Generation Algorithms Select */}

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
          onPress={() => handlePress("solve")}
          className="glass-tube-container h-8 bg-blue-500/20 px-4 transition hover:bg-blue-500/30 pressed:bg-blue-500/40"
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

      {/* Zoom settings island */}
      <RadioGroup
        name="zoom"
        defaultValue="1"
        className="flex items-center gap-2 text-sm"
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
    </Form>
  );
}
