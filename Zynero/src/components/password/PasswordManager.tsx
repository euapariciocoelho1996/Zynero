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
import CryptoJS from "crypto-js";
import { LockKeyhole } from "lucide-react";

// ... (iconOptions e categories) ...
const iconOptions = [
  "🔒",
  "🔑",
  "📱",
  "💻",
  "🌐",
  "📧",
  "💾",
  "🏦",
  "🎮",
  "📷",
  "📚",
  "🚀",
  "🎧",
  "🛒",
  "⚙️",
  "🧩",
  "💬",
  "🎯",
  "🧪",
  "🛡️",
];

const categories = [
  "Redes Sociais",
  "Banco",
  "Aplicativo",
  "Email",
  "Trabalho",
  "Outros",
];

interface PasswordItem {
  id: string;
  icon: string;
  category: string;
  name: string;
  password: string;
}

export const PasswordManager = () => {
  const [user, setUser] = useState<User | null>(null);
  const [masterKey, setMasterKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState(iconOptions[0]);
  const [formData, setFormData] = useState({
    category: categories[0],
    name: "",
    password: "",
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

  // ... (Funções de Criptografia: encryptPassword, decryptPassword) ...
  const encryptPassword = (text: string, key: string): string => {
    return CryptoJS.AES.encrypt(text, key).toString();
  };

  const decryptPassword = (ciphertext: string, key: string): string => {
    try {
      const bytes = CryptoJS.AES.decrypt(ciphertext, key);
      const originalText = bytes.toString(CryptoJS.enc.Utf8);
      if (!originalText) {
        throw new Error("Chave mestra inválida ou dados corrompidos.");
      }
      return originalText;
    } catch (error) {
      console.error("Erro ao descriptografar:", error);
      return "****** (Chave Inválida)";
    }
  };

  // ... (useEffects de autenticação e carregamento de dados) ...
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (!currentUser) {
        setMasterKey(null);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setSavedItems([]);
      setLoading(false);
      return;
    }
    if (!masterKey) {
      setLoading(false);
      setSavedItems([]);
      return;
    }
    setLoading(true);
    const passwordsRef = collection(db, "passwords");
    const q = query(passwordsRef, where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: PasswordItem[] = [];
        snapshot.forEach((docSnapshot) => {
          const data = docSnapshot.data();
          items.push({
            id: docSnapshot.id,
            icon: data.icon || "🔒",
            category: data.category || "",
            name: data.name || "",
            password: data.password || "",
          });
        });
        setSavedItems(items);
        setLoading(false);
      },
      (error) => {
        console.error("❌ Erro ao carregar senhas:", error);
        setLoading(false);
        Swal.fire(
          "Erro ao carregar!",
          `Não foi possível carregar suas senhas. ${error.message}`,
          "error"
        );
      }
    );
    return () => {
      unsubscribe();
    };
  }, [user, masterKey]);

  // ... (useMemos: filteredCategories, filteredList, paginatedList) ...
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

  const totalPages = Math.ceil(filteredList.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedList = filteredList.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterCategory, search]);

  // ... (handleSubmit, togglePasswordVisibility) ...
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) {
      Swal.fire("Erro!", "Você precisa estar autenticado.", "error");
      return;
    }
    if (!masterKey) {
      Swal.fire(
        "Cofre Trancado!",
        "Destranque seu cofre para salvar.",
        "warning"
      );
      return;
    }
    try {
      const passwordsRef = collection(db, "passwords");
      const newDocData = {
        userId: user.uid,
        icon: selectedIcon,
        category: formData.category,
        name: formData.name,
        password: encryptPassword(formData.password, masterKey),
        createdAt: new Date(),
      };
      await addDoc(passwordsRef, newDocData);
      Swal.fire("Salvo!", "Os dados foram salvos com sucesso.", "success");
      setFormData({ category: categories[0], name: "", password: "" });
      setSelectedIcon(iconOptions[0]);
      setShowForm(false);

      // ✨✨✨ MUDANÇA AQUI ✨✨✨
    } catch (error) {
      console.error("Erro ao salvar senha:", error);
      let message = "Não foi possível salvar os dados.";
      if (error instanceof Error) {
        message = error.message;
      }
      Swal.fire("Erro!", message, "error");
    }
  };

  const togglePasswordVisibility = (itemId: string) => {
    if (!masterKey) {
      Swal.fire(
        "Cofre Trancado!",
        "Destranque seu cofre para ver as senhas.",
        "warning"
      );
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
    if (!masterKey) {
      Swal.fire(
        "Cofre Trancado!",
        "Destranque seu cofre para editar.",
        "warning"
      );
      return;
    }
    setEditingItem(item);
    setFormData({
      category: item.category,
      name: item.name,
      password: decryptPassword(item.password, masterKey),
    });
    setSelectedIcon(item.icon);
    setShowForm(true);
    setTimeout(() => {
      document
        .querySelector(".password-form")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  // ... (handleUpdate, handleDelete) ...
  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !editingItem) return;
    if (!masterKey) {
      Swal.fire(
        "Cofre Trancado!",
        "Destranque seu cofre para atualizar.",
        "warning"
      );
      return;
    }
    try {
      const docRef = doc(db, "passwords", editingItem.id);
      await updateDoc(docRef, {
        icon: selectedIcon,
        category: formData.category,
        name: formData.name,
        password: encryptPassword(formData.password, masterKey),
        updatedAt: new Date(),
      });
      Swal.fire(
        "Atualizado!",
        "Os dados foram atualizados com sucesso.",
        "success"
      );
      setFormData({ category: categories[0], name: "", password: "" });
      setSelectedIcon(iconOptions[0]);
      setEditingItem(null);
      setShowForm(false);

      // ✨✨✨ MUDANÇA AQUI ✨✨✨
    } catch (error) {
      console.error("Erro ao atualizar senha:", error);
      let message = "Não foi possível atualizar os dados.";
      if (error instanceof Error) {
        message = error.message;
      }
      Swal.fire("Erro!", message, "error");
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!user) return;
    const result = await Swal.fire({
      title: "Tem certeza?",
      text: "Esta ação não pode ser desfeita!",
      icon: "warning",
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
        let message = "Não foi possível deletar a senha.";
        if (error instanceof Error) {
          message = error.message;
        }
        Swal.fire("Erro!", message, "error");
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setFormData({ category: categories[0], name: "", password: "" });
    setSelectedIcon(iconOptions[0]);
    setShowForm(false);
  };

  // ... (Telas de Loading, Não Autenticado e Cofre Trancado) ...
  if (loading && !masterKey) {
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

  if (!masterKey) {
    const handleUnlock = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const password = (
        e.currentTarget.elements.namedItem("masterpass") as HTMLInputElement
      ).value;
      if (password) {
        setMasterKey(password);
        setLoading(true);
      }
    };
    return (
      <div className="password-manager vault-locked">
        <h2 style={{ color: "#9a9ea9" }}>
          <LockKeyhole /> Cofre Trancado
        </h2>
        <p>Digite sua senha mestra para descriptografar suas senhas.</p>
        <p style={{ fontSize: "0.8rem", opacity: 0.7, color: "#00a087" }}>
          (Esta senha NUNCA é salva, apenas usada localmente)
        </p>
        <form onSubmit={handleUnlock} className="vault-form">
          <label htmlFor="masterpass" style={{ color: "#9a9ea9" }}>
            Senha Mestra
          </label>
          <input
            type="password"
            id="masterpass"
            name="masterpass"
            required
            autoFocus
            placeholder="********"
          />
          <button type="submit" className="save-btn">
            Destrancar
          </button>
        </form>
      </div>
    );
  }

  // ====================================================================
  // RENDERIZAÇÃO PRINCIPAL
  // ====================================================================
  return (
    <div className="password-manager">
      <button className="lock-btn" onClick={() => setMasterKey(null)}>
        Trancar Cofre
      </button>

      <button
        className="add-btn"
        onClick={() => {
          if (showForm) {
            handleCancelEdit();
          } else {
            setShowForm(true);
            setTimeout(() => {
              document
                .querySelector(".password-form")
                ?.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 100);
          }
        }}
      >
        <span>+</span>
      </button>

      {/* Formulário */}
      {showForm && (
        <form
          className="password-form"
          onSubmit={editingItem ? handleUpdate : handleSubmit}
        >
          {editingItem && (
            <div className="edit-mode-banner">
              <span>✏️ Editando: {editingItem.name}</span>
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

          <div className="form-button-group">
            <button className="save-btn" type="submit">
              {editingItem ? "Atualizar" : "Salvar"}
            </button>

            <button
              type="button"
              className="cancel-btn"
              onClick={handleCancelEdit}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* ... (Restante do JSX: Filtros e Lista) ... */}
      {savedItems.length > 0 && (
        <div className="filters-container">
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

      <div className="saved-list">
        {loading ? (
          <p>Carregando suas senhas criptografadas...</p>
        ) : filteredList.length === 0 ? (
          <div className="empty-state">
            <p>
              Nenhuma senha salva ainda. Clique no botão + para adicionar uma
              nova senha.
            </p>
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

            {totalPages > 1 && (
              <div className="pagination">
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
