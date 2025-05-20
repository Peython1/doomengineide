
import React, { useRef, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Maximize2, RefreshCw, Play } from 'lucide-react';

interface GamePreviewProps {
  onCanvasRef?: (ref: HTMLCanvasElement | null) => void;
  isRunning?: boolean;
  onRefresh?: () => void;
}

const GamePreview = ({ onCanvasRef, isRunning = false, onRefresh }: GamePreviewProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (canvasRef.current && onCanvasRef) {
      onCanvasRef(canvasRef.current);
    }
    
    return () => {
      if (onCanvasRef) {
        onCanvasRef(null);
      }
    };
  }, [onCanvasRef]);

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    } else {
      // Fallback se não houver função de refresh passada como prop
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          // Desenhar um padrão de grade para indicar que foi atualizado
          ctx.strokeStyle = 'rgba(100, 100, 255, 0.1)';
          ctx.lineWidth = 1;
          
          // Linhas verticais
          for (let x = 0; x < canvas.width; x += 50) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
          }
          
          // Linhas horizontais
          for (let y = 0; y < canvas.height; y += 50) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
          }
          
          // Desenhar texto de início
          ctx.fillStyle = 'white';
          ctx.font = '16px monospace';
          ctx.fillText('Clique em "Executar" para iniciar o jogo', canvas.width / 2 - 180, canvas.height / 2);
        }
      }
    }
  };

  const handleFullScreen = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    if (canvas.requestFullscreen) {
      canvas.requestFullscreen().catch(err => {
        console.error(`Erro ao entrar em tela cheia: ${err.message}`);
      });
    } else if ((canvas as any).webkitRequestFullscreen) {
      (canvas as any).webkitRequestFullscreen();
    } else if ((canvas as any).mozRequestFullScreen) {
      (canvas as any).mozRequestFullScreen();
    } else if ((canvas as any).msRequestFullscreen) {
      (canvas as any).msRequestFullscreen();
    }
  };

  // Inicializar o canvas com uma grade básica
  useEffect(() => {
    handleRefresh();
  }, []);

  return (
    <Card className="border-0 shadow-none h-full flex flex-col">
      <CardHeader className="py-2 px-4 border-b flex flex-row items-center">
        <CardTitle className="text-sm font-medium flex-1">Prévia</CardTitle>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleRefresh}
            title="Executar código"
            disabled={isRunning}
          >
            <Play className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleRefresh}
            title="Recarregar"
            disabled={isRunning}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleFullScreen}
            title="Tela cheia"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-hidden bg-black flex items-center justify-center">
        <canvas 
          ref={canvasRef} 
          width={800} 
          height={600}
          className="max-w-full max-h-full"
        ></canvas>
      </CardContent>
    </Card>
  );
};

export default GamePreview;
