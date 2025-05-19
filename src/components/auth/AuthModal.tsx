
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthModal = ({ isOpen, onClose }: AuthModalProps) => {
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        
        if (error) throw error;
        
        toast({
          title: "Login bem-sucedido",
          description: "Bem-vindo de volta ao DoomEngine IDLE!",
        });
        onClose();
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        
        if (error) throw error;
        
        toast({
          title: "Conta criada com sucesso",
          description: "Verifique seu email para confirmar o cadastro.",
        });
        onClose();
      }
    } catch (error) {
      toast({
        title: "Erro de autenticação",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isLogin ? 'Entrar no DoomEngine IDLE' : 'Criar nova conta'}</DialogTitle>
          <DialogDescription>
            {isLogin 
              ? 'Entre com sua conta para salvar e sincronizar seus projetos.' 
              : 'Crie uma conta para começar a usar todos os recursos do DoomEngine IDLE.'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              placeholder="seu.email@exemplo.com" 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input 
              id="password" 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required
              placeholder="********"
            />
          </div>
          
          <div className="flex flex-col gap-4 pt-2">
            <Button type="submit" disabled={loading}>
              {loading ? 'Processando...' : isLogin ? 'Entrar' : 'Criar conta'}
            </Button>
            
            <Button 
              type="button" 
              variant="link" 
              onClick={() => setIsLogin(!isLogin)}
              className="mx-auto"
            >
              {isLogin ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Entre'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
