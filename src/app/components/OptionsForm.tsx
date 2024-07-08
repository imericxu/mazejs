import { type MazeSettings, MazeRenderer } from "@/lib/MazeRenderer";
import { produce } from "immer";
import { type ReactElement } from "react";
import {
  Button,
  Form,
  Input,
  Label,
  Switch,
  TextField,
} from "react-aria-components";
import { FormActionType } from "../page";
import { twMerge } from "tailwind-merge";

export interface OptionsFormProps {
  mazeOptions: MazeSettings;
  setMazeOptions: (settings: MazeSettings) => void;
  onAction: (action: FormActionType) => void;
  className?: string;
}

export default function OptionsForm({
  mazeOptions: mazeSettings,
  setMazeOptions,
  onAction,
  className,
}: OptionsFormProps): ReactElement {
  return (
    <Form
      onSubmit={(e) => {
        e.preventDefault();
      }}
      className={twMerge(
        "mx-auto flex w-fit gap-2 rounded-full border border-slate-50/80 bg-gradient-to-b from-slate-100/50 via-slate-400/50 via-20% px-12 py-2 shadow-lg",
        className,
      )}
    >
      {/* Rows */}
      <TextField className="flex flex-col">
        <Label className="ms-3 text-sm text-slate-900">Rows</Label>
        <Input
          type="number"
          step={1}
          min={MazeRenderer.SIZE_RANGE.min}
          max={MazeRenderer.SIZE_RANGE.max}
          value={mazeSettings.dimensions.rows}
          placeholder={MazeRenderer.DEFAULTS.dimensions.rows.toString()}
          onChange={(e) => {
            setMazeOptions(
              produce(mazeSettings, (draft) => {
                draft.dimensions.rows = parseInt(e.target.value);
              }),
            );
          }}
          className="h-8 w-16 rounded-full border border-slate-50/80 bg-slate-300/20 bg-gradient-to-b from-slate-50/50 via-slate-500/20 via-20% to-70% px-3 shadow-md"
        />
      </TextField>

      {/* Cols */}
      <TextField className="flex flex-col">
        <Label className="ms-3 text-sm text-slate-900">Cols</Label>
        <Input
          type="number"
          step={1}
          min={MazeRenderer.SIZE_RANGE.min}
          max={MazeRenderer.SIZE_RANGE.max}
          value={mazeSettings.dimensions.cols}
          placeholder={MazeRenderer.DEFAULTS.dimensions.cols.toString()}
          onChange={(e) => {
            setMazeOptions(
              produce(mazeSettings, (draft) => {
                draft.dimensions.cols = parseInt(e.target.value);
              }),
            );
          }}
          className="h-8 w-16 rounded-full border border-slate-50/80 bg-slate-300/20 bg-gradient-to-b from-slate-50/50 via-slate-500/20 via-20% to-70% px-3 shadow-md"
        />
      </TextField>

      {/* Animate Generating Switch */}
      <Switch
        isSelected={mazeSettings.doAnimateGenerating}
        onChange={(isSelected) => {
          setMazeOptions({
            ...mazeSettings,
            doAnimateGenerating: isSelected,
          });
        }}
        className="group flex flex-col items-start"
      >
        <Label className="text-sm">Animate</Label>
        {/* Actual Switch */}
        <div className="relative h-8 w-14">
          {/* Circle */}
          <div className="ml-[3px] mt-[3px] h-[26px] w-[26px] rounded-full border-2 border-slate-50/80 bg-blue-500/90 shadow transition-all group-selected:ml-[28px]"></div>
          {/* Track */}
          <div className="absolute inset-0 rounded-full border border-slate-50/80 bg-slate-300/20 bg-gradient-to-b from-slate-50/50 via-slate-500/20 via-20% to-70% shadow-md transition group-selected:bg-blue-500/30"></div>
        </div>
      </Switch>

      <Button
        onPress={() => {
          onAction("generate");
        }}
        className="h-8 self-end rounded-full border border-slate-50/80 bg-blue-500/30 bg-gradient-to-b from-slate-50/50 via-slate-500/20 via-20% to-70% px-4 shadow-md"
      >
        Generate
      </Button>
      <Button
        onPress={() => {
          onAction("clear");
        }}
        className="h-8 self-end rounded-full border border-slate-50/80 bg-blue-500/20 bg-gradient-to-b from-slate-50/50 via-slate-500/20 via-20% to-70% px-4 shadow-md"
      >
        Clear
      </Button>
    </Form>
  );
}
