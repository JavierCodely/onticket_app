/**
 * ColorPicker Atom Component
 * Input for selecting HSL colors
 *
 * Atomic Design Level: Atom
 * Features: Color preview, HSL input
 */

import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';

interface ColorPickerProps {
  label: string;
  value: string; // HSL format: "222.2 47.4% 11.2%"
  onChange: (value: string) => void;
  description?: string;
}

/**
 * Converts HSL string to individual values
 */
const parseHSL = (hsl: string): { h: number; s: number; l: number } => {
  const parts = hsl.split(' ');
  return {
    h: parseFloat(parts[0]) || 0,
    s: parseFloat(parts[1]) || 0,
    l: parseFloat(parts[2]) || 0,
  };
};

/**
 * Converts HSL values to string format
 */
const formatHSL = (h: number, s: number, l: number): string => {
  return `${h} ${s}% ${l}%`;
};

export const ColorPicker: React.FC<ColorPickerProps> = ({
  label,
  value,
  onChange,
  description,
}) => {
  const { h, s, l } = parseHSL(value);
  const [hue, setHue] = useState(h);
  const [saturation, setSaturation] = useState(s);
  const [lightness, setLightness] = useState(l);

  // Sync internal state when value prop changes
  useEffect(() => {
    const parsed = parseHSL(value);
    setHue(parsed.h);
    setSaturation(parsed.s);
    setLightness(parsed.l);
  }, [value]);

  const handleHueChange = (values: number[]) => {
    const newHue = values[0];
    setHue(newHue);
    onChange(formatHSL(newHue, saturation, lightness));
  };

  const handleSaturationChange = (values: number[]) => {
    const newSaturation = values[0];
    setSaturation(newSaturation);
    onChange(formatHSL(hue, newSaturation, lightness));
  };

  const handleLightnessChange = (values: number[]) => {
    const newLightness = values[0];
    setLightness(newLightness);
    onChange(formatHSL(hue, saturation, newLightness));
  };

  // Convert HSL to CSS format for preview
  const previewColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;

  return (
    <div className="space-y-2">
      <Label htmlFor={label}>{label}</Label>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start text-left font-normal"
          >
            <div
              className="mr-2 h-4 w-4 rounded border"
              style={{ backgroundColor: previewColor }}
            />
            <span className="text-sm font-mono">{value}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Tono (Hue)</Label>
                <span className="text-xs text-muted-foreground">{hue.toFixed(1)}°</span>
              </div>
              <Slider
                value={[hue]}
                onValueChange={handleHueChange}
                max={360}
                step={0.1}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Saturación (Saturation)</Label>
                <span className="text-xs text-muted-foreground">{saturation.toFixed(1)}%</span>
              </div>
              <Slider
                value={[saturation]}
                onValueChange={handleSaturationChange}
                max={100}
                step={0.1}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Luminosidad (Lightness)</Label>
                <span className="text-xs text-muted-foreground">{lightness.toFixed(1)}%</span>
              </div>
              <Slider
                value={[lightness]}
                onValueChange={handleLightnessChange}
                max={100}
                step={0.1}
                className="w-full"
              />
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Vista previa</Label>
                <div
                  className="h-8 w-full ml-4 rounded border"
                  style={{ backgroundColor: previewColor }}
                />
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
