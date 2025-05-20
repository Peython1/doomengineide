
import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import IDE from '@/components/IDE';
import { Project, projectService } from '@/services/ProjectService';
import { supabase } from '@/integrations/supabase/client';
import { luaService } from '@/services/LuaService';
import Header from '@/components/layout/Header';

const Index = () => {
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [currentCode, setCurrentCode] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);
  const [user, setUser] = useState<any>(null);

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
    };
    
    checkAuth();
  }, []);

  const runCode = async () => {
    setIsRunning(true);
    // Esta função será passada ao componente IDE
    setTimeout(() => setIsRunning(false), 1000);
  };

  const saveProject = async () => {
    // Esta função será passada ao componente IDE
  };

  const createNewProject = async () => {
    // Esta função será passada ao componente IDE
  };

  const loadProject = async (project: Project) => {
    // Esta função será passada ao componente IDE
    setCurrentProject(project);
  };

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
    />
  );

  return (
    <MainLayout
      header={customHeader}
    >
      <IDE />
    </MainLayout>
  );
};

export default Index;
