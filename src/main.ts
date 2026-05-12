import * as PIXI from 'pixi.js';
import { Howl } from 'howler';

// Components
import { Button } from './components/Button';
import { WinAnimation } from './components/WinAnimation';
import { Character } from './components/Character';
import { ObjectsGrid } from './components/ObjectsGrid';
import { LoadingScreen } from './components/LoadingScreen';

const app = new PIXI.Application();

const spinSound = new Howl({ src: ['/assets/sounds/girando_board.mp3'], volume: 0.7 });
const winSound = new Howl({ src: ['/assets/sounds/the-sound-of-victory-in-the-game-level.mp3'], volume: 0.9, loop: true });

await app.init({
  width: 800,
  height: 600,
  backgroundColor: 0x0b1020,
});

app.canvas.style.width = '100%';
app.canvas.style.height = '100%';

const container = document.getElementById('pixi-container')!;
container.appendChild(app.canvas);

// ── Roots: loading screen vs game screen ────────────────────────────────────

const gameRoot = new PIXI.Container();
gameRoot.visible = false;

app.stage.addChild(gameRoot);

const loadingScreen = new LoadingScreen(app, { text: 'Carregando' });
loadingScreen.show();

const backgroundLayer = new PIXI.Container();
const uiLayer = new PIXI.Container();

gameRoot.addChild(backgroundLayer);
gameRoot.addChild(uiLayer);

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
    Bank: { x: 0.8, y: 0.8 },
  },
  slotHeight: 90,
});
objectsGrid.container.position.set(90, 55);
uiLayer.addChild(objectsGrid.container);
const objectsGridPopulatePromise = objectsGrid.populateRandom();

const spinButton = new Button({
  x: app.screen.width - 227,
  y: app.screen.height - 137,
  text: 'SPIN',
  onClick: async () => {
    spinSound.stop();
    const spinSoundId = spinSound.play();
    try {
      await objectsGrid.spin();
    } finally {
      spinSound.stop(spinSoundId);
    }

    winSound.stop();
    const winSoundId = winSound.play();

    showWin(winSoundId);
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
  { type: 'MegaWin',  frames: megaWinFrames },
  { type: 'SuperWin', frames: superWinFrames },
  { type: 'TotalWin', frames: totalWinFrames },
]);

const character = new Character(idleFrames, characterWinFrames, app, 0.45, 0.4);
uiLayer.addChild(character.sprite);

uiLayer.addChild(spinButton.container);

// ── Lógica de exibição de win ─────────────────────────────────────────────────

function showWin(winSoundId?: number) {
  winDimmer.visible = true;
  uiLayer.addChild(winDimmer);
  uiLayer.addChild(winAnimation.sprite);

  character.playWin(true);

  winAnimation.playSequence('TotalWin', () => {
    if (winSoundId !== undefined) {
      winSound.stop(winSoundId);
    }
    winDimmer.visible = false;
    winDimmer.removeFromParent();
    winAnimation.sprite.removeFromParent();
    winAnimation.stop();

    character.playIdle();
  }, 2);
}

await objectsGridPopulatePromise;

// ── Swap: mostra o jogo só depois de carregar tudo ─────────────────────────

loadingScreen.hide();
gameRoot.visible = true;