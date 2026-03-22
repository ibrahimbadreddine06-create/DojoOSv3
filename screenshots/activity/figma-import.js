// DojoOS — Activity Page → Figma
// Run in Figma: Plugins > Development > Open Console, paste and hit Enter
// Creates a new page with 4 frames (top to bottom) showing the activity page.

const REPO = 'https://raw.githubusercontent.com/ibrahimbadreddine06-create/DojoOSv3/claude/export-activity-figma-bBrNZ/screenshots/activity';

const FRAMES = [
  { name: '1 · Activity — Presets',   url: REPO + '/activity-presets.png',   w: 390, h: 1100 },
  { name: '2 · Activity — Calendar',  url: REPO + '/activity-calendar.png',  w: 390, h: 1100 },
  { name: '3 · Activity — Exercises', url: REPO + '/activity-exercises.png', w: 390, h: 1100 },
  { name: '4 · Activity — Muscles',   url: REPO + '/activity-muscles.png',   w: 390, h: 1100 },
];

(async () => {
  figma.notify('Importing DojoOS Activity Page...');
  const page = figma.createPage();
  page.name = 'DojoOS -- Activity Page';
  figma.currentPage = page;
  let yOffset = 0;
  const GAP = 60;
  for (const f of FRAMES) {
    const resp = await fetch(f.url);
    const buffer = await resp.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const img = figma.createImage(bytes);
    const frame = figma.createFrame();
    frame.name = f.name;
    frame.resize(f.w, f.h);
    frame.x = 0;
    frame.y = yOffset;
    frame.fills = [{ type: 'IMAGE', imageHash: img.hash, scaleMode: 'FILL' }];
    page.appendChild(frame);
    yOffset += f.h + GAP;
  }
  figma.viewport.scrollAndZoomIntoView(page.children);
  figma.notify('Activity Page imported! 4 frames created top to bottom.');
})();
