import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const source = resolve(process.cwd(), '..', 'index.html');
const output = resolve(process.cwd(), 'src', 'landing.html');
const html = await readFile(source, 'utf8');

const head = html.match(/<head[\s\S]*?<\/head>/i)?.[0] ?? '';
const styles = [...head.matchAll(/<style\b[\s\S]*?<\/style>/gi)]
  .map((match) => match[0])
  .join('\n');
const mainStart = html.indexOf('<div id="main"');
const scriptsStart = html.indexOf('<script>', mainStart);
const svgStart = html.indexOf('<div id="svg-templates"');
const bodyEnd = html.indexOf('</body>', svgStart);

if (mainStart === -1 || scriptsStart === -1 || svgStart === -1 || bodyEnd === -1) {
  throw new Error('Could not locate the Framer page markup in the source export.');
}

let page = `${styles}\n${html.slice(mainStart, scriptsStart)}\n${html.slice(svgStart, bodyEnd)}`;
page = page
  .replaceAll('images/', '/images/')
  // Framer's animation runtime would normally reveal these elements after hydration.
  // React renders the exported static view directly, so show them immediately.
  .replaceAll('opacity:0.001;transform:translateY(-16px)', 'opacity:1;transform:none')
  .replaceAll('opacity:0.001;transform:translateY(16px)', 'opacity:1;transform:none');

await mkdir(resolve(process.cwd(), 'src'), { recursive: true });
await writeFile(output, page);
