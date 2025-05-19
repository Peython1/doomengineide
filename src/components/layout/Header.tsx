
import React, { useState } from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { 
  Play, 
  Bug, 
  Save, 
  Share, 
  GitBranch,
  FileCode
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import UserProfileButton from '../auth/UserProfileButton';

const Header = () => {
  const { toast } = useToast();
  const [isRunning, setIsRunning] = useState(false);

  const handleRun = () => {
    setIsRunning(true);
    toast({
      title: "Executando aplicação",
      description: "Iniciando execução do código.",
    });
    
    // Simulação de tempo de execução
    setTimeout(() => setIsRunning(false), 1500);
  };

  const handleDebug = () => {
    toast({
      title: "Modo de depuração",
      description: "Iniciando modo de depuração.",
    });
  };

  const handleSave = () => {
    toast({
      title: "Projeto salvo",
      description: "Seu projeto foi salvo com sucesso.",
    });
  };

  const handleShare = () => {
    toast({
      title: "Compartilhar projeto",
      description: "Funcionalidade de compartilhamento será implementada em breve.",
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
          variant={isRunning ? "secondary" : "outline"} 
          onClick={handleRun}
          disabled={isRunning}
          className="transition-all"
        >
          <Play className="w-4 h-4 mr-2" />
          {isRunning ? "Executando..." : "Executar"}
        </Button>
        <Button size="sm" variant="outline" onClick={handleDebug}>
          <Bug className="w-4 h-4 mr-2" />
          Depurar
        </Button>
        <Button size="sm" variant="outline" onClick={handleSave}>
          <Save className="w-4 h-4 mr-2" />
          Salvar
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline">
              <GitBranch className="w-4 h-4 mr-2" />
              Git
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-card border-border">
            <DropdownMenuItem className="cursor-pointer">
              <FileCode className="w-4 h-4 mr-2" />
              Commit
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              <GitBranch className="w-4 h-4 mr-2" />
              Branches
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button size="sm" variant="outline" onClick={handleShare}>
          <Share className="w-4 h-4 mr-2" />
          Compartilhar
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <UserProfileButton />
      </div>
    </header>
  );
};

export default Header;
