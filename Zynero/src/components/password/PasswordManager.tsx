import { useState, useMemo, useEffect } from 'react';
import Swal from 'sweetalert2';
import './PasswordManager.css';
import { 
  collection, 
  addDoc, 
  doc, 
  deleteDoc, 
  updateDoc,
  query, 
  where,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../auth/firebaseConfig';
import { auth } from '../auth/firebaseConfig';
import { onAuthStateChanged, type User } from 'firebase/auth';

// 20 ícones para o usuário escolher
const iconOptions = [
  '🔒', '🔑', '📱', '💻', '🌐', '📧', '💾', '🏦', '🎮', '📷',
  '📚', '🚀', '🎧', '🛒', '⚙️', '🧩', '💬', '🎯', '🧪', '🛡️'
];

const categories = [
  'Redes Sociais',
  'Banco',
  'Aplicativo',
  'Email',
  'Trabalho',
  'Outros'
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
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState(iconOptions[0]);
  const [formData, setFormData] = useState({
    category: categories[0],
    name: '',
    password: ''
  });

  const [savedItems, setSavedItems] = useState<PasswordItem[]>([]);
  const [filterCategory, setFilterCategory] = useState('Todas');
  const [search, setSearch] = useState('');
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  const [editingItem, setEditingItem] = useState<PasswordItem | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Observa mudanças na autenticação
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
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

    setLoading(true);
    const passwordsRef = collection(db, 'passwords');
    const q = query(passwordsRef, where('userId', '==', user.uid));

    console.log('🔍 Iniciando listener do Firestore para userId:', user.uid);

    // Escuta mudanças em tempo real
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log('📦 Snapshot recebido:', snapshot.size, 'documentos');
        const items: PasswordItem[] = [];
        
        if (snapshot.empty) {
          console.log('⚠️ Nenhum documento encontrado na coleção passwords');
        }

        snapshot.forEach((docSnapshot) => {
          const data = docSnapshot.data();
          console.log('📄 Documento encontrado:', docSnapshot.id, data);
          items.push({
            id: docSnapshot.id,
            icon: data.icon || '🔒',
            category: data.category || '',
            name: data.name || '',
            password: data.password || ''
          });
        });
        
        console.log('✅ Total de itens carregados:', items.length);
        setSavedItems(items);
        setLoading(false);
      },
      (error) => {
        console.error('❌ Erro ao carregar senhas:', error);
        console.error('Erro detalhado:', {
          code: error.code,
          message: error.message,
          stack: error.stack
        });
        setLoading(false);
        Swal.fire({
          title: 'Erro ao carregar!',
          text: `Não foi possível carregar suas senhas. ${error.message}`,
          icon: 'error',
          confirmButtonText: 'Ok'
        });
      }
    );

    return () => {
      console.log('🧹 Limpando listener do Firestore');
      unsubscribe();
    };
  }, [user]);

  const filteredCategories = useMemo(() => {
    const unique = ['Todas', ...new Set(savedItems.map(i => i.category))];
    return unique;
  }, [savedItems]);

  const filteredList = useMemo(() => {
    return savedItems.filter(item => {
      const matchesCategory =
        filterCategory === 'Todas' || item.category === filterCategory;

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
      Swal.fire({
        title: 'Erro!',
        text: 'Você precisa estar autenticado para salvar senhas.',
        icon: 'error',
        confirmButtonText: 'Ok'
      });
      return;
    }

    try {
      const passwordsRef = collection(db, 'passwords');
      const newDocData = {
        userId: user.uid,
      icon: selectedIcon,
        category: formData.category,
        name: formData.name,
        password: formData.password,
        createdAt: new Date()
      };
      
      console.log('💾 Salvando documento no Firestore:', newDocData);
      
      const docRef = await addDoc(passwordsRef, newDocData);
      
      console.log('✅ Documento salvo com ID:', docRef.id);

    Swal.fire({
        title: 'Salvo!',
        text: 'Os dados foram salvos com sucesso.',
        icon: 'success',
        confirmButtonText: 'Ok'
      });

      setFormData({ category: categories[0], name: '', password: '' });
      setSelectedIcon(iconOptions[0]);
      setShowForm(false);
    } catch (error: any) {
      console.error('❌ Erro ao salvar senha:', error);
      console.error('Erro detalhado:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      
      let errorMessage = 'Não foi possível salvar os dados. Tente novamente.';
      
      if (error.code === 'permission-denied') {
        errorMessage = 'Permissão negada. Verifique as regras de segurança do Firestore.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Swal.fire({
        title: 'Erro!',
        text: errorMessage,
        icon: 'error',
        confirmButtonText: 'Ok'
      });
    }
  };

  const togglePasswordVisibility = (itemId: string) => {
    setVisiblePasswords(prev => {
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
    setEditingItem(item);
    setFormData({
      category: item.category,
      name: item.name,
      password: item.password
    });
    setSelectedIcon(item.icon);
    setShowForm(true);
    // Scroll para o formulário
    setTimeout(() => {
      document.querySelector('.password-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!user || !editingItem) return;

    try {
      const docRef = doc(db, 'passwords', editingItem.id);
      await updateDoc(docRef, {
        icon: selectedIcon,
        category: formData.category,
        name: formData.name,
        password: formData.password,
        updatedAt: new Date()
      });

      Swal.fire({
        title: 'Atualizado!',
        text: 'Os dados foram atualizados com sucesso.',
        icon: 'success',
        confirmButtonText: 'Ok'
      });

      setFormData({ category: categories[0], name: '', password: '' });
    setSelectedIcon(iconOptions[0]);
      setEditingItem(null);
    setShowForm(false);
    } catch (error: any) {
      console.error('Erro ao atualizar senha:', error);
      Swal.fire({
        title: 'Erro!',
        text: 'Não foi possível atualizar os dados.',
        icon: 'error',
        confirmButtonText: 'Ok'
      });
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!user) return;

    const result = await Swal.fire({
      title: 'Tem certeza?',
      text: 'Esta ação não pode ser desfeita!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#00bfa5',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sim, deletar!',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await deleteDoc(doc(db, 'passwords', itemId));
        Swal.fire({
          title: 'Deletado!',
          text: 'A senha foi removida com sucesso.',
          icon: 'success',
          confirmButtonText: 'Ok'
        });
      } catch (error) {
        console.error('Erro ao deletar senha:', error);
        Swal.fire({
          title: 'Erro!',
          text: 'Não foi possível deletar a senha.',
          icon: 'error',
          confirmButtonText: 'Ok'
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="password-manager">
        <p>Carregando suas senhas...</p>
        {user && (
          <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '8px' }}>
            User ID: {user.uid}
          </p>
        )}
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

  return (
    <div className="password-manager">

      {/* Botão de adicionar */}
      <button className="add-btn" onClick={() => setShowForm(!showForm)}>
        <span>+</span>
      </button>

      {/* Formulário */}
      {showForm && (
        <form className="password-form" onSubmit={editingItem ? handleUpdate : handleSubmit}>
          {editingItem && (
            <div className="edit-mode-banner">
              <span>✏️ Editando: {editingItem.name}</span>
              <button
                type="button"
                className="cancel-edit-btn"
                onClick={() => {
                  setEditingItem(null);
                  setFormData({ category: categories[0], name: '', password: '' });
                  setSelectedIcon(iconOptions[0]);
                  setShowForm(false);
                }}
              >
                Cancelar
              </button>
            </div>
          )}

          <label>Categoria</label>
          <select
            value={formData.category}
            onChange={e => setFormData({ ...formData, category: e.target.value })}
          >
            {categories.map(c => (
              <option key={c}>{c}</option>
            ))}
          </select>

          <label>Nome</label>
          <input
            type="text"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ex: Instagram"
            required
          />

          <label>Senha</label>
          <input
            type="password"
            value={formData.password}
            onChange={e => setFormData({ ...formData, password: e.target.value })}
            required
          />

          <label>Ícone</label>
          <div className="icon-grid">
            {iconOptions.map(icon => (
              <button
                key={icon}
                type="button"
                className={`icon-option ${selectedIcon === icon ? 'active' : ''}`}
                onClick={() => setSelectedIcon(icon)}
              >
                {icon}
              </button>
            ))}
          </div>

          <button className="save-btn" type="submit">
            {editingItem ? 'Atualizar' : 'Salvar'}
          </button>
        </form>
      )}

      {/* Filtros */}
      {savedItems.length > 0 && (
        <div className="filters-container">
          <div className="filters-header">
            <h3>Filtros e Busca</h3>
            <span className="results-count">{filteredList.length} {filteredList.length === 1 ? 'resultado' : 'resultados'}</span>
          </div>
        <div className="filters">
            <div className="filter-group">
              <label>Categoria</label>
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="filter-category"
          >
            {filteredCategories.map(c => (
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
            onChange={e => setSearch(e.target.value)}
            className="filter-search"
          />
            </div>
          </div>
        </div>
      )}

      {/* Lista */}
      <div className="saved-list">
        {filteredList.length === 0 && !loading ? (
          <div className="empty-state">
            <p>Nenhuma senha salva ainda. Clique no botão + para adicionar uma nova senha.</p>
            {savedItems.length === 0 && (
              <p style={{ fontSize: '0.85rem', marginTop: '8px', opacity: 0.7 }}>
                (Total na lista: {savedItems.length} | Filtros ativos: {filterCategory !== 'Todas' || search ? 'Sim' : 'Não'})
              </p>
            )}
          </div>
        ) : (
          <>
            {paginatedList.map(item => (
            <div key={item.id} className="saved-item">
              <div className="item-main">
                <span className="item-icon">{item.icon}</span>
                <div className="item-info">
                  <strong className="item-name">{item.name}</strong>
                  <span className="item-category">{item.category}</span>
                  <div className="item-password">
                    <span className="password-value">
                      {visiblePasswords.has(item.id) ? item.password : '••••••••••••'}
                    </span>
                    <button
                      className="toggle-password-btn"
                      onClick={() => togglePasswordVisibility(item.id)}
                      title={visiblePasswords.has(item.id) ? 'Ocultar senha' : 'Mostrar senha'}
                    >
                      {visiblePasswords.has(item.id) ? '👁️' : '👁️‍🗨️'}
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
                  ✏️ 
                </button>
                <button
                  className="action-btn delete-btn"
                  onClick={() => handleDelete(item.id)}
                  title="Deletar senha"
                >
                  🗑️ 
                </button>
              </div>
            </div>
            ))}

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  className="pagination-btn"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  ← Anterior
                </button>
                <span className="pagination-info">
                  Página {currentPage} de {totalPages}
                </span>
                <button
                  className="pagination-btn"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
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
