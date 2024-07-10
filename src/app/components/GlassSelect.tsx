import { ChevronDown, Check } from "lucide-react";
import { ReactElement } from "react";
import {
  Select,
  Label,
  Button,
  SelectValue,
  Popover,
  ListBox,
  ListBoxItem,
} from "react-aria-components";

export interface GlassSelectProps {
  name: string;
  defaultSelectedKey: string;
  label: string;
  items: [string, string][];
}

export default function GlassSelect({
  name,
  defaultSelectedKey,
  label,
  items,
}: GlassSelectProps): ReactElement {
  return (
    <Select
      name={name}
      className="flex flex-col items-start"
      defaultSelectedKey={defaultSelectedKey}
    >
      <Label className="px-3 text-sm">{label}</Label>

      {/* Select Button */}
      <Button className="glass-tube-container h-8 w-48 text-nowrap pe-9 ps-3 text-start transition-colors hover:bg-blue-500/20">
        <SelectValue className="block w-full overflow-hidden overflow-ellipsis" />
        {/* Down arrow. Flips over on open */}
        <ChevronDown className="absolute end-3 top-1/2 -translate-y-1/2 stroke-1 transition-transform group-open/select:rotate-180" />
      </Button>

      {/* Dropdown */}
      <Popover>
        <ListBox
          items={items}
          className="glass-surface flex flex-col gap-1 rounded-md bg-slate-50/20 p-2"
        >
          {(item) => (
            <ListBoxItem
              key={item[0]}
              id={item[0]}
              textValue={item[1]}
              className="group/item relative flex h-8 cursor-pointer select-none items-center gap-1 ps-7 focus:outline-none"
            >
              {/* Blurred background on focus */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-r from-blue-500/30 opacity-0 blur transition duration-200 group-focus/item:opacity-100"
              ></div>

              {/* Checkmark */}
              <Check
                aria-hidden
                className="invisible absolute left-0 top-1/2 shrink-0 -translate-y-1/2 stroke-1 group-selected/item:visible"
              />

              {/* Label */}
              <span>{item[1]}</span>
            </ListBoxItem>
          )}
        </ListBox>
      </Popover>
    </Select>
  );
}
