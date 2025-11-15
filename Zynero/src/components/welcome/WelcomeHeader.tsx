// src/components/welcome/WelcomeHeader.tsx
import './WelcomeHeader.css';

interface WelcomeHeaderProps {
  userName?: string;
}

export const WelcomeHeader = ({ userName }: WelcomeHeaderProps) => {
  return (
    <header className="welcome-header">
      <h2 className="welcome-title">
        Bem-vindo{userName ? `, ${userName}` : ''}!
      </h2>

      <p className="welcome-subtitle">
        Aqui você pode gerenciar suas senhas com segurança e praticidade.
      </p>

      <ul className="welcome-actions">
        <li>• Adicionar novas credenciais</li>
        <li>• Atualizar informações salvas</li>
        <li>• Organizar categorias de acesso</li>
        <li>• Configurar preferências da sua conta</li>
      </ul>
    </header>
  );
};
