
import { supabase } from '@/integrations/supabase/client';

export interface Project {
  id?: string;
  user_id?: string;
  name: string;
  description?: string;
  content: Record<string, string>; // arquivos do projeto: { "main.lua": "código aqui" }
  created_at?: string;
  updated_at?: string;
}

export class ProjectService {
  /**
   * Cria um novo projeto
   */
  async createProject(project: Project): Promise<Project | null> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return null;
      
      const { data, error } = await supabase
        .from('projects')
        .insert({
          user_id: user.user.id,
          name: project.name,
          description: project.description || '',
          content: project.content
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as Project;
    } catch (error) {
      console.error('Error creating project:', error);
      return null;
    }
  }
  
  /**
   * Atualiza um projeto existente
   */
  async updateProject(project: Project): Promise<Project | null> {
    try {
      if (!project.id) return null;
      
      const { data, error } = await supabase
        .from('projects')
        .update({
          name: project.name,
          description: project.description,
          content: project.content,
          updated_at: new Date().toISOString()
        })
        .eq('id', project.id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Project;
    } catch (error) {
      console.error('Error updating project:', error);
      return null;
    }
  }
  
  /**
   * Obtém todos os projetos do usuário atual
   */
  async getUserProjects(): Promise<Project[]> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return [];
      
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.user.id)
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      return data as Project[];
    } catch (error) {
      console.error('Error fetching projects:', error);
      return [];
    }
  }
  
  /**
   * Obtém um projeto pelo ID
   */
  async getProject(id: string): Promise<Project | null> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Project;
    } catch (error) {
      console.error('Error fetching project:', error);
      return null;
    }
  }
  
  /**
   * Exclui um projeto
   */
  async deleteProject(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting project:', error);
      return false;
    }
  }
}

export const projectService = new ProjectService();
