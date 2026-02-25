import axios from 'axios';

const RTVE_PROGRAMS_URL = 'http://www.rtve.es/api/programas.json';

export async function fetchRtveProgramCatalog() {
  const response = await axios.get(RTVE_PROGRAMS_URL, {
    timeout: 10000
  });

  const data = response.data;

  const programas = Array.isArray(data?.programas)
    ? data.programas
    : Array.isArray(data)
    ? data
    : [];

  return programas.map((p) => ({
    id: Number(p.id),
    nombre: p.nombre,
    tipo: p.tipo || ''
  }));
}

export function filterNewsPrograms(programs) {
  return programs.filter((p) => {
    const name = (p.nombre || '').toLowerCase();
    const type = (p.tipo || '').toLowerCase();

    return (
      type.includes('informativo') ||
      /noticia|telediario|actualidad/i.test(name)
    );
  });
}

export function buildRtveNewsFeeds(programs) {
  return programs.map((p) => ({
    programId: p.id,
    programName: p.nombre,
    feedUrl: `http://www.rtve.es/api/programas/${p.id}/noticias.rss`
  }));
}

