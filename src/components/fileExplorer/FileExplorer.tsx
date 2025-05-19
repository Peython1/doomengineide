
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { FileCode, FolderOpen, File, Image, Music, Plus, Trash, FileCog } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Project } from '@/services/ProjectService';

interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder' | 'image' | 'audio';
  extension?: string;
  content?: string;
  children?: FileItem[];
}

interface FileExplorerProps {
  currentProject?: Project | null;
  onFileSelect?: (content: string) => void;
}

const FileExplorer = ({ currentProject, onFileSelect }: FileExplorerProps) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({ '3': true });
  const [showNewFileDialog, setShowNewFileDialog] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [fileType, setFileType] = useState<'file' | 'folder'>('file');
  const { toast } = useToast();

  // Atualizar os arquivos quando o projeto mudar
  useEffect(() => {
    if (currentProject) {
      generateFilesFromProject(currentProject);
    } else {
      setDefaultFiles();
    }
  }, [currentProject]);
  
  // Gerar lista de arquivos a partir do projeto atual
  const generateFilesFromProject = (project: Project) => {
    const projectFiles: FileItem[] = [];
    
    // Arquivo principal
    if (project.content && project.content['main.lua']) {
      projectFiles.push({
        id: 'main',
        name: 'main.lua',
        type: 'file',
        extension: 'lua',
        content: project.content['main.lua']
      });
    }
    
    // Outros arquivos
    const otherFiles: FileItem[] = [];
    
    for (const [fileName, content] of Object.entries(project.content || {})) {
      if (fileName !== 'main.lua') {
        const extension = fileName.split('.').pop() || '';
        let type: 'file' | 'image' | 'audio' = 'file';
        
        if (['png', 'jpg', 'jpeg', 'gif'].includes(extension)) {
          type = 'image';
        } else if (['mp3', 'wav', 'ogg'].includes(extension)) {
          type = 'audio';
        }
        
        otherFiles.push({
          id: fileName,
          name: fileName,
          type,
          extension,
          content: typeof content === 'string' ? content : JSON.stringify(content)
        });
      }
    }
    
    // Adicionar pasta de configuração se existir
    if (otherFiles.length > 0) {
      projectFiles.push({
        id: 'src',
        name: 'src',
        type: 'folder',
        children: otherFiles
      });
      setExpandedFolders(prev => ({ ...prev, 'src': true }));
    }
    
    // Adicionar arquivo de configuração
    projectFiles.push({
      id: 'conf',
      name: 'conf.lua',
      type: 'file',
      extension: 'lua',
      content: `function love.conf(t)
  t.title = "${project.name || 'Jogo DoomEngine'}"
  t.version = "0.1.0"
  t.window.width = 800
  t.window.height = 600
end`
    });
    
    setFiles(projectFiles);
  };

  // Configurar arquivos padrão quando não há projeto
  const setDefaultFiles = () => {
    setFiles([
      {
        id: '1',
        name: 'main.lua',
        type: 'file',
        extension: 'lua',
      },
      {
        id: '3',
        name: 'assets',
        type: 'folder',
        children: [
          {
            id: '4',
            name: 'player.png',
            type: 'image',
            extension: 'png',
          },
          {
            id: '5',
            name: 'background.png',
            type: 'image',
            extension: 'png',
          },
          {
            id: '6',
            name: 'music.mp3',
            type: 'audio',
            extension: 'mp3',
          },
        ],
      },
      {
        id: '7',
        name: 'conf.lua',
        type: 'file',
        extension: 'lua',
      },
    ]);
  };

  const toggleFolder = (id: string) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const getFileIcon = (file: FileItem) => {
    switch (file.type) {
      case 'folder':
        return expandedFolders[file.id] ? (
          <FolderOpen className="h-4 w-4 mr-2 text-yellow-400" />
        ) : (
          <FolderOpen className="h-4 w-4 mr-2 text-yellow-400" />
        );
      case 'image':
        return <Image className="h-4 w-4 mr-2 text-green-400" />;
      case 'audio':
        return <Music className="h-4 w-4 mr-2 text-purple-400" />;
      case 'file':
      default:
        if (file.extension === 'lua') {
          return file.name === 'conf.lua' ? 
            <FileCog className="h-4 w-4 mr-2 text-orange-400" /> :
            <FileCode className="h-4 w-4 mr-2 text-blue-400" />;
        }
        return <File className="h-4 w-4 mr-2 text-gray-400" />;
    }
  };

  const handleFileClick = (file: FileItem) => {
    if (file.type === 'folder') {
      toggleFolder(file.id);
    } else if (file.content && onFileSelect) {
      onFileSelect(file.content);
    } else {
      toast({
        title: "Arquivo não suportado",
        description: `O arquivo ${file.name} não pode ser aberto no editor.`,
      });
    }
  };

  const handleAddFile = () => {
    setShowNewFileDialog(true);
  };

  const handleCreateFile = () => {
    if (!newFileName) {
      toast({
        title: "Nome inválido",
        description: "Por favor, insira um nome para o arquivo.",
        variant: "destructive",
      });
      return;
    }
    
    // Adicionar extensão .lua se for um arquivo Lua sem extensão
    let fileName = newFileName;
    if (fileType === 'file' && !fileName.includes('.')) {
      fileName = `${fileName}.lua`;
    }
    
    // Criar o novo item
    const newItem: FileItem = {
      id: `new-${Date.now()}`,
      name: fileName,
      type: fileType,
    };
    
    if (fileType === 'file') {
      const extension = fileName.split('.').pop() || '';
      newItem.extension = extension;
      
      if (extension === 'lua') {
        newItem.content = `-- ${fileName}\n-- Criado em ${new Date().toLocaleDateString()}\n\n`;
      } else {
        newItem.content = '';
      }
    } else {
      newItem.children = [];
    }
    
    setFiles([...files, newItem]);
    setShowNewFileDialog(false);
    setNewFileName('');
    
    toast({
      title: `${fileType === 'file' ? 'Arquivo' : 'Pasta'} criado`,
      description: `${fileType === 'file' ? 'Arquivo' : 'Pasta'} "${fileName}" criado com sucesso.`,
    });
  };

  const renderFiles = (fileItems: FileItem[], depth = 0) => {
    return fileItems.map((file) => (
      <div key={file.id}>
        <div
          className={`flex items-center py-1 px-2 text-sm rounded hover:bg-secondary cursor-pointer`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => handleFileClick(file)}
        >
          {getFileIcon(file)}
          <span>{file.name}</span>
        </div>
        {file.type === 'folder' && expandedFolders[file.id] && file.children && (
          <div>{renderFiles(file.children, depth + 1)}</div>
        )}
      </div>
    ));
  };

  return (
    <Card className="border-0 shadow-none h-full flex flex-col">
      <CardHeader className="py-2 px-4 border-b flex flex-row items-center">
        <CardTitle className="text-sm font-medium flex-1">Arquivos</CardTitle>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleAddFile}
            title="Novo arquivo"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-auto">
        <div className="p-2">{renderFiles(files)}</div>
      </CardContent>

      {/* Dialog para criar novo arquivo/pasta */}
      <Dialog open={showNewFileDialog} onOpenChange={setShowNewFileDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Criar novo {fileType === 'file' ? 'arquivo' : 'pasta'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="fileType">Tipo</Label>
              <div className="flex gap-2">
                <Button
                  variant={fileType === 'file' ? 'default' : 'outline'}
                  onClick={() => setFileType('file')}
                  className="flex-1"
                >
                  <FileCode className="h-4 w-4 mr-2" />
                  Arquivo
                </Button>
                <Button
                  variant={fileType === 'folder' ? 'default' : 'outline'}
                  onClick={() => setFileType('folder')}
                  className="flex-1"
                >
                  <FolderOpen className="h-4 w-4 mr-2" />
                  Pasta
                </Button>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="fileName">Nome</Label>
              <Input
                id="fileName"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                placeholder={fileType === 'file' ? "exemplo.lua" : "nova_pasta"}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewFileDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateFile}>
              Criar {fileType === 'file' ? 'arquivo' : 'pasta'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default FileExplorer;
