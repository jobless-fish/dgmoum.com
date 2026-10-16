import * as Slider from "@radix-ui/react-slider";
import { useEditor } from "@/lib/editor/store";

export function FieldSlider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  format?: (value: number) => string;
}) {
  return (
    <label className="field">
      <span className="field-label">
        <span>{label}</span>
        <span className="field-value">{format ? format(value) : value.toFixed(2)}</span>
      </span>
      <Slider.Root
        className="slider"
        min={min}
        max={max}
        step={step}
        value={[Number.isFinite(value) ? value : min]}
        onPointerDown={() => useEditor.getState().begin()}
        onPointerUp={() => useEditor.getState().end()}
        onValueChange={([next]) => {
          if (next != null) onChange(next);
        }}
      >
        <Slider.Track className="slider-track">
          <Slider.Range className="slider-range" />
        </Slider.Track>
        <Slider.Thumb className="slider-thumb" aria-label={label} />
      </Slider.Root>
    </label>
  );
}
