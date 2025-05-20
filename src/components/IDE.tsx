
import React, { useState, useRef, useEffect } from 'react';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

import CodeEditor from './editor/CodeEditor';
import ConsoleOutput from './console/ConsoleOutput';
import GamePreview from './preview/GamePreview';
import FileExplorer from './fileExplorer/FileExplorer';
import { Button } from '@/components/ui/button';
import { Settings, Maximize2, Minimize2, Code, Folder } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Project } from '@/services/ProjectService';
import { luaService } from '@/services/LuaService';

interface IDEProps {
  currentProject: Project | null;
  currentCode: string;
  setCurrentCode: (code: string) => void;
  isRunning: boolean;
  runCode: () => void;
  saveProject: () => void;
  consoleMessages: {type: 'info' | 'error' | 'warning', message: string}[];
  onCanvasRef: (ref: HTMLCanvasElement | null) => void;
}

const IDE = ({
  currentProject,
  currentCode,
  setCurrentCode,
  isRunning,
  runCode,
  saveProject,
  consoleMessages,
  onCanvasRef
}: IDEProps) => {
  // Estado para controlar o layout dos painéis
  const [filePanelCollapsed, setFilePanelCollapsed] = useState(false);
  const [consolePanelCollapsed, setConsolePanelCollapsed] = useState(false);
  const [previewPanelCollapsed, setPreviewPanelCollapsed] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Inicializar o Lua runtime
  useEffect(() => {
    if (canvasRef.current) {
      luaService.setCanvas(canvasRef.current);
      onCanvasRef(canvasRef.current);
    }
    
    return () => {
      onCanvasRef(null);
    };
  }, [canvasRef.current, onCanvasRef]);
  
  // Manipuladores para alternar o estado de colapso dos painéis
  const toggleFilePanel = () => {
    setFilePanelCollapsed(!filePanelCollapsed);
    setTimeout(saveLayout, 100);
  };

  const toggleConsolePanel = () => {
    setConsolePanelCollapsed(!consolePanelCollapsed);
    setTimeout(saveLayout, 100);
  };

  const togglePreviewPanel = () => {
    setPreviewPanelCollapsed(!previewPanelCollapsed);
    setTimeout(saveLayout, 100);
  };
  
  // Salvar configurações de layout
  const saveLayout = () => {
    const layout = {
      filePanelCollapsed,
      consolePanelCollapsed,
      previewPanelCollapsed
    };
    localStorage.setItem('doomengine-layout', JSON.stringify(layout));
  };
  
  // Carregar configurações de layout
  React.useEffect(() => {
    const savedLayout = localStorage.getItem('doomengine-layout');
    if (savedLayout) {
      try {
        const layout = JSON.parse(savedLayout);
        setFilePanelCollapsed(layout.filePanelCollapsed);
        setConsolePanelCollapsed(layout.consolePanelCollapsed);
        setPreviewPanelCollapsed(layout.previewPanelCollapsed);
      } catch (e) {
        console.error("Erro ao carregar layout:", e);
      }
    }
  }, []);

  // Função para lidar com a seleção de arquivo
  const handleFileSelect = (content: string) => {
    setCurrentCode(content);
  };

  // Função para formatar logs do console
  const formattedLogs = consoleMessages.map((msg, idx) => ({
    id: idx,
    type: msg.type,
    message: msg.message,
    timestamp: new Date()
  }));

  return (
    <div className="h-[calc(100vh-56px)] w-full">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel 
          defaultSize={20} 
          minSize={filePanelCollapsed ? 0 : 15} 
          maxSize={filePanelCollapsed ? 0 : 30}
          collapsible={true}
          collapsedSize={0}
          className="transition-all duration-300"
        >
          <div className="h-full flex flex-col">
            <div className="bg-muted/20 border-b flex items-center justify-between py-1 px-2">
              <span className="text-xs font-medium">Arquivos</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6" 
                      onClick={toggleFilePanel}
                    >
                      {filePanelCollapsed ? <Folder className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{filePanelCollapsed ? 'Expandir' : 'Minimizar'}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex-1 overflow-hidden">
              <FileExplorer 
                currentProject={currentProject} 
                onFileSelect={handleFileSelect} 
              />
            </div>
          </div>
        </ResizablePanel>

        {!filePanelCollapsed && <ResizableHandle withHandle />}

        <ResizablePanel defaultSize={45} minSize={30} className="transition-all duration-300">
          <ResizablePanelGroup direction="vertical">
            <ResizablePanel 
              defaultSize={consolePanelCollapsed ? 100 : 70} 
              minSize={30}
              className="transition-all duration-300"
            >
              <div className="h-full flex flex-col">
                <div className="bg-muted/20 border-b flex items-center justify-between py-1 px-2">
                  <span className="text-xs font-medium">Código</span>
                  <div className="flex items-center gap-1">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <Settings className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Configurações do editor</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
                <div className="flex-1 overflow-hidden">
                  <CodeEditor 
                    code={currentCode}
                    onCodeChange={setCurrentCode}
                  />
                </div>
              </div>
            </ResizablePanel>

            {!consolePanelCollapsed && <ResizableHandle withHandle />}

            {!consolePanelCollapsed && (
              <ResizablePanel 
                defaultSize={30} 
                minSize={0} 
                collapsible={true}
                className="transition-all duration-300"
              >
                <div className="h-full flex flex-col">
                  <div className="bg-muted/20 border-b flex items-center justify-between py-1 px-2">
                    <span className="text-xs font-medium">Console</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6" 
                            onClick={toggleConsolePanel}
                          >
                            <Minimize2 className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Minimizar</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <ConsoleOutput logs={formattedLogs} />
                  </div>
                </div>
              </ResizablePanel>
            )}
            
            {consolePanelCollapsed && (
              <div className="h-8 border-t flex items-center justify-center">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 text-xs" 
                  onClick={toggleConsolePanel}
                >
                  Mostrar console <Code className="ml-1 h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </ResizablePanelGroup>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel 
          defaultSize={35} 
          minSize={previewPanelCollapsed ? 0 : 30} 
          maxSize={previewPanelCollapsed ? 0 : 50}
          collapsible={true}
          collapsedSize={0}
          className="transition-all duration-300"
        >
          <div className="h-full flex flex-col">
            <div className="bg-muted/20 border-b flex items-center justify-between py-1 px-2">
              <span className="text-xs font-medium">Visualização do jogo</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6" 
                      onClick={togglePreviewPanel}
                    >
                      {previewPanelCollapsed ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{previewPanelCollapsed ? 'Expandir' : 'Minimizar'}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex-1 overflow-hidden">
              <GamePreview 
                onCanvasRef={ref => {
                  canvasRef.current = ref;
                  onCanvasRef(ref);
                }} 
                isRunning={isRunning}
                onRefresh={runCode}
              />
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default IDE;
