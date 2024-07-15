import type { MazeEvent, MazeSettings } from "@/lib/maze";
import { MazeController } from "@/lib/MazeController";
import { LucideSlidersHorizontal } from "lucide-react";
import { type ReactElement, useCallback } from "react";
import {
  Button,
  Dialog,
  DialogTrigger,
  Modal,
  ModalOverlay,
} from "react-aria-components";
import { useImmer } from "use-immer";
import SettingsForm, { FormFields } from "./SettingsForm";

export interface ActionBarProps {
  onEvent: (event: MazeEvent, settings: MazeSettings) => void;
  solvable: boolean;
}

export default function ActionBar({
  onEvent,
  solvable,
}: ActionBarProps): ReactElement {
  const [fields, setFields] = useImmer<FormFields>({
    dimensions: {
      rows: "",
      cols: "",
      cellWallRatio: MazeController.DEFAULTS.dimensions.cellWallRatio,
    },
    generationAlgorithm: MazeController.DEFAULTS.generationAlgorithm,
    doAnimateGenerating: MazeController.DEFAULTS.doAnimateGenerating,
    solveAlgorithm: MazeController.DEFAULTS.solveAlgorithm,
    doAnimateSolving: MazeController.DEFAULTS.doAnimateSolving,
  });

  const handleEvent = useCallback(
    (action: MazeEvent) => {
      const settings: MazeSettings = {
        dimensions: {
          rows: fields.dimensions.rows
            ? parseInt(fields.dimensions.rows)
            : MazeController.DEFAULTS.dimensions.rows,
          cols: fields.dimensions.cols
            ? parseInt(fields.dimensions.cols)
            : MazeController.DEFAULTS.dimensions.cols,
          cellWallRatio: fields.dimensions.cellWallRatio,
        },
        generationAlgorithm: fields.generationAlgorithm,
        doAnimateGenerating: fields.doAnimateGenerating,
        solveAlgorithm: fields.solveAlgorithm,
        doAnimateSolving: fields.doAnimateSolving,
      };
      console.log("Settings", settings);
      onEvent(action, settings);
    },
    [fields, onEvent],
  );

  return (
    <div className="flex w-full min-w-fit max-w-96 justify-center gap-[clamp(4px,5%,16px)] border border-b-2 border-border bg-surface-overlay px-4 py-2">
      {/* Generate Button */}
      <Button
        onPress={() => handleEvent("generate")}
        className="h-8 border border-b-2 border-border bg-secondary px-4 transition-all pressed:border-b pressed:border-t-2"
      >
        Generate
      </Button>

      {/* Solve Button */}
      <Button
        isDisabled={!solvable}
        onPress={() => handleEvent("solve")}
        className="h-8 border border-b-2 border-border bg-secondary px-4 pressed:border-b pressed:border-t-2 disabled:cursor-not-allowed disabled:border-b disabled:bg-disabled disabled:text-text-disabled"
      >
        Solve
      </Button>

      {/* More Settings Button */}
      <DialogTrigger>
        <Button
          aria-label="More Settings"
          className="h-8 border border-b-2 border-border bg-primary px-4 pressed:border-b pressed:border-t-2"
        >
          <LucideSlidersHorizontal strokeWidth={1.5} size={20} />
        </Button>

        {/* Settings Popover */}
        <ModalOverlay className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4 backdrop-blur-sm">
          <Modal className="relative w-full">
            <Dialog className="w-full outline-none">
              {({ close }) => (
                <SettingsForm
                  fields={fields}
                  setFields={setFields}
                  close={close}
                />
              )}
            </Dialog>
          </Modal>
        </ModalOverlay>
      </DialogTrigger>
    </div>
  );
}
