import { LucideCheck, LucideChevronDown } from "lucide-react";
import { type ReactElement } from "react";
import {
  Button,
  Label,
  ListBox,
  ListBoxItem,
  Popover,
  Select,
  SelectValue,
} from "react-aria-components";
import { twMerge } from "tailwind-merge";

export interface MySelectProps {
  name: string;
  defaultSelectedKey: string;
  label: string;
  ariaLabel?: string;
  items: [string, string][];
  className?: string;
}

export default function MySelect({
  name,
  defaultSelectedKey,
  label,
  ariaLabel,
  items,
  className,
}: MySelectProps): ReactElement {
  return (
    <Select
      name={name}
      defaultSelectedKey={defaultSelectedKey}
      className={twMerge("group/select flex w-full flex-col", className)}
    >
      <Label aria-label={ariaLabel} className="text-sm">
        {label}
      </Label>

      {/* Select Button */}
      <Button className="relative h-8 w-full border border-border pe-9 ps-3 text-start transition-colors hover:bg-primary-light">
        <SelectValue className="block w-full overflow-hidden overflow-ellipsis text-nowrap" />
        {/* Down arrow. Flips over on open */}
        <LucideChevronDown
          aria-hidden
          className="absolute end-3 top-1/2 -translate-y-1/2 stroke-1 transition group-open/select:rotate-180"
        />
      </Button>

      {/* Dropdown */}
      <Popover className="min-w-[var(--trigger-width)]">
        <ListBox
          items={items}
          className="flex flex-col border border-border bg-surface"
        >
          {(item) => (
            <ListBoxItem
              key={item[0]}
              id={item[0]}
              textValue={item[1]}
              className="group/item relative flex h-8 cursor-pointer select-none items-center gap-1 pe-3 ps-9 focus:bg-primary-light focus:outline-none"
            >
              {/* Checkmark */}
              <LucideCheck
                aria-hidden
                className="invisible absolute left-2 top-1/2 h-6 w-6 shrink-0 -translate-y-1/2 stroke-1 group-selected/item:visible"
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
