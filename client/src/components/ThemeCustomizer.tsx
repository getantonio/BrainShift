import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Settings2, ChevronUp, ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { useTheme } from "@/lib/theme-context";
import { useState } from "react";

export function ThemeCustomizer() {
  const { colors, updateColors } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const handleColorChange = (section: keyof typeof colors, key: string, value: string) => {
    updateColors({
      [section]: {
        ...colors[section],
        [key]: value
      }
    });
  };

  return (
    <Card className="bg-zinc-900/50 border-white/10">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="w-full flex items-center justify-between bg-zinc-800/80 hover:bg-zinc-700/80 text-gray-200 border-zinc-600"
          >
            <div className="flex items-center">
              <Settings2 className="w-4 h-4 mr-2" />
              Customize Theme
            </div>
            {isOpen ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-4">
            <div className="grid gap-6">
              {Object.entries(colors).map(([section, sectionColors]) => (
                <div key={section} className="space-y-4">
                  <h3 className="text-lg font-semibold text-white capitalize">{section}</h3>
                  <div className="grid gap-4">
                    {Object.entries(sectionColors).map(([key, value]) => (
                      <div key={key} className="grid gap-2">
                        <Label htmlFor={`${section}-${key}`} className="text-white/80 capitalize">
                          {key}
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            id={`${section}-${key}`}
                            type="color"
                            value={value}
                            onChange={(e) => handleColorChange(section as keyof typeof colors, key, e.target.value)}
                            className="w-12 h-12 p-1 bg-transparent border-white/20"
                          />
                          <Input
                            type="text"
                            value={value}
                            onChange={(e) => handleColorChange(section as keyof typeof colors, key, e.target.value)}
                            className="flex-1 bg-zinc-800 border-white/20 text-white"
                            placeholder={`Enter ${key} color`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
