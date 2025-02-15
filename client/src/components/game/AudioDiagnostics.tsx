import { useState, useEffect } from 'react';
import { getAudioDiagnostics } from '@/lib/audio';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function AudioDiagnostics() {
  const [isVisible, setIsVisible] = useState(false);
  const [diagnostics, setDiagnostics] = useState<Record<string, any>>({});

  useEffect(() => {
    const updateDiagnostics = () => {
      setDiagnostics(getAudioDiagnostics());
    };

    // Update initially and every second
    updateDiagnostics();
    const interval = setInterval(updateDiagnostics, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!isVisible) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4"
      >
        Show Audio Diagnostics
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 p-4 w-80 bg-background/95 backdrop-blur shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">Audio Diagnostics</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsVisible(false)}
        >
          Hide
        </Button>
      </div>
      
      <div className="space-y-2">
        {Object.entries(diagnostics).map(([key, state]) => (
          <div key={key} className="text-sm">
            <div className="flex justify-between items-center">
              <span className="font-medium">{key}:</span>
              <span
                className={`px-2 py-0.5 rounded text-xs ${
                  state.loaded
                    ? 'bg-green-500/10 text-green-500'
                    : 'bg-red-500/10 text-red-500'
                }`}
              >
                {state.loaded ? 'Loaded' : 'Not Loaded'}
              </span>
            </div>
            {state.error && (
              <p className="text-xs text-red-500 mt-1">
                Error: {state.error}
              </p>
            )}
            {state.lastPlayAttempt > 0 && (
              <p className="text-xs text-muted-foreground">
                Last played: {new Date(state.lastPlayAttempt).toLocaleTimeString()}
              </p>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
