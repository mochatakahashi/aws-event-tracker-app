/**
 * Draws the shareable stamp card (Instagram story size, 1080 x 1920) on a
 * canvas. `t` runs from 0 to 1 for the opening animation (stamps pop in one by
 * one); t = 1 is the finished card used for the download.
 */
export const STORY_W = 1080;
export const STORY_H = 1920;
export const CLUB_HANDLE = '@awssbgapc';
const FONT = '"Inter", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

export interface StoryStamp {
  /** e.g. "Session 1" */
  label: string;
  /** The session title */
  title: string;
  collected: boolean;
}

export interface StoryData {
  eventTitle: string;
  /** e.g. "Oct 25, 2026 · Asia Pacific College" */
  when: string;
  firstName: string;
  initials: string;
  stamps: StoryStamp[];
  hashtags: string[];
  photo?: HTMLImageElement | null;
  clubLogo?: HTMLImageElement | null;
  schoolLogo?: HTMLImageElement | null;
}

/** "Tech Barangay: WordPress x AWS x Notion" → ["Tech Barangay", "WordPress x AWS x Notion"] */
export function splitTitle(title: string): [string, string] {
  const i = title.indexOf(':');
  if (i > 0 && i < title.length - 1) return [title.slice(0, i).trim(), title.slice(i + 1).trim()];
  return [title.trim(), ''];
}

/** A hashtag from the event's main name: "Tech Barangay: …" → "#TechBarangay". */
export function eventHashtag(title: string): string {
  const main = splitTitle(title)[0];
  const words = main
    .normalize('NFKD')
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 4);
  const tag = words.map((w) => w[0].toUpperCase() + w.slice(1)).join('');
  return tag ? `#${tag.slice(0, 40)}` : '';
}

/** Club tag, event tag, and one for what they achieved. */
export function storyHashtags(eventTitle: string, complete: boolean): string[] {
  return ['#AWSSBGAPC', eventHashtag(eventTitle), complete ? '#PassportComplete' : '#StampCollector'].filter(
    (t, i, all) => t && all.indexOf(t) === i,
  );
}

const clamp = (x: number) => Math.max(0, Math.min(1, x));
const easeOutBack = (x: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};
const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);

/** Small seeded random so the confetti and stamp tilts look the same every time. */
function seeded(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Wraps text to at most `maxLines`, adding … when cut. */
function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(next).width <= maxW || !cur) cur = next;
    else {
      lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    let last = kept[maxLines - 1];
    while (last.length > 1 && ctx.measureText(`${last}…`).width > maxW) last = last.slice(0, -1);
    kept[maxLines - 1] = `${last.trimEnd()}…`;
    return kept;
  }
  // A single word longer than the width
  return lines.map((l) => {
    if (ctx.measureText(l).width <= maxW) return l;
    let s = l;
    while (s.length > 1 && ctx.measureText(`${s}…`).width > maxW) s = s.slice(0, -1);
    return `${s}…`;
  });
}

/** Font size that fits `text` in `maxW`, from `start` down to `min`. */
function fit(ctx: CanvasRenderingContext2D, text: string, weight: number, start: number, min: number, maxW: number): number {
  let size = start;
  ctx.font = `${weight} ${size}px ${FONT}`;
  while (size > min && ctx.measureText(text).width > maxW) {
    size -= 4;
    ctx.font = `${weight} ${size}px ${FONT}`;
  }
  return size;
}

/** A hand-drawn looking star, like a rubber stamp. */
function drawStar(ctx: CanvasRenderingContext2D, r: number, rand: () => number) {
  ctx.beginPath();
  for (let i = 0; i <= 5; i++) {
    const a = -Math.PI / 2 + (i * 4 * Math.PI) / 5;
    const wob = 1 + (rand() - 0.5) * 0.12;
    const x = Math.cos(a) * r * wob;
    const y = Math.sin(a) * r * wob;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

function drawPhoto(ctx: CanvasRenderingContext2D, d: StoryData, cx: number, cy: number, r: number) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.closePath();
  if (d.photo && d.photo.naturalWidth) {
    ctx.clip();
    const img = d.photo;
    const s = Math.max((2 * r) / img.naturalWidth, (2 * r) / img.naturalHeight);
    const w = img.naturalWidth * s;
    const h = img.naturalHeight * s;
    ctx.drawImage(img, cx - w / 2, cy - h / 2, w, h);
  } else {
    const g = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
    g.addColorStop(0, '#A855F7');
    g.addColorStop(1, '#7B2D8E');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = `800 ${Math.round(r * 0.8)}px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(d.initials || '?', cx, cy + 4);
  }
  ctx.restore();
  ctx.lineWidth = 8;
  ctx.strokeStyle = '#fff';
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
}

/** Grid of stamp slots: up to 3 per row (4 when there are more than 6). */
function stampLayout(n: number) {
  const perRow = n <= 3 ? Math.max(n, 1) : n === 4 ? 2 : n <= 6 ? 3 : 4;
  const r = n <= 3 ? 122 : n <= 6 ? 104 : 84;
  return { perRow, r, rows: Math.ceil(n / perRow) };
}

export function drawStory(ctx: CanvasRenderingContext2D, d: StoryData, t = 1) {
  const W = STORY_W;
  const H = STORY_H;
  const rand = seeded(d.eventTitle.length * 97 + d.firstName.length * 13 + 7);
  ctx.save();
  ctx.clearRect(0, 0, W, H);
  ctx.textBaseline = 'alphabetic';

  // Background: the app's purple gradient with soft lights and confetti
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#2D0A3E');
  bg.addColorStop(0.5, '#4A1259');
  bg.addColorStop(1, '#7B2D8E');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  const glow = (x: number, y: number, r: number, c: string) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, c);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  };
  const drift = Math.sin(t * Math.PI) * 30;
  glow(180 + drift, 420, 520, 'rgba(192,132,252,0.38)');
  glow(940 - drift, 1500, 560, 'rgba(244,114,182,0.26)');
  glow(900, 160, 360, 'rgba(233,213,255,0.16)');
  const confettiColors = ['#F0ABFC', '#FDE68A', '#A5F3FC', '#C4B5FD', '#FBCFE8'];
  for (let i = 0; i < 46; i++) {
    const x = rand() * W;
    const y = rand() * H;
    const size = 6 + rand() * 12;
    const rot = rand() * Math.PI;
    const color = confettiColors[Math.floor(rand() * confettiColors.length)];
    const fall = (1 - easeOut(clamp(t * 1.4))) * -60;
    ctx.save();
    ctx.globalAlpha = 0.35 + rand() * 0.35;
    ctx.translate(x, y + fall);
    ctx.rotate(rot + t * 0.6);
    ctx.fillStyle = color;
    if (i % 3 === 0) {
      ctx.beginPath();
      ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
      ctx.fill();
    } else ctx.fillRect(-size / 2, -size / 4, size, size / 2);
    ctx.restore();
  }

  const appear = (start: number, len = 0.18) => easeOut(clamp((t - start) / len));

  // Logos: club (on a white pill) and school
  ctx.save();
  ctx.globalAlpha = appear(0);
  if (d.clubLogo?.naturalWidth) {
    // Round club badge
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.35)';
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 8;
    ctx.drawImage(d.clubLogo, 70, 76, 150, 150);
    ctx.restore();
  } else {
    ctx.fillStyle = '#4A1259';
    ctx.font = `800 40px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('AWS SBG-APC', 220, 165);
  }
  if (d.schoolLogo?.naturalWidth) {
    const s = Math.min(200 / d.schoolLogo.naturalWidth, 104 / d.schoolLogo.naturalHeight);
    const w = d.schoolLogo.naturalWidth * s;
    const h = d.schoolLogo.naturalHeight * s;
    ctx.drawImage(d.schoolLogo, 250, 92 + (118 - h) / 2, w, h);
  }
  // "EVENT PASSPORT" tag on the right
  ctx.font = `800 28px ${FONT}`;
  const tag = 'EVENT PASSPORT';
  const tw = ctx.measureText(tag).width + 48;
  roundRect(ctx, W - 70 - tw, 128, tw, 56, 28);
  ctx.fillStyle = 'rgba(255,255,255,0.14)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#F5E8FF';
  ctx.textAlign = 'center';
  ctx.fillText(tag, W - 70 - tw / 2, 166);
  ctx.restore();

  // Event title
  const [main, sub] = splitTitle(d.eventTitle);
  ctx.save();
  const ta = appear(0.04);
  ctx.globalAlpha = ta;
  ctx.translate(0, (1 - ta) * 30);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff';
  const titleSize = fit(ctx, main, 900, 112, 64, W - 140);
  ctx.font = `900 ${titleSize}px ${FONT}`;
  const titleLines = wrap(ctx, main, W - 140, 2);
  let y = 370;
  titleLines.forEach((l) => {
    ctx.fillText(l, W / 2, y);
    y += titleSize * 1.05;
  });
  if (sub) {
    ctx.font = `700 46px ${FONT}`;
    ctx.fillStyle = '#E9D5FF';
    wrap(ctx, sub, W - 160, 2).forEach((l) => {
      ctx.fillText(l, W / 2, y + 2);
      y += 56;
    });
  }
  ctx.font = `600 34px ${FONT}`;
  ctx.fillStyle = 'rgba(255,255,255,0.72)';
  ctx.fillText(d.when, W / 2, y + 14);
  ctx.restore();
  const nameTop = Math.max(y + 60, 600);

  // "Hi, I'm …!" card
  ctx.save();
  const na = appear(0.1);
  ctx.globalAlpha = na;
  ctx.translate(0, (1 - na) * 40);
  ctx.shadowColor = 'rgba(20,0,40,0.35)';
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 14;
  roundRect(ctx, 70, nameTop, W - 140, 250, 44);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.shadowColor = 'transparent';
  drawPhoto(ctx, d, 70 + 150, nameTop + 125, 92);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#7B2D8E';
  ctx.font = `700 40px ${FONT}`;
  ctx.fillText('Hi, I’m', 70 + 280, nameTop + 104);
  const nameText = `${d.firstName || 'there'}!`;
  const nameSize = fit(ctx, nameText, 900, 96, 48, W - 140 - 320);
  ctx.font = `900 ${nameSize}px ${FONT}`;
  ctx.fillStyle = '#2D0A3E';
  ctx.fillText(nameText, 70 + 280, nameTop + 104 + nameSize * 0.98);
  ctx.restore();

  // My stamps
  const collected = d.stamps.filter((s) => s.collected).length;
  const total = d.stamps.length;
  const complete = total > 0 && collected === total;
  let sy = nameTop + 340;
  ctx.save();
  ctx.globalAlpha = appear(0.16);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff';
  ctx.font = `800 38px ${FONT}`;
  ctx.fillText('MY STAMPS', W / 2, sy);
  const lw = ctx.measureText('MY STAMPS').width / 2 + 30;
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(110, sy - 12);
  ctx.lineTo(W / 2 - lw, sy - 12);
  ctx.moveTo(W / 2 + lw, sy - 12);
  ctx.lineTo(W - 110, sy - 12);
  ctx.stroke();
  ctx.restore();

  const shown = d.stamps.slice(0, 8);
  const { perRow, r, rows } = stampLayout(shown.length);
  const colW = (W - 140) / perRow;
  const rowH = r * 2 + 150;
  sy += 40 + r;
  const stampStart = 0.22;
  const stampStep = Math.min(0.1, 0.5 / Math.max(shown.length, 1));
  shown.forEach((s, i) => {
    const row = Math.floor(i / perRow);
    const inRow = Math.min(perRow, shown.length - row * perRow);
    const offset = (W - 140 - inRow * colW) / 2;
    const cx = 70 + offset + colW * (i % perRow) + colW / 2;
    const cy = sy + row * rowH;
    const tilt = (rand() - 0.5) * 0.5;
    const local = clamp((t - (stampStart + i * stampStep)) / 0.16);
    ctx.save();
    ctx.translate(cx, cy);
    if (s.collected) {
      // Stamp lands: big and see-through, then snaps in place
      const k = easeOutBack(local);
      const scale = 1.9 - 0.9 * k;
      ctx.globalAlpha = clamp(local * 1.6);
      ctx.rotate(tilt * k + (1 - k) * 0.6);
      ctx.scale(scale, scale);
      const g = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
      g.addColorStop(0, '#C084FC');
      g.addColorStop(1, '#7E22CE');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.setLineDash([10, 9]);
      ctx.strokeStyle = 'rgba(255,255,255,0.75)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, r - 14, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = Math.max(6, r * 0.07);
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      drawStar(ctx, r * 0.52, rand);
      // Check badge
      ctx.rotate(-tilt);
      ctx.fillStyle = '#10B981';
      ctx.beginPath();
      ctx.arc(r * 0.7, -r * 0.7, r * 0.24, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = Math.max(5, r * 0.05);
      ctx.beginPath();
      ctx.moveTo(r * 0.6, -r * 0.7);
      ctx.lineTo(r * 0.68, -r * 0.61);
      ctx.lineTo(r * 0.82, -r * 0.8);
      ctx.stroke();
    } else {
      ctx.globalAlpha = 0.85 * appear(stampStart + i * stampStep, 0.12);
      ctx.setLineDash([14, 12]);
      ctx.strokeStyle = 'rgba(255,255,255,0.45)';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.font = `800 ${Math.round(r * 0.7)}px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('?', 0, 4);
    }
    ctx.restore();
    // Labels
    ctx.save();
    ctx.globalAlpha = appear(stampStart + i * stampStep + 0.06, 0.12);
    ctx.textAlign = 'center';
    ctx.fillStyle = s.collected ? '#fff' : 'rgba(255,255,255,0.6)';
    ctx.font = `800 ${r > 100 ? 36 : 30}px ${FONT}`;
    ctx.fillText(s.label, cx, cy + r + 58);
    ctx.font = `600 ${r > 100 ? 28 : 24}px ${FONT}`;
    ctx.fillStyle = s.collected ? '#E9D5FF' : 'rgba(233,213,255,0.55)';
    wrap(ctx, s.title, colW - 24, 2).forEach((l, j) => ctx.fillText(l, cx, cy + r + 96 + j * 34));
    ctx.restore();
  });
  let after = sy + (rows - 1) * rowH + r + 190;
  if (d.stamps.length > shown.length) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#E9D5FF';
    ctx.font = `700 30px ${FONT}`;
    ctx.fillText(`+${d.stamps.length - shown.length} more`, W / 2, after - 20);
    ctx.restore();
    after += 30;
  }

  // Result badge: tilted like a stamp, lands after the stamps
  const badgeAt = stampStart + shown.length * stampStep + 0.08;
  const bk = clamp((t - badgeAt) / 0.14);
  ctx.save();
  ctx.translate(W / 2, after + 20);
  ctx.rotate(-0.05);
  const bs = 1.6 - 0.6 * easeOutBack(bk);
  ctx.scale(bs, bs);
  ctx.globalAlpha = clamp(bk * 1.5);
  const badge = complete ? 'PASSPORT COMPLETE!' : `${collected} OF ${total} STAMPS`;
  ctx.font = `900 46px ${FONT}`;
  const bw = ctx.measureText(badge).width + 90;
  roundRect(ctx, -bw / 2, -46, bw, 92, 46);
  ctx.fillStyle = complete ? '#FBBF24' : 'rgba(255,255,255,0.16)';
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = complete ? '#fff' : 'rgba(255,255,255,0.5)';
  ctx.stroke();
  ctx.fillStyle = complete ? '#3B0F52' : '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(badge, 0, 3);
  ctx.restore();

  // Prompts to fill in with Instagram text
  let py = Math.max(after + 140, 1420);
  ctx.save();
  ctx.globalAlpha = appear(badgeAt + 0.06);
  ctx.textAlign = 'left';
  ctx.font = `700 36px ${FONT}`;
  for (const label of ['I learned that:', 'I want to share:']) {
    ctx.fillStyle = '#fff';
    ctx.fillText(label, 110, py);
    const start = 110 + ctx.measureText(label).width + 22;
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(start, py + 6);
    ctx.lineTo(W - 110, py + 6);
    ctx.stroke();
    py += 86;
  }
  ctx.restore();

  // Tag us + hashtags
  const fy = Math.min(Math.max(py + 70, 1640), 1700);
  ctx.save();
  ctx.globalAlpha = appear(badgeAt + 0.1);
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.font = `700 30px ${FONT}`;
  ctx.fillText('TAG US ON YOUR STORY', W / 2, fy);
  ctx.font = `900 72px ${FONT}`;
  const hw = ctx.measureText(CLUB_HANDLE).width;
  const ig = ctx.createLinearGradient(W / 2 - hw / 2, 0, W / 2 + hw / 2, 0);
  ig.addColorStop(0, '#FDE68A');
  ig.addColorStop(0.5, '#F9A8D4');
  ig.addColorStop(1, '#C4B5FD');
  ctx.fillStyle = ig;
  ctx.fillText(CLUB_HANDLE, W / 2, fy + 82);
  ctx.font = `700 34px ${FONT}`;
  ctx.fillStyle = '#E9D5FF';
  ctx.fillText(d.hashtags.join('  '), W / 2, fy + 140, W - 120);
  ctx.restore();

  ctx.restore();
}

/** The caption to paste with the story. */
export function storyCaption(eventTitle: string, collected: number, total: number, hashtags: string[]): string {
  const what =
    total > 0 && collected === total
      ? `I completed my stamp passport (${total} of ${total})`
      : collected === 0
        ? `I’m collecting stamps (${total} to get)`
        : `I collected ${collected} of ${total} stamps`;
  return `${what} at ${eventTitle}! Thank you ${CLUB_HANDLE} ${hashtags.join(' ')}`;
}
