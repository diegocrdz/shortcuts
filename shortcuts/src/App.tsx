import { useEffect } from "react";
import { getCurrentWindow, currentMonitor, LogicalPosition } from "@tauri-apps/api/window";

function App() {
  useEffect(() => {
  async function positionWindow() {
      const win = getCurrentWindow();
      const monitor = await currentMonitor();
      if (!monitor) return;

      const scale = monitor.scaleFactor;
      const screenW = monitor.size.width / scale;
      const screenH = monitor.size.height / scale;

      const winSize = await win.outerSize();
      const winW = winSize.width / scale;
      const winH = winSize.height / scale;

      const taskbarHeight = 48;
      const margin = 12;

      const x = (screenW - winW) / 2; // centrado horizontal
      const y = screenH - winH - margin - taskbarHeight;

      await win.setPosition(new LogicalPosition(x, y));
      await win.show();
    }
    positionWindow();
  }, []);

  return (
    <main className="bg-card-foreground/60 h-full w-full p-4">
      
    </main>
  );
}

export default App;
