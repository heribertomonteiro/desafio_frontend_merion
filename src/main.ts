import * as PIXI from 'pixi.js';

// Components
import { Button } from './components/Button';
import { WinAnimation } from './components/WinAnimation';
import { Character } from './components/Character';
import { ObjectsGrid } from './components/ObjectsGrid';

const app = new PIXI.Application();

await app.init({
  width: 800,
  height: 600,
  backgroundColor: 0x0b1020,
});

app.canvas.style.width = '100%';
app.canvas.style.height = '100%';

const container = document.getElementById('pixi-container')!;
container.appendChild(app.canvas);

const backgroundLayer = new PIXI.Container();
const uiLayer = new PIXI.Container();

app.stage.addChild(backgroundLayer);
app.stage.addChild(uiLayer);

const texture = await PIXI.Assets.load('/assets/static-previews/MAIN_GAME.png');

const sprite = new PIXI.Sprite(texture);
sprite.anchor.set(0.5);

const scale = Math.min(
  app.screen.width / texture.width,
  app.screen.height / texture.height
);

sprite.scale.set(scale);
sprite.x = app.screen.width / 2;
sprite.y = app.screen.height / 2;

backgroundLayer.addChild(sprite);

const winDimmer = new PIXI.Graphics();
winDimmer.rect(0, 0, app.screen.width, app.screen.height);
winDimmer.fill({ color: 0x000000, alpha: 0.45 });
winDimmer.visible = false;
winDimmer.eventMode = 'none';

async function loadSequence(options: {
  urlForIndex: (i: number) => string;
  start: number;
  end: number;
}): Promise<PIXI.Texture[]> {
  const textures: PIXI.Texture[] = [];
  for (let i = options.start; i <= options.end; i++) {
    const url = options.urlForIndex(i);
    try {
      const tex = await PIXI.Assets.load(url);
      textures.push(tex);
    } catch {
      console.warn(`Frame ignorado (corrompido ou ausente): ${url}`);
    }
  }
  return textures;
}

const objectsGrid = new ObjectsGrid(app, {
  columns: 6,
  rows: 5,
  itemScale: 1,
  itemScaleY: 1.1,
  animationSpeed: 0.6,
  itemScaleByObject: {
    Dynamit: { x: 1.8, y: 1.8 },
  },
});
objectsGrid.container.position.set(90, 55);
uiLayer.addChild(objectsGrid.container);
const objectsGridPopulatePromise = objectsGrid.populateRandom();

// ── Botão criado mas NÃO adicionado ainda ────────────────────────────────────
const spinButton = new Button({
  x: app.screen.width - 227,
  y: app.screen.height - 137,
  text: 'SPIN',
  onClick: () => {
    showWin();
  },
});
spinButton.container.alpha = 0;

// ── Carregamento paralelo de todos os frames ──────────────────────────────────

const [
  idleFrames,
  characterWinFrames,
  bigWinFrames,
  megaWinFrames,
  superWinFrames,
  totalWinFrames,
] = await Promise.all([
  loadSequence({
    start: 0,
    end: 60,
    urlForIndex: (i) => {
      const num = i.toString().padStart(2, '0');
      return `/assets/_Sequences/Character/Idle/Fox-Idle_${num}.png`;
    },
  }),
  loadSequence({
    start: 0,
    end: 60,
    urlForIndex: (i) => {
      const num = i.toString().padStart(2, '0');
      return `/assets/_Sequences/Character/Win/Win_${num}.png`;
    },
  }),
  loadSequence({
    start: 0,
    end: 45,
    urlForIndex: (i) => `/assets/_Sequences/Wins/Big_Win/Big_Win_${i}.png`,
  }),
  loadSequence({
    start: 0,
    end: 45,
    urlForIndex: (i) => `/assets/_Sequences/Wins/Mega_Win/Mega_Win_${i}.png`,
  }),
  loadSequence({
    start: 0,
    end: 45,
    urlForIndex: (i) => `/assets/_Sequences/Wins/Super_MEga_Win/Super_Mega_Win_${i}.png`,
  }),
  loadSequence({
    start: 0,
    end: 45,
    urlForIndex: (i) => `/assets/_Sequences/Wins/Total_Win/Total_Win_${i}.png`,
  }),
]);

// ── Instâncias ────────────────────────────────────────────────────────────────

const winAnimation = new WinAnimation(app, 0.6);
winAnimation.setSequences([
  { type: 'BigWin',   frames: bigWinFrames },
  { type: 'TotalWin', frames: totalWinFrames },
  { type: 'MegaWin',  frames: megaWinFrames },
  { type: 'SuperWin', frames: superWinFrames },
]);

const character = new Character(idleFrames, characterWinFrames, app, 0.45, 0.4);
uiLayer.addChild(character.sprite);

// ── Botão adicionado APÓS tudo carregado ─────────────────────────────────────
uiLayer.addChild(spinButton.container);

// ── Lógica de exibição de win ─────────────────────────────────────────────────

function showWin() {
  winDimmer.visible = true;
  uiLayer.addChild(winDimmer);
  uiLayer.addChild(winAnimation.sprite);

  character.playWin();

  winAnimation.playSequence('TotalWin', () => {
    winDimmer.visible = false;
    winDimmer.removeFromParent();
    winAnimation.sprite.removeFromParent();
    winAnimation.stop();

    character.playIdle();
  });
}

await objectsGridPopulatePromise;