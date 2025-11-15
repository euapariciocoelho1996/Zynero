import { useState, useMemo, useEffect } from "react";
import { Trash } from "lucide-react";
import { Pencil } from "lucide-react";
import Swal from "sweetalert2";
import "./PasswordManager.css";
import {
  collection,
  addDoc,
  doc,
  deleteDoc,
  updateDoc,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../auth/firebaseConfig";
import { auth } from "../auth/firebaseConfig";
import { onAuthStateChanged, type User } from "firebase/auth";
import CryptoJS from "crypto-js"; // 1. IMPORTAÇÃO DA BIBLIOTECA DE CRIPTOGRAFIA

// 20 ícones para o usuário escolher
const iconOptions = [
  "🔒", "🔑", "📱", "💻", "🌐", "📧", "💾", "🏦", "🎮", "📷",
  "📚", "🚀", "🎧", "🛒", "⚙️", "🧩", "💬", "🎯", "🧪", "🛡️",
];

const categories = [
  "Redes Sociais", "Banco", "Aplicativo", "Email", "Trabalho", "Outros",
];

interface PasswordItem {
  id: string;
  icon: string;
  category: string;
  name: string;
  password: string; // Isto agora será o texto CRIPTOGRAFADO
}

export const PasswordManager = () => {
  const [user, setUser] = useState<User | null>(null);
  const [masterKey, setMasterKey] = useState<string | null>(null); // 2. ESTADO DA SENHA MESTRA
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState(iconOptions[0]);
  const [formData, setFormData] = useState({
    category: categories[0],
    name: "",
    password: "", // Isto será a senha em texto puro, apenas no formulário
  });

  const [savedItems, setSavedItems] = useState<PasswordItem[]>([]);
  const [filterCategory, setFilterCategory] = useState("Todas");
  const [search, setSearch] = useState("");
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(
    new Set()
  );
  const [editingItem, setEditingItem] = useState<PasswordItem | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // 3. FUNÇÕES DE CRIPTOGRAFIA
  const encryptPassword = (text: string, key: string): string => {
    return CryptoJS.AES.encrypt(text, key).toString();
  };

  const decryptPassword = (ciphertext: string, key: string): string => {
    try {
      const bytes = CryptoJS.AES.decrypt(ciphertext, key);
      const originalText = bytes.toString(CryptoJS.enc.Utf8);
      if (!originalText) {
        // Isso acontece se a chave estiver errada
        throw new Error("Chave mestra inválida ou dados corrompidos.");
      }
      return originalText;
    } catch (error) {
      console.error("Erro ao descriptografar:", error);
      // Retorna um placeholder em caso de falha (ex: chave errada)
      return "****** (Chave Inválida)"; 
    }
  };


  // Observa mudanças na autenticação
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (!currentUser) {
        setMasterKey(null); // Limpa a chave mestra ao deslogar
      }
    });
    return () => unsubscribe();
  }, []);

  // Carrega dados do Firestore quando o usuário estiver autenticado
  useEffect(() => {
    if (!user) {
      setSavedItems([]);
      setLoading(false);
      return;
    }

    // Não carrega os dados se a chave mestra não estiver definida
    // Apenas escuta quando o cofre for destrancado.
    if (!masterKey) {
       setLoading(false);
       setSavedItems([]); // Limpa itens se o cofre for trancado
       return;
    }

    setLoading(true);
    const passwordsRef = collection(db, "passwords");
    const q = query(passwordsRef, where("userId", "==", user.uid));

    console.log("🔍 Iniciando listener do Firestore para userId:", user.uid);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log("📦 Snapshot recebido:", snapshot.size, "documentos");
        const items: PasswordItem[] = [];

        if (snapshot.empty) {
          console.log("⚠️ Nenhum documento encontrado na coleção passwords");
        }

        snapshot.forEach((docSnapshot) => {
          const data = docSnapshot.data();
          console.log("📄 Documento encontrado:", docSnapshot.id);
          items.push({
            id: docSnapshot.id,
            icon: data.icon || "🔒",
            category: data.category || "",
            name: data.name || "",
            password: data.password || "", // Salva o texto criptografado
          });
        });

        console.log("✅ Total de itens carregados:", items.length);
        setSavedItems(items);
        setLoading(false);
      },
      (error) => {
        console.error("❌ Erro ao carregar senhas:", error);
        setLoading(false);
        Swal.fire({
          title: "Erro ao carregar!",
          text: `Não foi possível carregar suas senhas. ${error.message}`,
          icon: "error",
          confirmButtonText: "Ok",
        });
      }
    );

    return () => {
      console.log("🧹 Limpando listener do Firestore");
      unsubscribe();
    };
  }, [user, masterKey]); // RE-EXECUTA QUANDO A CHAVE MESTRA MUDAR

  const filteredCategories = useMemo(() => {
    const unique = ["Todas", ...new Set(savedItems.map((i) => i.category))];
    return unique;
  }, [savedItems]);

  const filteredList = useMemo(() => {
    return savedItems.filter((item) => {
      const matchesCategory =
        filterCategory === "Todas" || item.category === filterCategory;

      const matchesSearch = item.name
        .toLowerCase()
        .includes(search.toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [savedItems, filterCategory, search]);

  // Paginação
  const totalPages = Math.ceil(filteredList.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedList = filteredList.slice(startIndex, endIndex);

  // Reset página quando filtros mudarem
  useEffect(() => {
    setCurrentPage(1);
  }, [filterCategory, search]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!user) {
      Swal.fire("Erro!", "Você precisa estar autenticado.", "error");
      return;
    }
    
    // 4. VERIFICAÇÃO DA CHAVE MESTRA (SALVAR)
    if (!masterKey) {
      Swal.fire("Cofre Trancado!", "Destranque seu cofre para salvar.", "warning");
      return;
    }

    try {
      const passwordsRef = collection(db, "passwords");
      const newDocData = {
        userId: user.uid,
        icon: selectedIcon,
        category: formData.category,
        name: formData.name,
        // 5. CRIPTOGRAFA A SENHA ANTES DE SALVAR
        password: encryptPassword(formData.password, masterKey),
        createdAt: new Date(),
      };

      console.log("💾 Salvando documento criptografado no Firestore...");
      const docRef = await addDoc(passwordsRef, newDocData);
      console.log("✅ Documento salvo com ID:", docRef.id);

      Swal.fire("Salvo!", "Os dados foram salvos com sucesso.", "success");

      setFormData({ category: categories[0], name: "", password: "" });
      setSelectedIcon(iconOptions[0]);
      setShowForm(false);
    } catch (error: any) {
      console.error("❌ Erro ao salvar senha:", error);
      // ... (seu tratamento de erro)
      Swal.fire("Erro!", "Não foi possível salvar os dados.", "error");
    }
  };

  const togglePasswordVisibility = (itemId: string) => {
    // 6. VERIFICAÇÃO DA CHAVE MESTRA (VISUALIZAR)
    if (!masterKey) {
        Swal.fire("Cofre Trancado!", "Destranque seu cofre para ver as senhas.", "warning");
        return;
    }
    setVisiblePasswords((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const handleEdit = (item: PasswordItem) => {
    // 7. VERIFICAÇÃO DA CHAVE MESTRA (EDITAR)
    if (!masterKey) {
        Swal.fire("Cofre Trancado!", "Destranque seu cofre para editar.", "warning");
        return;
    }

    setEditingItem(item);
    setFormData({
      category: item.category,
      name: item.name,
      // 8. DESCRIPTOGRAFA A SENHA PARA MOSTRAR NO FORMULÁRIO
      password: decryptPassword(item.password, masterKey),
    });
    setSelectedIcon(item.icon);
    setShowForm(true);
    // Scroll para o formulário
    setTimeout(() => {
      document
        .querySelector(".password-form")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!user || !editingItem) return;

    // 9. VERIFICAÇÃO DA CHAVE MESTRA (ATUALIZAR)
    if (!masterKey) {
        Swal.fire("Cofre Trancado!", "Destranque seu cofre para atualizar.", "warning");
        return;
    }

    try {
      const docRef = doc(db, "passwords", editingItem.id);
      await updateDoc(docRef, {
        icon: selectedIcon,
        category: formData.category,
        name: formData.name,
        // 10. CRIPTOGRAFA A SENHA NOVAMENTE ANTES DE ATUALIZAR
        password: encryptPassword(formData.password, masterKey),
        updatedAt: new Date(),
      });

      Swal.fire("Atualizado!", "Os dados foram atualizados com sucesso.", "success");

      setFormData({ category: categories[0], name: "", password: "" });
      setSelectedIcon(iconOptions[0]);
      setEditingItem(null);
      setShowForm(false);
    } catch (error: any) {
      console.error("Erro ao atualizar senha:", error);
      Swal.fire("Erro!", "Não foi possível atualizar os dados.", "error");
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!user) return;
    
    // Você não precisa da chave mestra para deletar, 
    // pois o ID do documento é o suficiente.
    
    const result = await Swal.fire({
      title: "Tem certeza?",
      text: "Esta ação não pode ser desfeita!",
      icon: "warning",
      // ... (seu código de confirmação)
      showCancelButton: true,
      confirmButtonColor: "#00bfa5",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sim, deletar!",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      try {
        await deleteDoc(doc(db, "passwords", itemId));
        Swal.fire("Deletado!", "A senha foi removida com sucesso.", "success");
      } catch (error) {
        console.error("Erro ao deletar senha:", error);
        Swal.fire("Erro!", "Não foi possível deletar a senha.", "error");
      }
    }
  };

  if (loading && !masterKey) { // Ajuste no loading inicial
    return (
      <div className="password-manager">
        <p>Carregando...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="password-manager">
        <p>Você precisa estar autenticado para gerenciar senhas.</p>
      </div>
    );
  }
  
  // 11. TELA DE "COFRE TRANCADO"
  if (!masterKey) {
    const handleUnlock = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const password = (e.currentTarget.elements.namedItem("masterpass") as HTMLInputElement).value;
      if (password) {
        // Apenas definimos a chave. 
        // A validação real acontecerá na primeira tentativa de
        // descriptografar algo, ou no 'useEffect' que busca os dados.
        setMasterKey(password);
        setLoading(true); // Ativa o loading para buscar os itens
      }
    };

    return (
      <div className="password-manager vault-locked">
        <h2>🔒 Cofre Trancado</h2>
        <p>Digite sua senha mestra para descriptografar suas senhas.</p>
        <p style={{fontSize: '0.8rem', opacity: 0.7}}>(Esta senha NUNCA é salva, apenas usada localmente)</p>
        <form onSubmit={handleUnlock} className="vault-form">
          <label htmlFor="masterpass">Senha Mestra</label>
          <input type="password" id="masterpass" name="masterpass" required autoFocus />
          <button type="submit" className="save-btn">
            Destrancar
          </button>
        </form>
         {/* Adicione um CSS para .vault-locked e .vault-form no seu .css */}
      </div>
    );
  }
  
  // 12. RENDERIZAÇÃO PRINCIPAL (APENAS SE O COFRE ESTIVER DESTRANCADO)
  return (
    <div className="password-manager">
      <button className="lock-btn" onClick={() => setMasterKey(null)}>
        Trancar Cofre
      </button>

      <button className="add-btn" onClick={() => setShowForm(!showForm)}>
        <span>+</span>
      </button>

      {/* Formulário */}
      {showForm && (
        <form
          className="password-form"
          onSubmit={editingItem ? handleUpdate : handleSubmit}
        >
          {/* ... (Seu formulário não muda, pois formData.password já está em texto puro) ... */}
           {editingItem && (
             <div className="edit-mode-banner">
               {/* ... (código do banner de edição) ... */}
             </div>
           )}
           <label>Categoria</label>
           <select
             value={formData.category}
             onChange={(e) =>
               setFormData({ ...formData, category: e.target.value })
             }
           >
             {categories.map((c) => (
               <option key={c}>{c}</option>
             ))}
           </select>
           <label>Nome</label>
           <input
             type="text"
             value={formData.name}
             onChange={(e) => setFormData({ ...formData, name: e.target.value })}
             placeholder="Ex: Instagram"
             required
           />
           <label>Senha</label>
           <input
             type="password"
             value={formData.password}
             onChange={(e) =>
               setFormData({ ...formData, password: e.target.value })
             }
             required
           />
           <label>Ícone</label>
           <div className="icon-grid">
             {iconOptions.map((icon) => (
               <button
                 key={icon}
                 type="button"
                 className={`icon-option ${
                   selectedIcon === icon ? "active" : ""
                 }`}
                 onClick={() => setSelectedIcon(icon)}
               >
                 {icon}
               </button>
             ))}
           </div>
           <button className="save-btn" type="submit">
             {editingItem ? "Atualizar" : "Salvar"}
           </button>
        </form>
      )}

      {/* Filtros */}
      {savedItems.length > 0 && (
        <div className="filters-container">
            {/* ... (Seu JSX de filtros não muda) ... */}
            <div className="filters-header">
             <h3>Filtros e Busca</h3>
             <span className="results-count">
               {filteredList.length}{" "}
               {filteredList.length === 1 ? "resultado" : "resultados"}
             </span>
           </div>
           <div className="filters">
             <div className="filter-group">
               <label>Categoria</label>
               <select
                 value={filterCategory}
                 onChange={(e) => setFilterCategory(e.target.value)}
                 className="filter-category"
               >
                 {filteredCategories.map((c) => (
                   <option key={c}>{c}</option>
                 ))}
               </select>
             </div>
             <div className="filter-group">
               <label>Buscar</label>
               <input
                 type="text"
                 placeholder="Digite o nome..."
                 value={search}
                 onChange={(e) => setSearch(e.target.value)}
                 className="filter-search"
               />
             </div>
           </div>
        </div>
      )}

      {/* Lista */}
      <div className="saved-list">
        {loading ? (
             <p>Carregando suas senhas criptografadas...</p>
        ) : filteredList.length === 0 ? (
          <div className="empty-state">
            <p>
              Nenhuma senha salva ainda. Clique no botão + para adicionar uma
              nova senha.
            </p>
            {/* ... */}
          </div>
        ) : (
          <>
            {paginatedList.map((item) => (
              <div key={item.id} className="saved-item">
                <div className="item-main">
                  <span className="item-icon">{item.icon}</span>
                  <div className="item-info">
                    <strong className="item-name">{item.name}</strong>
                    <span className="item-category">{item.category}</span>
                    <div className="item-password">
                      <span className="password-value">
                        {/* 13. DESCRIPTOGRAFA APENAS PARA EXIBIÇÃO */}
                        {visiblePasswords.has(item.id)
                          ? decryptPassword(item.password, masterKey)
                          : "••••••••••••"}
                      </span>
                      <button
                        className="toggle-password-btn"
                        onClick={() => togglePasswordVisibility(item.id)}
                        title={
                          visiblePasswords.has(item.id)
                            ? "Ocultar senha"
                            : "Mostrar senha"
                        }
                      >
                        {visiblePasswords.has(item.id) ? "👁️" : "👁️‍🗨️"}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="item-actions">
                  <button
                    className="action-btn edit-btn"
                    onClick={() => handleEdit(item)}
                    title="Editar senha"
                  >
                    <Pencil className="icon-icon" />
                  </button>
                  <button
                    className="action-btn delete-btn"
                    onClick={() => handleDelete(item.id)}
                    title="Deletar senha"
                  >
                    <Trash className="icon-icon" />
                  </button>
                </div>
              </div>
            ))}

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="pagination">
                {/* ... (Seu JSX de paginação não muda) ... */}
                <button
                   className="pagination-btn"
                   onClick={() =>
                     setCurrentPage((prev) => Math.max(1, prev - 1))
                   }
                   disabled={currentPage === 1}
                 >
                   ← Anterior
                 </button>
                 <span className="pagination-info">
                   Página {currentPage} de {totalPages}
                 </span>
                 <button
                   className="pagination-btn"
                   onClick={() =>
                     setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                   }
                   disabled={currentPage === totalPages}
                 >
                   Próxima →
                 </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};