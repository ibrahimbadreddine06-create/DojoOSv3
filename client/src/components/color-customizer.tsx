import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { DEFAULT_MODULE_COLORS, useColorCustomization, type ModuleType } from '@/hooks/useColorCustomization';

export function ColorCustomizer() {
  const { colors, updateColor, resetColors } = useColorCustomization();
  const [open, setOpen] = useState(false);

  const modules: { name: ModuleType; label: string }[] = [
    { name: 'planner', label: 'Planner' },
    { name: 'goals', label: 'Goals' },
    { name: 'second_brain', label: 'Second Brain' },
    { name: 'languages', label: 'Languages' },
    { name: 'studies', label: 'Studies' },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          size="icon" 
          variant="ghost" 
          data-testid="button-color-settings"
          title="Customize module colors"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Module Colors</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {modules.map((module) => {
            const color = colors[module.name];
            const hslString = `hsl(${color.h}, ${color.s}%, ${color.l}%)`;
            
            return (
              <div key={module.name} className="flex items-center gap-3">
                <label className="text-sm font-medium flex-1">{module.label}</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={hslString}
                    onChange={(e) => {
                      const hex = e.target.value;
                      const rgb = hexToRgb(hex);
                      if (rgb) {
                        const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
                        updateColor(module.name, hsl);
                      }
                    }}
                    className="w-10 h-10 rounded cursor-pointer"
                    data-testid={`color-picker-${module.name}`}
                  />
                  <span className="text-xs text-muted-foreground font-mono w-16 text-right">
                    {color.h}°
                  </span>
                </div>
              </div>
            );
          })}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => { resetColors(); setOpen(false); }}
            className="w-full mt-4"
            data-testid="button-reset-colors"
          >
            Reset to Defaults
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : null;
}

function rgbToHsl(r: number, g: number, b: number) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}
