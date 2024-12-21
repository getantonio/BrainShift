import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/lib/theme-context";

export function ColorCustomizer() {
  const { colors, updateColors } = useTheme();

  return (
    <Card className="bg-zinc-900 border-white/10">
      <CardHeader>
        <CardTitle className="text-white">Color Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {Object.entries(colors).map(([key, value]) => (
            <div key={key} className="grid gap-2">
              <Label htmlFor={key} className="text-white capitalize">
                {key}
              </Label>
              <div className="flex gap-2">
                <Input
                  id={key}
                  type="color"
                  value={value}
                  onChange={(e) => updateColors({ [key]: e.target.value })}
                  className="w-12 h-12 p-1 bg-transparent border-white/20"
                />
                <Input
                  type="text"
                  value={value}
                  onChange={(e) => updateColors({ [key]: e.target.value })}
                  className="flex-1 bg-zinc-800 border-white/20 text-white"
                  placeholder={`Enter ${key} color`}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
