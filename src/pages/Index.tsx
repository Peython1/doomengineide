
import React, { useState, useEffect, useRef } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import IDE from '@/components/IDE';
import { Project, projectService } from '@/services/ProjectService';
import { supabase } from '@/integrations/supabase/client';
import { luaService } from '@/services/LuaService';
import { githubService } from '@/services/GitHubService';
import Header from '@/components/layout/Header';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [currentCode, setCurrentCode] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [consoleMessages, setConsoleMessages] = useState<{type: 'info' | 'error' | 'warning', message: string}[]>([]);
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

  // Carregar o último projeto do usuário
  const loadLastProject = async () => {
    try {
      setIsLoading(true);
      const projects = await projectService.getUserProjects();
      
      if (projects.length > 0) {
        // Carregar o projeto mais recente
        setCurrentProject(projects[0]);
        if (projects[0].content && projects[0].content['main.lua']) {
          setCurrentCode(projects[0].content['main.lua']);
        }
        
        addConsoleMessage('info', `Projeto "${projects[0].name}" carregado`);
      } else {
        // Criar um projeto padrão se não existir nenhum
        await createNewProject();
      }
    } catch (error) {
      console.error("Erro ao carregar último projeto:", error);
      addConsoleMessage('error', `Erro ao carregar último projeto: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Executar o código Lua
  const runCode = async () => {
    if (!currentCode.trim()) {
      toast({
        title: "Nenhum código para executar",
        description: "O editor de código está vazio.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsRunning(true);
      addConsoleMessage('info', 'Executando código...');

      // Utiliza o serviço Lua para executar o código
      if (canvasRef.current) {
        luaService.setCanvas(canvasRef.current);
      }
      
      const result = luaService.executeCode(currentCode);
      
      if (result.success) {
        addConsoleMessage('info', 'Código executado com sucesso');
      } else {
        addConsoleMessage('error', 'Erro ao executar código');
      }
      
      // Adicionar mensagens de saída ao console
      result.output.forEach(message => {
        addConsoleMessage('info', message);
      });
      
    } catch (error) {
      console.error("Erro ao executar código:", error);
      addConsoleMessage('error', `Erro ao executar código: ${error}`);
    } finally {
      setTimeout(() => setIsRunning(false), 300); // Pequeno delay para feedback visual
    }
  };

  // Adicionar mensagem ao console
  const addConsoleMessage = (type: 'info' | 'error' | 'warning', message: string) => {
    setConsoleMessages(prev => [...prev, { type, message }]);
  };

  // Salvar o projeto atual
  const saveProject = async () => {
    if (!user) {
      toast({
        title: "Não autenticado",
        description: "Você precisa estar logado para salvar projetos.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      
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
          throw new Error('Falha ao salvar projeto');
        }
      }
      // Se não existe, cria um novo
      else {
        await createNewProject();
      }
    } catch (error) {
      console.error("Erro ao salvar projeto:", error);
      toast({
        title: "Erro",
        description: "Falha ao salvar projeto.",
        variant: "destructive",
      });
      addConsoleMessage('error', `Erro ao salvar projeto: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Criar um novo projeto
  const createNewProject = async () => {
    if (!user) {
      toast({
        title: "Não autenticado",
        description: "Você precisa estar logado para criar projetos.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
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
        throw new Error('Falha ao criar novo projeto');
      }
    } catch (error) {
      console.error("Erro ao criar novo projeto:", error);
      toast({
        title: "Erro",
        description: "Falha ao criar novo projeto.",
        variant: "destructive",
      });
      addConsoleMessage('error', `Erro ao criar novo projeto: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Carregar um projeto específico
  const loadProject = async (project: Project) => {
    try {
      setIsLoading(true);
      setCurrentProject(project);
      
      if (project.content && project.content['main.lua']) {
        setCurrentCode(project.content['main.lua']);
      } else {
        setCurrentCode('');
      }
      
      addConsoleMessage('info', `Projeto "${project.name}" carregado`);
      toast({
        title: "Projeto carregado",
        description: `Projeto "${project.name}" carregado com sucesso.`,
      });
    } catch (error) {
      console.error("Erro ao carregar projeto:", error);
      toast({
        title: "Erro",
        description: "Falha ao carregar projeto.",
        variant: "destructive",
      });
      addConsoleMessage('error', `Erro ao carregar projeto: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Enviar código para o GitHub (commit)
  const commitToGitHub = async (commitMessage: string) => {
    if (!user) {
      toast({
        title: "Não autenticado",
        description: "Você precisa estar logado para fazer commits.",
        variant: "destructive"
      });
      return false;
    }

    if (!currentProject) {
      toast({
        title: "Nenhum projeto",
        description: "Você precisa criar ou abrir um projeto primeiro.",
        variant: "destructive"
      });
      return false;
    }

    try {
      setIsLoading(true);
      const result = await githubService.commitChanges({
        message: commitMessage,
        files: [
          { path: 'main.lua', content: currentCode }
        ]
      });

      if (result.success) {
        toast({
          title: "Commit enviado",
          description: result.message || "Seu código foi enviado com sucesso para o GitHub.",
        });
        addConsoleMessage('info', `Commit realizado: ${commitMessage}`);
        return true;
      } else {
        throw new Error(result.message || "Erro ao fazer commit");
      }
    } catch (error) {
      console.error("Erro ao enviar commit:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao tentar fazer o commit.",
        variant: "destructive"
      });
      addConsoleMessage('error', `Erro ao fazer commit: ${error}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Exportar jogo como HTML
  const exportGame = () => {
    if (!currentCode) {
      toast({
        title: "Nenhum código",
        description: "Não há código para exportar.",
        variant: "destructive"
      });
      return;
    }

    // HTML base para o jogo exportado
    const htmlTemplate = `
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${currentProject?.name || 'Jogo DoomEngine'}</title>
    <script src="https://cdn.jsdelivr.net/npm/fengari-web@0.1.4/dist/fengari-web.min.js"></script>
    <style>
        body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; height: 100vh; background: #111; }
        canvas { background: #000; max-width: 100%; max-height: 100vh; }
    </style>
</head>
<body>
    <canvas id="gameCanvas" width="800" height="600"></canvas>
    <script type="text/javascript">
        // Setup Lua environment
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');
        
        // Basic LOVE-like API
        const love = {
            graphics: {
                setColor: function(r, g, b, a = 1) {
                    ctx.fillStyle = \`rgba(\${r*255},\${g*255},\${b*255},\${a})\`;
                    ctx.strokeStyle = \`rgba(\${r*255},\${g*255},\${b*255},\${a})\`;
                },
                print: function(text, x, y) {
                    ctx.fillText(text, x, y);
                },
                circle: function(mode, x, y, radius) {
                    ctx.beginPath();
                    ctx.arc(x, y, radius, 0, Math.PI * 2);
                    if (mode === "fill") {
                        ctx.fill();
                    } else {
                        ctx.stroke();
                    }
                },
                rectangle: function(mode, x, y, width, height) {
                    if (mode === "fill") {
                        ctx.fillRect(x, y, width, height);
                    } else {
                        ctx.strokeRect(x, y, width, height);
                    }
                },
                clear: function() {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                }
            },
            keyboard: {
                isDown: function(key) {
                    return keysDown[key] || false;
                }
            }
        };

        // Keyboard handling
        const keysDown = {};
        window.addEventListener('keydown', function(e) {
            keysDown[e.key.toLowerCase()] = true;
        });
        window.addEventListener('keyup', function(e) {
            keysDown[e.key.toLowerCase()] = false;
        });

        // Register LÖVE API to Lua
        fengari.lua.lua_pushliteral(fengari.L, "love");
        fengari.lua.lua_newtable(fengari.L);
        
        // Set up graphics table
        fengari.lua.lua_pushliteral(fengari.L, "graphics");
        fengari.lua.lua_newtable(fengari.L);
        
        for (const [name, func] of Object.entries(love.graphics)) {
            fengari.lua.lua_pushliteral(fengari.L, name);
            fengari.lua.lua_pushjs(fengari.L, func);
            fengari.lua.lua_settable(fengari.L, -3);
        }
        
        fengari.lua.lua_settable(fengari.L, -3);
        
        // Set up keyboard table
        fengari.lua.lua_pushliteral(fengari.L, "keyboard");
        fengari.lua.lua_newtable(fengari.L);
        
        for (const [name, func] of Object.entries(love.keyboard)) {
            fengari.lua.lua_pushliteral(fengari.L, name);
            fengari.lua.lua_pushjs(fengari.L, func);
            fengari.lua.lua_settable(fengari.L, -3);
        }
        
        fengari.lua.lua_settable(fengari.L, -3);
        
        // Set love as global
        fengari.lua.lua_setglobal(fengari.L, "love");

        // Run the Lua code
        const luaCode = \`${currentCode.replace(/`/g, "\\`")}\`;
        fengari.load(luaCode)();
        
        // Game loop
        let lastTime = 0;
        
        function gameLoop(timestamp) {
            // Calculate delta time
            const deltaTime = (timestamp - lastTime) / 1000;
            lastTime = timestamp;
            
            // Call love.update if it exists
            if (typeof love.update === 'function') {
                love.update(deltaTime);
            }
            
            // Call love.draw if it exists
            if (typeof love.draw === 'function') {
                love.draw();
            }
            
            requestAnimationFrame(gameLoop);
        }
        
        // Start the game loop
        requestAnimationFrame(gameLoop);
    </script>
</body>
</html>
    `;

    // Criar um blob e gerar URL para download
    const blob = new Blob([htmlTemplate], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    // Nome do arquivo (usar nome do projeto ou padrão)
    const fileName = currentProject ? `${currentProject.name.replace(/\s+/g, '_')}.html` : 'jogo_doomengine.html';
    
    // Criar elemento de link e acionar o download
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    // Liberar a URL do objeto
    setTimeout(() => URL.revokeObjectURL(url), 100);
    
    toast({
      title: "Jogo exportado",
      description: `O arquivo ${fileName} foi baixado com sucesso.`,
    });
    
    addConsoleMessage('info', `Jogo exportado como ${fileName}`);
  };

  // Debug mode - implementação simplificada
  const debugCode = () => {
    if (!currentCode.trim()) {
      toast({
        title: "Nenhum código para depurar",
        description: "O editor de código está vazio.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Modo de depuração",
      description: "Iniciando modo de depuração.",
    });
    
    addConsoleMessage('info', 'Iniciando depuração...');
    addConsoleMessage('info', 'Verificando sintaxe Lua...');
    
    try {
      // Executa o código em modo de depuração
      if (canvasRef.current) {
        luaService.setCanvas(canvasRef.current);
      }
      
      // Simples verificação de sintaxe
      const result = luaService.executeCode(currentCode);
      
      if (result.success) {
        addConsoleMessage('info', 'Sintaxe verificada com sucesso');
        // Adicionar mais informações de depuração aqui
        let lines = currentCode.split('\n').length;
        addConsoleMessage('info', `Total de linhas: ${lines}`);
        
        // Verificar funções definidas (análise simplificada)
        const functionMatches = currentCode.match(/function\s+([a-zA-Z0-9_\.]+)\(/g) || [];
        addConsoleMessage('info', `Funções definidas: ${functionMatches.length}`);
        
        functionMatches.forEach(match => {
          const functionName = match.replace('function', '').replace('(', '').trim();
          addConsoleMessage('info', `Função encontrada: ${functionName}`);
        });
      } else {
        addConsoleMessage('error', 'Erro de sintaxe encontrado');
        result.output.forEach(error => {
          addConsoleMessage('error', error);
        });
      }
    } catch (error) {
      console.error("Erro na depuração:", error);
      addConsoleMessage('error', `Erro na depuração: ${error}`);
    }
  };

  // Passar propriedades para o Header personalizado
  const customHeader = (
    <Header 
      currentProject={currentProject}
      currentCode={currentCode}
      isRunning={isRunning}
      isAuthenticated={!!user}
      runCode={runCode}
      saveProject={saveProject}
      createNewProject={createNewProject}
      loadProject={loadProject}
      debugCode={debugCode}
      exportGame={exportGame}
      commitToGitHub={commitToGitHub}
    />
  );

  return (
    <MainLayout
      header={customHeader}
    >
      <IDE 
        currentProject={currentProject}
        currentCode={currentCode}
        setCurrentCode={setCurrentCode}
        isRunning={isRunning}
        runCode={runCode}
        saveProject={saveProject}
        consoleMessages={consoleMessages}
        onCanvasRef={(ref) => canvasRef.current = ref}
      />
    </MainLayout>
  );
};

export default Index;
