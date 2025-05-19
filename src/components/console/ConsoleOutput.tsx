
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash, ChevronUp, ChevronDown } from 'lucide-react';

interface LogEntry {
  id: number;
  type: 'info' | 'error' | 'warning';
  message: string;
  timestamp: Date;
}

const ConsoleOutput = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);

  // Adicionar logs de exemplo
  useEffect(() => {
    const exampleLogs: LogEntry[] = [
      {
        id: 1,
        type: 'info',
        message: 'Aplicação inicializada',
        timestamp: new Date(),
      },
      {
        id: 2,
        type: 'info',
        message: 'Carregando recursos...',
        timestamp: new Date(),
      },
      {
        id: 3,
        type: 'error',
        message: 'Erro ao carregar imagem: player.png não encontrado',
        timestamp: new Date(),
      },
      {
        id: 4,
        type: 'warning',
        message: 'Usando fallback para recurso ausente',
        timestamp: new Date(),
      },
      {
        id: 5,
        type: 'info',
        message: 'Jogo inicializado com sucesso',
        timestamp: new Date(),
      },
    ];
    setLogs(exampleLogs);
  }, []);

  const clearLogs = () => {
    setLogs([]);
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const getLogColor = (type: 'info' | 'error' | 'warning') => {
    switch (type) {
      case 'info':
        return 'text-blue-400';
      case 'error':
        return 'text-red-400';
      case 'warning':
        return 'text-yellow-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <Card className="border-0 shadow-none h-full flex flex-col">
      <CardHeader className="py-2 px-4 border-b flex flex-row items-center">
        <CardTitle className="text-sm font-medium flex-1">Console</CardTitle>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={clearLogs}
            title="Limpar console"
          >
            <Trash className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={toggleExpand}
            title={isExpanded ? "Minimizar" : "Expandir"}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="p-0 flex-1 overflow-auto">
          <div className="bg-editor-bg text-editor-foreground p-2 font-mono text-xs h-full overflow-auto">
            {logs.map((log) => (
              <div key={log.id} className="py-1 border-b border-editor-line">
                <span className={`${getLogColor(log.type)} mr-2`}>
                  [{log.type.toUpperCase()}]
                </span>
                <span className="text-gray-400 mr-2">
                  {log.timestamp.toLocaleTimeString()}:
                </span>
                <span>{log.message}</span>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default ConsoleOutput;
