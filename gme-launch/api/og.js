// Social preview card, rendered server-side — same fonts and palette as the site.
// Plain-object element tree (no JSX) so it runs as a standalone Vercel edge function.
import { ImageResponse } from '@vercel/og';

export const config = { runtime: 'edge' };

const h = (type, style, children) => ({ type, props: { style, children } });

async function loadFont(cssUrl) {
  const css = await (await fetch(cssUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } })).text();
  const url = css.match(/src: url\((.+?)\) format\('(?:truetype|opentype)'\)/)?.[1];
  return (await fetch(url)).arrayBuffer();
}

export default async function handler() {
  const [anton, mono] = await Promise.all([
    loadFont('https://fonts.googleapis.com/css2?family=Anton&display=swap'),
    loadFont('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500&display=swap'),
  ]);
  const card = h('div', { width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '72px 80px', backgroundColor: '#050807' }, [
    h('div', { display: 'flex', flexDirection: 'column', fontFamily: 'Anton', textTransform: 'uppercase', lineHeight: 0.95 }, [
      h('span', { fontSize: 118, color: '#d8ffe9' }, 'THE GAME'),
      h('div', { display: 'flex', fontSize: 118 }, [
        h('span', { color: '#d8ffe9' }, 'NEVER '),
        h('span', { color: '#ff3b3b', textDecoration: 'line-through' }, 'STOPPED'),
        h('span', { color: '#d8ffe9' }, '.'),
      ]),
    ]),
    h('div', { display: 'flex', marginTop: 46, fontFamily: 'Mono', fontSize: 27, color: '#2bff88' },
      "Buying the coin buys the stock. Real GameStop, minted on-chain."),
    h('div', { display: 'flex', marginTop: 16, fontFamily: 'Mono', fontSize: 21, color: '#5f7a6b' },
      "NYSE closes at 4PM. This doesn't. · thegameneverstopped.vercel.app"),
  ]);
  return new ImageResponse(card, {
    width: 1200,
    height: 630,
    fonts: [
      { name: 'Anton', data: anton, style: 'normal' },
      { name: 'Mono', data: mono, style: 'normal' },
    ],
    headers: { 'Cache-Control': 's-maxage=86400, stale-while-revalidate' },
  });
}
