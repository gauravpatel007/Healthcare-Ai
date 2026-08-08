import sourceHtml from '../../index.html?raw';

function getLandingMarkup(html) {
  const head = html.match(/<head[\s\S]*?<\/head>/i)?.[0] ?? '';
  const styles = [...head.matchAll(/<style\b[\s\S]*?<\/style>/gi)]
    .map((match) => match[0])
    .join('\n');
  const mainStart = html.indexOf('<div id="main"');
  const scriptsStart = html.indexOf('<script>', mainStart);
  const svgStart = html.indexOf('<div id="svg-templates"');
  const bodyEnd = html.indexOf('</body>', svgStart);

  if ([mainStart, scriptsStart, svgStart, bodyEnd].some((index) => index === -1)) {
    throw new Error('The landing-page export could not be read.');
  }

  return `${styles}\n${html.slice(mainStart, scriptsStart)}\n${html.slice(svgStart, bodyEnd)}`
    .replaceAll('images/', '/images/')
    .replaceAll('opacity:0.001;transform:translateY(-16px)', 'opacity:1;transform:none')
    .replaceAll('opacity:0.001;transform:translateY(16px)', 'opacity:1;transform:none');
}

const landingMarkup = getLandingMarkup(sourceHtml);

/**
 * The original Framer export is preserved as static markup inside this React
 * component. This makes the page part of the React application while retaining
 * its original classes, inline SVG artwork, typography, and layout.
 */
export default function App() {
  return <div dangerouslySetInnerHTML={{ __html: landingMarkup }} />;
}
