import * as PIXI from 'pixi.js';

export type WinType ='BigWin' | 'MegaWin' | 'SuperWin' | 'TotalWin';

export interface WinSequenceConfig {
  frames: PIXI.Texture[];
  type: WinType;
}

export class WinAnimation {
  public sprite: PIXI.AnimatedSprite;
  private sequences: WinSequenceConfig[] = [];
  private currentIndex: number = 0;

  constructor(app: PIXI.Application, scale: number = 1) {
    // Inicializa com frames vazios — serão trocados na hora de tocar
    this.sprite = new PIXI.AnimatedSprite([PIXI.Texture.EMPTY]);
    this.sprite.anchor.set(0.5);
    this.sprite.x = app.screen.width / 2;
    this.sprite.y = app.screen.height / 2;
    this.sprite.scale.set(Math.max(0.0001, scale));
    this.sprite.animationSpeed = 0.5;
    this.sprite.loop = false;
  }

  /** Registra as sequências em ordem crescente de win */
  setSequences(sequences: WinSequenceConfig[]) {
    this.sequences = sequences;
  }

  /**
   * Toca todas as sequências em ordem.
   * @param upTo - toca até esse tipo (inclusive). Se omitido, toca todas.
   * @param onComplete - chamado quando a última sequência terminar.
   */
  playSequence(upTo: WinType = 'TotalWin', onComplete?: () => void) {
    const order: WinType[] = ['BigWin', 'MegaWin', 'SuperWin', 'TotalWin'];
    const maxIndex = order.indexOf(upTo);

    const toPlay = this.sequences.filter((s) => {
      const idx = order.indexOf(s.type);
      return idx !== -1 && idx <= maxIndex;
    });

    if (toPlay.length === 0) {
      onComplete?.();
      return;
    }

    this.currentIndex = 0;
    this._playNext(toPlay, onComplete);
  }

  private _playNext(queue: WinSequenceConfig[], onComplete?: () => void) {
    if (this.currentIndex >= queue.length) {
      onComplete?.();
      return;
    }

    const current = queue[this.currentIndex];

    // Troca os frames do sprite sem recriar o objeto
    this.sprite.textures = current.frames;
    this.sprite.onComplete = () => {
      this.currentIndex++;
      this._playNext(queue, onComplete);
    };
    this.sprite.gotoAndPlay(0);
  }

  stop() {
    this.sprite.stop();
    this.sprite.onComplete = undefined;
  }
}