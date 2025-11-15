import { useState, useEffect } from "react";

// --- Importações de Componentes ---
import { AuthForm } from "./components/auth/AuthForm";
import { DashboardLayout } from "./components/dashboard/DashboardLayout";
import { PasswordManager } from "./components/password/PasswordManager";

// --- Importações do Firebase ---
import { auth } from "./components/auth/firebaseConfig";
import { type User, onAuthStateChanged, signOut } from "firebase/auth";

// --- Importações de Estilos ---
import "./App.css";

function App() {
  // --- Estados ---
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // --- Efeitos ---
  useEffect(() => {
    // Observa mudanças no estado de autenticação
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingAuth(false);
    });

    // Cleanup: remove o listener quando o componente desmonta
    return () => {
      unsubscribe();
    };
  }, []);

  // --- Handlers ---
  const handleLogout = async () => {
    try {
      await signOut(auth);
      console.log("Usuário deslogado com sucesso.");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  const handleAuthSuccess = (loggedInUser: User) => {
    console.log("Login/Cadastro bem-sucedido!", loggedInUser.email);
    // O estado do usuário será atualizado automaticamente pelo onAuthStateChanged
  };

  // --- Renderização Condicional ---

  // 1. Tela de Carregamento
  if (loadingAuth) {
    return (
      <div className="app-loader">
        <h2>Carregando Zynero...</h2>
      </div>
    );
  }

  // 2. Tela de Login/Cadastro (usuário não autenticado)
  if (!user) {
    return <AuthForm onAuthSuccess={handleAuthSuccess} />;
  }

  // 3. Tela Principal (usuário autenticado)
  return (
    <DashboardLayout user={user} onLogout={handleLogout}>
      {/* Coloque aqui o conteúdo que deve aparecer "dentro" do layout */}
      <PasswordManager />
      {/* <OutroComponente /> */}
    </DashboardLayout>
  );
}

export default App;
