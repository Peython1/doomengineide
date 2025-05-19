
import { supabase } from '@/integrations/supabase/client';

interface GitCommitOptions {
  message: string;
  files: { path: string; content: string }[];
  branch?: string;
}

export class GitHubService {
  private userId: string | null = null;
  private token: string | null = null;
  private repoOwner: string | null = null;
  private repoName: string | null = null;
  
  constructor() {
    // Inicializar o ID do usuário a partir da sessão
    this.initUserSession();
  }
  
  private async initUserSession() {
    const { data } = await supabase.auth.getSession();
    this.userId = data.session?.user?.id || null;
    
    // Tentativa de obter token do GitHub das metas do usuário
    if (data.session?.user?.user_metadata?.github_token) {
      this.token = data.session.user.user_metadata.github_token;
    }
    
    // Configurações do repositório (em produção, obtenha do banco de dados ou configurações)
    this.repoOwner = 'user'; // Substitua pelo nome de usuário/organização do GitHub
    this.repoName = 'doomengine-project'; // Substitua pelo nome do repositório
  }
  
  /**
   * Verifica se o serviço está configurado com credenciais válidas
   */
  public isConfigured(): boolean {
    return !!(this.userId && this.token && this.repoOwner && this.repoName);
  }
  
  /**
   * Configura o repositório GitHub atual
   */
  public setRepository(owner: string, name: string): void {
    this.repoOwner = owner;
    this.repoName = name;
  }
  
  /**
   * Commit de alterações para o repositório
   */
  public async commitChanges(options: GitCommitOptions): Promise<{success: boolean, message?: string}> {
    if (!this.isConfigured()) {
      return { success: false, message: "GitHub não configurado. Configure seu token e repositório." };
    }
    
    try {
      const { message, files, branch = 'main' } = options;
      
      // Para cada arquivo no commit
      for (const file of files) {
        // Primeira etapa: obtenha o conteúdo atual e o SHA (se existir)
        const fileInfoResponse = await fetch(
          `https://api.github.com/repos/${this.repoOwner}/${this.repoName}/contents/${file.path}?ref=${branch}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `token ${this.token}`,
              'Content-Type': 'application/json',
            },
          }
        );
        
        let sha = '';
        if (fileInfoResponse.status === 200) {
          const fileInfo = await fileInfoResponse.json();
          sha = fileInfo.sha;
        } else if (fileInfoResponse.status !== 404) {
          console.error('Error fetching file info:', await fileInfoResponse.text());
          return { success: false, message: `Erro ao obter informações do arquivo: ${fileInfoResponse.status}` };
        }
        
        // Segunda etapa: crie ou atualize o arquivo
        const content = btoa(unescape(encodeURIComponent(file.content))); // Codifica em Base64
        
        const payload: any = {
          message,
          content,
          branch,
        };
        
        // Se o arquivo já existia, inclua o SHA
        if (sha) {
          payload.sha = sha;
        }
        
        const response = await fetch(
          `https://api.github.com/repos/${this.repoOwner}/${this.repoName}/contents/${file.path}`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `token ${this.token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          }
        );
        
        if (!response.ok) {
          console.error('Error committing file:', await response.text());
          return { success: false, message: `Erro ao fazer commit: ${response.status}` };
        }
      }
      
      return { success: true, message: `Commit realizado com sucesso: ${message}` };
      
    } catch (error) {
      console.error("Error committing changes:", error);
      return { success: false, message: `Erro ao fazer commit: ${error}` };
    }
  }
  
  /**
   * Obtém branches disponíveis
   */
  public async getBranches(): Promise<string[]> {
    if (!this.isConfigured()) {
      return [];
    }
    
    try {
      const response = await fetch(
        `https://api.github.com/repos/${this.repoOwner}/${this.repoName}/branches`,
        {
          headers: {
            'Authorization': `token ${this.token}`,
          },
        }
      );
      
      if (!response.ok) {
        console.error('Error fetching branches:', await response.text());
        return [];
      }
      
      const branches = await response.json();
      return branches.map((branch: any) => branch.name);
      
    } catch (error) {
      console.error("Error getting branches:", error);
      return [];
    }
  }
  
  /**
   * Cria um novo branch
   */
  public async createBranch(branchName: string, baseBranch = 'main'): Promise<boolean> {
    if (!this.isConfigured()) {
      return false;
    }
    
    try {
      // 1. Obtenha o SHA do commit mais recente na branch base
      const refResponse = await fetch(
        `https://api.github.com/repos/${this.repoOwner}/${this.repoName}/git/refs/heads/${baseBranch}`,
        {
          headers: {
            'Authorization': `token ${this.token}`,
          },
        }
      );
      
      if (!refResponse.ok) {
        console.error('Error fetching base branch:', await refResponse.text());
        return false;
      }
      
      const refData = await refResponse.json();
      const sha = refData.object.sha;
      
      // 2. Crie a nova branch com base no SHA
      const createResponse = await fetch(
        `https://api.github.com/repos/${this.repoOwner}/${this.repoName}/git/refs`,
        {
          method: 'POST',
          headers: {
            'Authorization': `token ${this.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ref: `refs/heads/${branchName}`,
            sha,
          }),
        }
      );
      
      if (!createResponse.ok) {
        console.error('Error creating branch:', await createResponse.text());
        return false;
      }
      
      return true;
      
    } catch (error) {
      console.error("Error creating branch:", error);
      return false;
    }
  }

  /**
   * Configura o token de acesso do GitHub
   */
  public setToken(token: string): void {
    this.token = token;
  }
}

export const githubService = new GitHubService();
