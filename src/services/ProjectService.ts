
import { supabase } from '@/integrations/supabase/client';

export interface Project {
  id?: string;
  user_id?: string;
  name: string;
  description?: string;
  content: Record<string, string>; // arquivo principal e arquivo suporte: { "main.lua": "código aqui" }
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

  /**
   * Cria um projeto padrão para novos usuários
   */
  async createDefaultProject(): Promise<Project | null> {
    const defaultCode = `--[[ DoomEngine - Exemplo ]]

-- Configuração inicial
function love.load()
  player = {
    x = 400,
    y = 300,
    speed = 200,
    img = nil
  }
end

-- Atualização lógica do jogo
function love.update(dt)
  -- Controles de movimento
  if love.keyboard.isDown("right") then
    player.x = player.x + player.speed * dt
  end
  
  if love.keyboard.isDown("left") then
    player.x = player.x - player.speed * dt
  end
  
  if love.keyboard.isDown("down") then
    player.y = player.y + player.speed * dt
  end
  
  if love.keyboard.isDown("up") then
    player.y = player.y - player.speed * dt
  end
end

-- Renderização do jogo
function love.draw()
  love.graphics.setColor(1, 1, 1)
  
  -- Desenhar o jogador
  love.graphics.circle("fill", player.x, player.y, 20)
  
  -- Informações de debug
  love.graphics.setColor(1, 1, 0)
  love.graphics.print("Posição: " .. player.x .. ", " .. player.y, 10, 10)
end`;

    return this.createProject({
      name: "Meu Primeiro Jogo",
      description: "Um projeto de exemplo criado automaticamente",
      content: {
        "main.lua": defaultCode
      }
    });
  }
}

export const projectService = new ProjectService();
