import { useState, useEffect } from 'react';
import './carousel.css';

// Ícones SVG (alternativa aos lucide-react)
const IconShield = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
  </svg>
);

const IconKey = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path>
  </svg>
);

const IconLock = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
  </svg>
);

const IconBell = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
  </svg>
);

export default function ZyneroCarousel() {
  const items = [
    {
      icon: <IconShield />,
      text: 'Zynero usa criptografia forte para manter suas senhas protegidas em qualquer momento.',
    },
    {
      icon: <IconKey />,
      text: 'Gere senhas seguras rapidamente e reduza riscos de invasões.',
    },
    {
      icon: <IconLock />,
      text: 'Organize tudo com categorias personalizáveis que facilitam o seu dia a dia.',
    },
    {
      icon: <IconBell />,
      text: 'Receba alertas de risco para manter suas credenciais sempre atualizadas.',
    },
  ];

  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % items.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [items.length]);

  return (
    <div className="zynero-carousel-container">
      <div className="zynero-carousel-content">
        <div key={index} className="zynero-carousel-item">
          <div className="zynero-carousel-icon">{items[index].icon}</div>
          <p className="zynero-carousel-text">{items[index].text}</p>
        </div>
      </div>

      {/* Indicators */}
      <div className="zynero-carousel-indicators">
        {items.map((_, i) => (
          <div
            key={i}
            className={`zynero-carousel-indicator ${i === index ? 'active' : ''}`}
            onClick={() => setIndex(i)}
          ></div>
        ))}
      </div>
    </div>
  );
}
