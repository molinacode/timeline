import React from 'react';

type AppImageVariant = 'default' | 'hero' | 'card';

type AppImageProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  /** Variante: default (genérica), hero (landing), card (miniaturas en listas) */
  variant?: AppImageVariant;
  /** Ruta desde public, ej. "/images/hero/portada.webp" */
  src: string;
  /** Texto alternativo (obligatorio para accesibilidad) */
  alt: string;
};

const variantClass: Record<AppImageVariant, string> = {
  default: 'app-img',
  hero: 'app-img app-img--hero',
  card: 'app-img app-img--card'
};

/**
 * Imagen con estilos del sistema de diseño (borde, sombra, brillo/contraste en modo oscuro).
 * Ver docs/guia-imagenes.md para criterios de colores y tipos de imagen.
 */
export function AppImage({
  variant = 'default',
  src,
  alt,
  className = '',
  ...imgProps
}: AppImageProps) {
  const classList = [variantClass[variant], className].filter(Boolean).join(' ');
  return <img src={src} alt={alt} className={classList} {...imgProps} />;
}
