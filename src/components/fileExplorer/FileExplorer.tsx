
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { FileCode, FolderOpen, File, Image, Music, Plus, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder' | 'image' | 'audio';
  extension?: string;
  children?: FileItem[];
}

const initialFiles: FileItem[] = [
  {
    id: '1',
    name: 'main.lua',
    type: 'file',
    extension: 'lua',
  },
  {
    id: '2',
    name: 'player.lua',
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
];

const FileExplorer = () => {
  const [files, setFiles] = useState<FileItem[]>(initialFiles);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({ '3': true });
  const { toast } = useToast();

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
          return <FileCode className="h-4 w-4 mr-2 text-blue-400" />;
        }
        return <File className="h-4 w-4 mr-2 text-gray-400" />;
    }
  };

  const handleAddFile = () => {
    toast({
      title: "Criar arquivo",
      description: "Funcionalidade de criar arquivo será implementada em breve.",
    });
  };

  const renderFiles = (fileItems: FileItem[], depth = 0) => {
    return fileItems.map((file) => (
      <div key={file.id}>
        <div
          className={`flex items-center py-1 px-2 text-sm rounded hover:bg-secondary cursor-pointer`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => file.type === 'folder' && toggleFolder(file.id)}
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
    </Card>
  );
};

export default FileExplorer;
