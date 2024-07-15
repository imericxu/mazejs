import { type ReactElement } from "react";
import { Label, Radio, RadioGroup } from "react-aria-components";

export interface ZoomBarProps {
  onChange: (value: number) => void;
}

export default function ZoomBar({ onChange }: ZoomBarProps): ReactElement {
  return (
    <>
      {/* Zoom settings island */}
      <RadioGroup
        name="zoom"
        defaultValue="1"
        onChange={(value) => {
          onChange(parseFloat(value));
        }}
        className="flex items-center gap-4 px-4 py-2"
      >
        <Label className="text-sm">Zoom</Label>
        {[
          ["0.25", "1/4"],
          ["0.5", "1/2"],
          ["1", "1"],
        ].map(([value, text]) => {
          return (
            <Radio
              key={value}
              value={value}
              className="inline-flex h-8 w-8 cursor-pointer items-center justify-center border border-b-2 border-border bg-primary-light text-xs transition-all pressed:border-b pressed:border-t-2 selected:cursor-default selected:border-b selected:bg-primary"
            >
              {text}
            </Radio>
          );
        })}
      </RadioGroup>
    </>
  );
}
