
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
import { projectService, Project } from '@/services/ProjectService';
import { luaService } from '@/services/LuaService';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const IDE = () => {
  // Estado para controlar o layout dos painéis
  const [filePanelCollapsed, setFilePanelCollapsed] = useState(false);
  const [consolePanelCollapsed, setConsolePanelCollapsed] = useState(false);
  const [previewPanelCollapsed, setPreviewPanelCollapsed] = useState(false);
  
  // Estado do projeto atual
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [currentCode, setCurrentCode] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);
  const [consoleMessages, setConsoleMessages] = useState<{id: number, type: 'info' | 'error' | 'warning', message: string, timestamp: Date}[]>([]);
  const [user, setUser] = useState<any>(null);
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { toast } = useToast();
  
  // Verificar autenticação do usuário
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user || null);
      
      // Escutar mudanças de autenticação
      const { data: authListener } = supabase.auth.onAuthStateChange(
        (event, session) => {
          setUser(session?.user || null);
        }
      );
      
      // Se o usuário estiver autenticado, tentar carregar o último projeto
      if (data.session?.user) {
        loadLastProject();
      }
    };
    
    checkAuth();
  }, []);
  
  // Inicializar o Lua runtime
  useEffect(() => {
    if (canvasRef.current) {
      luaService.setCanvas(canvasRef.current);
    }
  }, []);
  
  // Carregar o último projeto ou criar um projeto padrão
  const loadLastProject = async () => {
    const projects = await projectService.getUserProjects();
    
    if (projects.length > 0) {
      // Carregar o projeto mais recente
      setCurrentProject(projects[0]);
      if (projects[0].content && projects[0].content['main.lua']) {
        setCurrentCode(projects[0].content['main.lua']);
      }
      
      addConsoleMessage('info', `Projeto "${projects[0].name}" carregado`);
    } else {
      // Criar um projeto padrão
      createNewProject();
    }
  };
  
  // Criar um novo projeto
  const createNewProject = async () => {
    const newProject = await projectService.createDefaultProject();
    if (newProject) {
      setCurrentProject(newProject);
      if (newProject.content && newProject.content['main.lua']) {
        setCurrentCode(newProject.content['main.lua']);
      }
      
      addConsoleMessage('info', `Novo projeto "${newProject.name}" criado`);
      toast({
        title: "Projeto criado",
        description: `Novo projeto "${newProject.name}" criado com sucesso.`,
      });
    } else {
      addConsoleMessage('error', 'Falha ao criar novo projeto');
      toast({
        title: "Erro",
        description: "Falha ao criar novo projeto.",
        variant: "destructive",
      });
    }
  };
  
  // Salvar o projeto atual
  const saveProject = async () => {
    if (!user) {
      toast({
        title: "Não autenticado",
        description: "Você precisa estar logado para salvar projetos.",
        variant: "destructive",
      });
      return;
    }
    
    // Se já existe um projeto, atualiza
    if (currentProject?.id) {
      const updatedProject = {
        ...currentProject,
        content: { 
          ...currentProject.content,
          'main.lua': currentCode 
        }
      };
      
      const result = await projectService.updateProject(updatedProject);
      
      if (result) {
        setCurrentProject(result);
        addConsoleMessage('info', `Projeto "${result.name}" salvo`);
        toast({
          title: "Projeto salvo",
          description: `Projeto "${result.name}" salvo com sucesso.`,
        });
      } else {
        addConsoleMessage('error', 'Falha ao salvar projeto');
        toast({
          title: "Erro",
          description: "Falha ao salvar projeto.",
          variant: "destructive",
        });
      }
    }
    // Se não existe, cria um novo
    else {
      createNewProject();
    }
  };
  
  // Executar o código
  const runCode = async () => {
    if (!currentCode.trim()) {
      addConsoleMessage('warning', 'Nenhum código para executar');
      return;
    }
    
    setIsRunning(true);
    addConsoleMessage('info', 'Executando código...');
    
    const result = luaService.executeCode(currentCode);
    
    if (result.success) {
      addConsoleMessage('info', 'Código executado com sucesso');
    } else {
      addConsoleMessage('error', 'Erro ao executar código');
    }
    
    // Adicione as mensagens do Lua ao console
    result.output.forEach(message => {
      addConsoleMessage('info', message);
    });
    
    setIsRunning(false);
  };
  
  // Adicionar mensagem ao console
  const addConsoleMessage = (type: 'info' | 'error' | 'warning', message: string) => {
    setConsoleMessages(prev => [
      ...prev,
      {
        id: Date.now(),
        type,
        message,
        timestamp: new Date()
      }
    ]);
  };
  
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
      const layout = JSON.parse(savedLayout);
      setFilePanelCollapsed(layout.filePanelCollapsed);
      setConsolePanelCollapsed(layout.consolePanelCollapsed);
      setPreviewPanelCollapsed(layout.previewPanelCollapsed);
    }
  }, []);

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
                onFileSelect={(content) => setCurrentCode(content)} 
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
                    <ConsoleOutput logs={consoleMessages} />
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
              <GamePreview onCanvasRef={ref => canvasRef.current = ref} />
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default IDE;
