import { useState } from 'react'

interface NewsImageProps {
  src?: string | null
  className?: string
}

/**
 * Imagen de noticia con fallback cuando falta o falla la carga.
 * Evita mostrar el icono de imagen rota y mantiene el layout.
 */
export function NewsImage({ src, className }: NewsImageProps) {
  const [broken, setBroken] = useState(false)

  if (!src || broken) {
    return (
      <div
        className={`user-timeline-img app-article-card-media app-article-card-media--placeholder ${className ?? ''}`}
      >
        <span className="app-article-card-media-placeholder-icon" aria-hidden="true">
          📰
        </span>
      </div>
    )
  }

  return (
    <img
      src={src}
      alt=""
      className={`user-timeline-img app-article-card-media ${className ?? ''}`}
      loading="lazy"
      decoding="async"
      onError={() => setBroken(true)}
    />
  )
}

