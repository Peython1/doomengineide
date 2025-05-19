
import React, { useState, useRef } from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { 
  Play, 
  Bug, 
  Save, 
  Share, 
  GitBranch,
  FileCode,
  Plus,
  FolderOpen,
  Download,
  AlertOctagon
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import UserProfileButton from '../auth/UserProfileButton';
import { supabase } from '@/integrations/supabase/client';
import { projectService, Project } from '@/services/ProjectService';
import { githubService } from '@/services/GitHubService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface HeaderProps {
  currentProject?: Project | null;
  currentCode?: string;
  runCode?: () => void;
  saveProject?: () => void;
  createNewProject?: () => void;
  loadProject?: (project: Project) => void;
  isRunning?: boolean;
  isAuthenticated?: boolean;
}

const Header = ({
  currentProject, 
  currentCode = '', 
  runCode, 
  saveProject, 
  createNewProject,
  loadProject,
  isRunning = false,
  isAuthenticated = false
}: HeaderProps) => {
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [showProjects, setShowProjects] = useState(false);
  const [showCommitDialog, setShowCommitDialog] = useState(false);
  const [commitMessage, setCommitMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [gitHubError, setGitHubError] = useState('');
  
  // Referência para o input do nome do arquivo HTML
  const fileNameRef = useRef<HTMLInputElement>(null);

  const handleRun = () => {
    if (runCode) {
      runCode();
    } else {
      setIsRunning(true);
      toast({
        title: "Executando aplicação",
        description: "Iniciando execução do código.",
      });
      
      // Simulação de tempo de execução
      setTimeout(() => setIsRunning(false), 1500);
    }
  };

  const handleDebug = () => {
    toast({
      title: "Modo de depuração",
      description: "Iniciando modo de depuração.",
    });
  };

  const handleSave = async () => {
    if (saveProject) {
      saveProject();
    } else {
      toast({
        title: "Projeto salvo",
        description: "Seu projeto foi salvo com sucesso.",
      });
    }
  };

  const handleShare = () => {
    toast({
      title: "Compartilhar projeto",
      description: "Funcionalidade de compartilhamento será implementada em breve.",
    });
  };

  const handleNewProject = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Não autenticado",
        description: "Você precisa estar logado para criar um novo projeto.",
        variant: "destructive"
      });
      return;
    }

    if (createNewProject) {
      createNewProject();
    } else {
      toast({
        title: "Novo projeto",
        description: "Criar um novo projeto.",
      });
    }
  };

  const handleOpenProject = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Não autenticado",
        description: "Você precisa estar logado para abrir projetos.",
        variant: "destructive"
      });
      return;
    }

    try {
      const projectsList = await projectService.getUserProjects();
      setProjects(projectsList);
      setShowProjects(true);
    } catch (error) {
      console.error("Erro ao carregar projetos:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar seus projetos.",
        variant: "destructive"
      });
    }
  };

  const handleLoadProject = (project: Project) => {
    if (loadProject) {
      loadProject(project);
    } else {
      toast({
        title: "Projeto carregado",
        description: `Projeto "${project.name}" carregado com sucesso.`,
      });
    }
    setShowProjects(false);
  };

  const handleCommit = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Não autenticado",
        description: "Você precisa estar logado para fazer commits.",
        variant: "destructive"
      });
      return;
    }

    if (!currentProject) {
      toast({
        title: "Nenhum projeto",
        description: "Você precisa criar ou abrir um projeto primeiro.",
        variant: "destructive"
      });
      return;
    }

    // Verificar se o serviço do GitHub está configurado
    if (!githubService.isConfigured()) {
      setGitHubError('GitHub não configurado. Por favor, configure seu token de acesso e repositório.');
    }

    setShowCommitDialog(true);
  };

  const handleCommitSubmit = async () => {
    if (!commitMessage.trim() || !currentProject || !currentCode) {
      toast({
        title: "Dados incompletos",
        description: "Por favor, insira uma mensagem de commit e verifique se o projeto está salvo.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
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
        setShowCommitDialog(false);
        setCommitMessage('');
      } else {
        toast({
          title: "Erro",
          description: result.message || "Não foi possível enviar seu código para o GitHub.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Erro ao enviar commit:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao tentar fazer o commit.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
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
    <title>Jogo DoomEngine</title>
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
  };

  return (
    <header className="border-b bg-card h-14 flex items-center px-4 justify-between">
      <div className="flex items-center gap-2">
        <SidebarTrigger />
        <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          DoomEngine IDLE
        </h1>
      </div>
      <div className="flex items-center gap-2">
        <Button 
          size="sm" 
          variant="outline"
          onClick={handleNewProject}
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo
        </Button>
        <Button 
          size="sm" 
          variant="outline"
          onClick={handleOpenProject}
        >
          <FolderOpen className="w-4 h-4 mr-2" />
          Abrir
        </Button>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={handleSave}
        >
          <Save className="w-4 h-4 mr-2" />
          Salvar
        </Button>
        <Button 
          size="sm" 
          variant={isRunning ? "secondary" : "outline"} 
          onClick={handleRun}
          disabled={isRunning}
          className="transition-all"
        >
          <Play className="w-4 h-4 mr-2" />
          {isRunning ? "Executando..." : "Executar"}
        </Button>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={handleDebug}
        >
          <Bug className="w-4 h-4 mr-2" />
          Depurar
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline">
              <GitBranch className="w-4 h-4 mr-2" />
              Git
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-card border-border">
            <DropdownMenuItem className="cursor-pointer" onClick={handleCommit}>
              <FileCode className="w-4 h-4 mr-2" />
              Commit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer">
              <GitBranch className="w-4 h-4 mr-2" />
              Branches
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={handleExport}
        >
          <Download className="w-4 h-4 mr-2" />
          Exportar
        </Button>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={handleShare}
        >
          <Share className="w-4 h-4 mr-2" />
          Compartilhar
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <UserProfileButton />
      </div>

      {/* Dialog para listar projetos */}
      <Dialog open={showProjects} onOpenChange={setShowProjects}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Abrir Projeto</DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto py-4">
            {projects.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                Nenhum projeto encontrado.
              </div>
            ) : (
              <div className="space-y-2">
                {projects.map((project) => (
                  <div 
                    key={project.id} 
                    className="p-3 border rounded-md hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => handleLoadProject(project)}
                  >
                    <p className="font-medium">{project.name}</p>
                    {project.description && (
                      <p className="text-sm text-muted-foreground">{project.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Atualizado: {new Date(project.updated_at || '').toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para commit */}
      <Dialog open={showCommitDialog} onOpenChange={setShowCommitDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Commit para GitHub</DialogTitle>
          </DialogHeader>
          {gitHubError && (
            <Alert variant="destructive" className="mb-4">
              <AlertOctagon className="h-4 w-4" />
              <AlertDescription>{gitHubError}</AlertDescription>
            </Alert>
          )}
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="commitMessage">Mensagem de commit</Label>
              <Textarea
                id="commitMessage"
                placeholder="Descreva as alterações feitas no código..."
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowCommitDialog(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleCommitSubmit}
              disabled={isLoading || !!gitHubError}
            >
              {isLoading ? "Enviando..." : "Enviar commit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
};

export default Header;
