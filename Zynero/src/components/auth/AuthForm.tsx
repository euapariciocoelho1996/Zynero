import React, { useState } from 'react';
import './AuthForm.css'; // O CSS permanece o mesmo

// --- Importações do Firebase ---
import { auth } from './firebaseConfig'; // Importa a instância 'auth'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  type User // Importação do tipo User
} from 'firebase/auth';
import { FirebaseError } from 'firebase/app'; // Para tratar erros

// --- Ícones SVG (Sem alterações) ---
const IconLock = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
  </svg>
);
const IconMail = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
    <polyline points="22,6 12,13 2,6"></polyline>
  </svg>
);
const IconShield = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="auth-header-icon">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
  </svg>
);
// --- Fim dos Ícones ---

type AuthMode = 'login' | 'signup' | 'recover';

interface AuthFormProps {
  onAuthSuccess?: (user: User) => void; // Callback agora envia o objeto User do Firebase
}

export const AuthForm: React.FC<AuthFormProps> = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null); // Para feedback de sucesso
  const [loading, setLoading] = useState(false);

  // --- Handlers ---

  const handleModeChange = (newMode: AuthMode) => {
    setMode(newMode);
    setError(null);
    setInfoMessage(null); // Limpa mensagens ao trocar de modo
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  // --- Tratamento de Erros do Firebase ---
  const handleFirebaseError = (apiError: any) => {
    let message = "Ocorreu um erro. Tente novamente.";
    if (apiError instanceof FirebaseError) {
      switch (apiError.code) {
        case 'auth/user-not-found':
          message = "Nenhum usuário encontrado com este e-mail.";
          break;
        case 'auth/wrong-password':
          message = "Senha incorreta. Tente novamente.";
          break;
        case 'auth/email-already-in-use':
          message = "Este e-mail já está em uso por outra conta.";
          break;
        case 'auth/weak-password':
          message = "Senha muito fraca. Use pelo menos 6 caracteres.";
          break;
        case 'auth/invalid-email':
          message = "O formato do e-mail é inválido.";
          break;
        case 'auth/too-many-requests':
            message = "Muitas tentativas. Tente novamente mais tarde.";
            break;
        default:
          message = apiError.message;
      }
    }
    setError(message);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfoMessage(null);

    // --- Lógica de Validação ---
    if (mode === 'signup' && password !== confirmPassword) {
      setError('As senhas não conferem.');
      setLoading(false);
      return;
    }
    
    if (!email) {
      setError('O e-mail é obrigatório.');
      setLoading(false);
      return;
    }

    // --- Lógica de Ação com Firebase ---
    try {
      if (mode === 'login') {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log('Login com sucesso:', userCredential.user);
        onAuthSuccess?.(userCredential.user);

      } else if (mode === 'signup') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        console.log('Cadastro com sucesso:', userCredential.user);
        // Após o cadastro, já logamos o usuário
        onAuthSuccess?.(userCredential.user);

      } else if (mode === 'recover') {
        await sendPasswordResetEmail(auth, email);
        console.log('E-mail de recuperação enviado.');
        setInfoMessage('E-mail de recuperação enviado! Verifique sua caixa de entrada.');
      }
    } catch (apiError: any) {
      handleFirebaseError(apiError);
    } finally {
      setLoading(false);
    }
  };

  // --- Funções de Renderização (Sem alterações) ---

  const renderTitle = () => {
    switch (mode) {
      case 'signup':
        return 'Criar Conta Segura';
      case 'recover':
        return 'Recuperar Acesso';
      case 'login':
      default:
        return 'Acessar seu Cofre';
    }
  };

  const renderSubmitButtonText = () => {
    if (loading) return 'Processando...';
    switch (mode) {
      case 'signup':
        return 'Criar Conta';
      case 'recover':
        return 'Enviar Link';
      case 'login':
      default:
        return 'Entrar';
    }
  };

  return (
    <div className="zynero-auth-wrapper">
      <div className="zynero-auth-container">
        
        <div className="auth-header">
          <IconShield />
          <h2>Zynero</h2>
          <p>Seu aliado na vida digital.</p>
        </div>

        <h3 className="auth-title">{renderTitle()}</h3>

        <form onSubmit={handleSubmit} className="auth-form">
          {/* --- Mensagens de Feedback --- */}
          {error && <div className="auth-error">{error}</div>}
          {infoMessage && <div className="auth-info">{infoMessage}</div>}

          {/* Campo de E-mail (Comum a todos os modos) */}
          <div className="input-group">
            <IconMail />
            <input
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          {/* Campo de Senha (Login e Cadastro) */}
          {mode !== 'recover' && (
            <div className="input-group">
              <IconLock />
              <input
                type="password"
                placeholder="Sua senha mestre"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          )}

          {/* Campo de Confirmação de Senha (Apenas Cadastro) */}
          {mode === 'signup' && (
            <div className="input-group">
              <IconLock />
              <input
                type="password"
                placeholder="Confirme sua senha mestre"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          )}

          <button type="submit" className="auth-button" disabled={loading}>
            {renderSubmitButtonText()}
          </button>
        </form>

        <div className="auth-links">
          {mode === 'login' && (
            <>
              <button onClick={() => handleModeChange('recover')} className="link-button">
                Esqueceu a senha?
              </button>
              <button onClick={() => handleModeChange('signup')} className="link-button">
                Não tem conta? <strong>Crie uma agora.</strong>
              </button>
            </>
          )}

          {mode === 'signup' && (
            <button onClick={() => handleModeChange('login')} className="link-button">
              Já tem uma conta? <strong>Faça o login.</strong>
            </button>
          )}

          {mode === 'recover' && (
            <button onClick={() => handleModeChange('login')} className="link-button">
              Lembrou a senha? <strong>Voltar ao login.</strong>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};