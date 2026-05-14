import * as PIXI from 'pixi.js';

export type ObjectName =
  | 'Bank'
  | 'Cell'
  | 'Dynamit'
  | 'Handcuffs'
  | 'Littera_A'
  | 'Littera_J'
  | 'Littera_K'
  | 'Littera_Q'
  | 'Number_10'
  | 'Safe';

const DEFAULT_OBJECT_NAMES: ObjectName[] = [
  'Bank',
  'Cell',
  'Dynamit',
  'Handcuffs',
  'Littera_A',
  'Littera_J',
  'Littera_K',
  'Littera_Q',
  'Number_10',
  'Safe',
];

const objectFramesCache = new Map<ObjectName, Promise<PIXI.Texture[]>>();

function clamp01(value: number) {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function easeOutCubic(t: number) {
  const x = clamp01(t);
  return 1 - Math.pow(1 - x, 3);
}

function easeInOutCubic(t: number) {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

function easeOutBack(t: number) {
  const x = clamp01(t);
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

function shuffleInPlace<T>(arr: T[]) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function getObjectFrames(name: ObjectName) {
  const cached = objectFramesCache.get(name);
  if (cached) return cached;

  const promise = (async () => {
    const urls = Array.from({ length: 46 }, (_, i) => {
      const num = i.toString().padStart(2, '0');
      return `/assets/_Sequences/Objects/${name}/${name}_${num}.png`;
    });

    const textures = await Promise.all(urls.map((url) => PIXI.Assets.load(url)));
    return textures;
  })();

  objectFramesCache.set(name, promise);
  return promise;
}

async function createObjectSprite(
  name: ObjectName,
  cellWidth: number,
  cellHeight: number,
  options: {
    paddingFactor: number;
    scaleMultiplierX: number;
    scaleMultiplierY: number;
    animationSpeed: number;
  }
) {
  const frames = await getObjectFrames(name);
  const animated = new PIXI.AnimatedSprite(frames);

  animated.anchor.set(0.5);
  animated.animationSpeed = options.animationSpeed;
  animated.loop = true;
  animated.play();

  const firstFrame = frames[0];
  const paddingFactor = Math.max(0.0001, options.paddingFactor);
  const scaleMultiplierX = Math.max(0.0001, options.scaleMultiplierX);
  const scaleMultiplierY = Math.max(0.0001, options.scaleMultiplierY);
  const scale = Math.min(
    (cellWidth * paddingFactor) / firstFrame.width,
    (cellHeight * paddingFactor) / firstFrame.height
  );
  animated.scale.set(scale * scaleMultiplierX, scale * scaleMultiplierY);

  return animated;
}

export type ObjectsGridOptions = {
  columns?: number;
  rows?: number;
  topPadding?: number;
  bottomPadding?: number;
  leftPadding?: number;
  rightPadding?: number;
  itemPaddingFactor?: number;
  itemScale?: number;
  itemScaleX?: number;
  itemScaleY?: number;
  itemScaleByObject?: Partial<Record<ObjectName, { x?: number; y?: number }>>;
  animationSpeed?: number;
  objectNames?: ObjectName[];
  slotHeight?: number;
};

export class ObjectsGrid {
  public container: PIXI.Container;

  private readonly columns: number;
  private readonly rows: number;
  private readonly topPadding: number;
  private readonly bottomPadding: number;
  private readonly leftPadding: number;
  private readonly rightPadding: number;
  private readonly itemPaddingFactor: number;
  private readonly itemScale: number;
  private readonly itemScaleX?: number;
  private readonly itemScaleY?: number;
  private readonly itemScaleByObject?: Partial<
    Record<ObjectName, { x?: number; y?: number }>
  >;
  private readonly animationSpeed: number;
  private readonly objectNames: ObjectName[];
  private readonly slotHeight?: number;

  constructor(private app: PIXI.Application, options: ObjectsGridOptions = {}) {
    this.container = new PIXI.Container();

    this.columns = options.columns ?? 4;
    this.rows = options.rows ?? 5;

    this.topPadding = options.topPadding ?? 80;
    this.bottomPadding = options.bottomPadding ?? 180;
    this.leftPadding = options.leftPadding ?? 80;
    this.rightPadding = options.rightPadding ?? 260;

    this.itemPaddingFactor = options.itemPaddingFactor ?? 0.8;
    this.itemScale = options.itemScale ?? 1;
    this.itemScaleX = options.itemScaleX;
    this.itemScaleY = options.itemScaleY;
    this.itemScaleByObject = options.itemScaleByObject;
    this.animationSpeed = options.animationSpeed ?? 0.25;

    this.objectNames = options.objectNames ?? DEFAULT_OBJECT_NAMES;
    this.slotHeight = options.slotHeight;
  }

  async populateRandom() {
    const gridWidth = Math.max(
      1,
      this.app.screen.width - this.leftPadding - this.rightPadding
    );
    const gridHeight = Math.max(
      1,
      this.app.screen.height - this.topPadding - this.bottomPadding
    );

    const cellWidth = gridWidth / this.columns;
    const cellHeight = gridHeight / this.rows;

    const totalCells = this.columns * this.rows;
    const unique = shuffleInPlace([...this.objectNames]);

    const picks: ObjectName[] = [];
    for (let i = 0; i < totalCells; i++) {
      if (i < unique.length) {
        picks.push(unique[i]);
      } else {
        const randomIndex = Math.floor(Math.random() * this.objectNames.length);
        picks.push(this.objectNames[randomIndex]);
      }
    }

    await Promise.all(Array.from(new Set(picks)).map((name) => getObjectFrames(name)));

    this.container.removeChildren();

    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.columns; col++) {
        const index = row * this.columns + col;
        const name = picks[index];

        const baseScaleX = this.itemScaleX ?? this.itemScale;
        const baseScaleY = this.itemScaleY ?? this.itemScale;
        const override = this.itemScaleByObject?.[name];
        const scaleX = baseScaleX * (override?.x ?? 1);
        const scaleY = baseScaleY * (override?.y ?? 1);

        const animated = await createObjectSprite(name, cellWidth, cellHeight, {
          paddingFactor: this.itemPaddingFactor,
          scaleMultiplierX: scaleX,
          scaleMultiplierY: scaleY,
          animationSpeed: this.animationSpeed,
        });
        animated.x = this.leftPadding + (col + 0.5) * cellWidth;
        animated.y = this.topPadding + (row + 0.5) * cellHeight;
        this.container.addChild(animated);
      }
    }
  }

  private getColumns(): PIXI.AnimatedSprite[][] {
    const cols: PIXI.AnimatedSprite[][] = Array.from(
      { length: this.columns },
      () => []
    );

    const gridWidth = Math.max(
      1,
      this.app.screen.width - this.leftPadding - this.rightPadding
    );
    const cellWidth = gridWidth / this.columns;

    this.container.children.forEach((child) => {
      const sprite = child as PIXI.AnimatedSprite;
      const col = Math.round(
        (sprite.x - this.leftPadding - cellWidth * 0.5) / cellWidth
      );
      const clamped = Math.max(0, Math.min(this.columns - 1, col));
      cols[clamped].push(sprite);
    });

    return cols;
  }

  spin(): Promise<void> {
    return new Promise((resolve) => {
      const columns = this.getColumns();
      const colCount = columns.length;
      let colsFinished = 0;

      const gridHeight =
        this.slotHeight ??
        Math.max(1, this.app.screen.height - this.topPadding - this.bottomPadding);
      const cellHeight = gridHeight / this.rows;

      columns.forEach((colSprites, colIndex) => {
        colSprites.sort((a, b) => a.y - b.y);

        const originalYs = colSprites.map((s) => s.y);
        const totalHeight = cellHeight * colSprites.length;

        const delaySec = colIndex * 0.12;
        const rampUpSec = 0.18;
        const steadySec = 1 + colIndex * 0.04;
        const rampDownSec = 0.70 + colIndex * 0.05;
        const settleSec = 0.22;

        const maxSpeedPxPerSec = cellHeight * 24;
        const blur = new PIXI.BlurFilter();
        blur.blurX = 0;
        blur.blurY = 0;

        colSprites.forEach((s) => {
          s.filters = [blur];
        });

        let elapsedSec = 0;
        let offset = 0;
        let settleStartOffset: number | null = null;
        let settleTargetOffset = 0;

        const onTick = (ticker: PIXI.Ticker) => {
          const dtSec = Math.min(0.05, ticker.deltaMS / 1000);
          elapsedSec += dtSec;

          if (elapsedSec < delaySec) return;

          const localSec = elapsedSec - delaySec;
          const tRampUp = clamp01(localSec / rampUpSec);
          const tSteady = localSec - rampUpSec;
          const tRampDown = localSec - rampUpSec - steadySec;
          const tSettle = localSec - rampUpSec - steadySec - rampDownSec;

          let speed = 0;

          if (tSteady < 0) {
            speed = lerp(0, maxSpeedPxPerSec, easeOutCubic(tRampUp));
          } else if (tRampDown < 0) {
            speed = maxSpeedPxPerSec;
          } else if (tSettle < 0) {
            const t = clamp01(tRampDown / rampDownSec);
            speed = lerp(maxSpeedPxPerSec, 0, easeInOutCubic(t));
          } else {
            if (settleStartOffset === null) {
              settleStartOffset = offset;
              settleTargetOffset = settleStartOffset > totalHeight / 2 ? totalHeight : 0;
            }

            const t = clamp01(tSettle / settleSec);
            offset =
              lerp(settleStartOffset, settleTargetOffset, easeOutBack(t)) % totalHeight;

            if (blur) {
              blur.blurY = lerp(6, 0, t);
            }

            colSprites.forEach((s, i) => {
              let y = originalYs[i] + offset;
              const maxY = originalYs[originalYs.length - 1] + cellHeight;
              if (y > maxY) y -= totalHeight;
              s.y = y;
            });

            if (t >= 1) {
              colSprites.forEach((s, i) => {
                s.y = originalYs[i];
                s.filters = null;
              });
              this.app.ticker.remove(onTick);
              colsFinished++;
              if (colsFinished === colCount) resolve();
            }
            return;
          }

          offset = (offset + speed * dtSec) % totalHeight;

          if (blur) {
            const normalized = Math.min(1, speed / (cellHeight * 18));
            blur.blurY = lerp(0, 6, normalized);
          }

          colSprites.forEach((s, i) => {
            let y = originalYs[i] + offset;
            const maxY = originalYs[originalYs.length - 1] + cellHeight;
            if (y > maxY) y -= totalHeight;
            s.y = y;
          });
        };

        this.app.ticker.add(onTick);
      });
    });
  }
  }
