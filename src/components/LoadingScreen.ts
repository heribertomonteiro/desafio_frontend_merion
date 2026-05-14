import * as PIXI from 'pixi.js';

export class LoadingScreen {
  public readonly container: PIXI.Container;

  private readonly app: PIXI.Application;
  private readonly loadingBaseText: string;
  private readonly label: PIXI.Text;

  private dots = 0;
  private elapsedMs = 0;
  private readonly tick: () => void;

  constructor(app: PIXI.Application, options?: { text?: string }) {
    this.app = app;
    this.loadingBaseText = options?.text ?? 'Carregando';

    this.container = new PIXI.Container();
    this.container.eventMode = 'none';

    const bg = new PIXI.Graphics();
    bg.rect(0, 0, app.screen.width, app.screen.height);
    bg.fill({ color: 0x0b1020, alpha: 1 });
    bg.eventMode = 'none';
    this.container.addChild(bg);

    this.label = new PIXI.Text(this.loadingBaseText, {
      fill: '#fff',
      fontSize: 60,
      fontWeight: 'bold',
    });
    this.label.anchor.set(0.5);
    this.label.scale.set(0.5);
    this.label.position.set(app.screen.width / 2, app.screen.height / 2);
    this.container.addChild(this.label);

    this.tick = () => {
      this.elapsedMs += this.app.ticker.deltaMS;
      if (this.elapsedMs < 250) return;

      this.elapsedMs = 0;
      this.dots = (this.dots + 1) % 4;
      this.label.text = this.loadingBaseText + '.'.repeat(this.dots);
    };
  }

  show(parent?: PIXI.Container) {
    const target = parent ?? this.app.stage;
    if (!this.container.parent) target.addChild(this.container);
    this.container.visible = true;

    this.app.ticker.remove(this.tick);
    this.app.ticker.add(this.tick);
  }

  hide() {
    this.app.ticker.remove(this.tick);
    this.container.removeFromParent();
    this.container.visible = false;
  }
}
