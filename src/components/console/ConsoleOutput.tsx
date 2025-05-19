
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash, ChevronUp, ChevronDown } from 'lucide-react';

export interface LogEntry {
  id: number;
  type: 'info' | 'error' | 'warning';
  message: string;
  timestamp: Date;
}

interface ConsoleOutputProps {
  logs?: LogEntry[];
}

const ConsoleOutput = ({ logs = [] }: ConsoleOutputProps) => {
  const [localLogs, setLocalLogs] = useState<LogEntry[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);
  
  const logsContainerRef = useRef<HTMLDivElement>(null);
  
  // Sincronizar logs externos com logs locais
  useEffect(() => {
    if (logs && logs.length > 0) {
      setLocalLogs(logs);
    }
  }, [logs]);
  
  // Scroll automático quando novos logs são adicionados
  useEffect(() => {
    if (autoScroll && logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [localLogs, autoScroll]);

  const clearLogs = () => {
    setLocalLogs([]);
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
          <div 
            className="bg-editor-bg text-editor-foreground p-2 font-mono text-xs h-full overflow-auto"
            ref={logsContainerRef}
          >
            {localLogs.length === 0 ? (
              <div className="py-2 text-gray-400 italic text-center">
                O console está vazio. Execute o código para ver os resultados aqui.
              </div>
            ) : (
              localLogs.map((log) => (
                <div key={log.id} className="py-1 border-b border-editor-line">
                  <span className={`${getLogColor(log.type)} mr-2`}>
                    [{log.type.toUpperCase()}]
                  </span>
                  <span className="text-gray-400 mr-2">
                    {log.timestamp.toLocaleTimeString()}:
                  </span>
                  <span>{log.message}</span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default ConsoleOutput;
