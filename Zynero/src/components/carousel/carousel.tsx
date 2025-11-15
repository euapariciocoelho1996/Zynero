import './carousel.css';

// Ícone de Segurança (aumentei o tamanho padrão para 48px)
const IconShield = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
  </svg>
);

// Os outros ícones não são mais necessários
// const IconKey = () => ( ... );
// const IconLock = () => ( ... );
// const IconBell = () => ( ... );

export default function ZyneroCarousel() {
  // Removemos todo o state, effect, e a lista de 'items'
  // Agora é um componente estático focado na segurança.

  return (
    <div className="zynero-carousel-container">
      <div className="zynero-carousel-content">
        {/* O item é estático, não precisa mais de 'key' */}
        <div className="zynero-carousel-item">
          <div className="zynero-carousel-icon"> {/* Ícone com brilho neon */}
            <IconShield />
          </div>
          <p className="zynero-carousel-text">
            Suas senhas são <strong>só suas</strong>. Seu cofre digital é <strong>100% privado</strong>. Você está no <strong>controle</strong> total. <strong>Nem nós podemos vê-las</strong>.
          </p>
        </div>
      </div>
      {/* Indicadores removidos */}
    </div>
  );
}