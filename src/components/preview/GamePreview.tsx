
import React, { useRef, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Maximize2, RefreshCw } from 'lucide-react';

const GamePreview = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  
  // Simulação simples de renderização de um jogo Lua
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const player = {
      x: 100,
      y: 100,
      dx: 100, // velocidade em pixels por segundo
      dy: 80,
      radius: 20
    };
    
    const render = (time: number) => {
      // Atualizar posição do jogador
      const now = time / 1000;
      player.x += Math.sin(now) * player.dx * 0.016;
      player.y += Math.cos(now * 0.7) * player.dy * 0.016;
      
      // Manter o jogador dentro do canvas
      if (player.x < player.radius) player.x = player.radius;
      if (player.x > canvas.width - player.radius) player.x = canvas.width - player.radius;
      if (player.y < player.radius) player.y = player.radius;
      if (player.y > canvas.height - player.radius) player.y = canvas.height - player.radius;
      
      // Limpar canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Desenhar grid de fundo
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
      
      // Desenhar jogador
      ctx.fillStyle = 'rgba(74, 105, 189, 1)';
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
      ctx.fill();
      
      // Desenhar texto
      ctx.fillStyle = 'yellow';
      ctx.font = '12px monospace';
      ctx.fillText(`Posição: ${Math.round(player.x)}, ${Math.round(player.y)}`, 10, 20);

      // Continuar animação
      animationRef.current = requestAnimationFrame(render);
    };
    
    animationRef.current = requestAnimationFrame(render);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const handleRefresh = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    animationRef.current = requestAnimationFrame((time) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const render = (time: number) => {
        // Atualização reiniciada
        // ... mesmo código de renderização ...
        animationRef.current = requestAnimationFrame(render);
      };
      
      animationRef.current = requestAnimationFrame(render);
    });
  };

  const handleFullScreen = () => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.requestFullscreen) return;
    
    canvas.requestFullscreen().catch(err => {
      console.error(`Erro ao entrar em tela cheia: ${err.message}`);
    });
  };

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
            title="Recarregar"
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
