import { Card } from "@/components/ui/card";
import GameCanvas from "@/components/game/GameCanvas";

export default function Home() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background p-4">
      <div className="max-w-4xl w-full">
        <h1 className="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          Two-Player Pong
        </h1>
        
        <Card className="p-4">
          <div className="space-y-4">
            <GameCanvas />
            
            <div className="text-sm text-muted-foreground">
              <h2 className="font-semibold text-foreground mb-2">Controls:</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium">Player 1 (Left)</h3>
                  <p>W - Move Up</p>
                  <p>S - Move Down</p>
                </div>
                <div>
                  <h3 className="font-medium">Player 2 (Right)</h3>
                  <p>↑ - Move Up</p>
                  <p>↓ - Move Down</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
