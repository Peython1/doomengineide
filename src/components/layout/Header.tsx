
import React from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Play, Bug, Save, Share } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Header = () => {
  const { toast } = useToast();

  const handleRun = () => {
    toast({
      title: "Executando aplicação",
      description: "Iniciando execução do código.",
    });
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
          GlyEngine
        </h1>
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" onClick={handleRun}>
          <Play className="w-4 h-4 mr-2" />
          Executar
        </Button>
        <Button size="sm" variant="outline" onClick={handleDebug}>
          <Bug className="w-4 h-4 mr-2" />
          Depurar
        </Button>
        <Button size="sm" variant="outline" onClick={handleSave}>
          <Save className="w-4 h-4 mr-2" />
          Salvar
        </Button>
        <Button size="sm" variant="outline" onClick={handleShare}>
          <Share className="w-4 h-4 mr-2" />
          Compartilhar
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">v1.0.0</span>
      </div>
    </header>
  );
};

export default Header;
