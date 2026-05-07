import * as PIXI from 'pixi.js';

type ButtonOptions = {
  x: number;
  y: number;
  width?: number;
  height?: number;
  text?: string;
  onClick?: () => void;
};

export class Button {
  public container: PIXI.Container;

  constructor(options: ButtonOptions) {
    this.container = new PIXI.Container();

    const bg = new PIXI.Graphics();
    bg.roundRect(0, 0, options.width ?? 50, options.height ?? 60, 400);
    bg.fill(0xffcc00);

    bg.eventMode = 'static';
    bg.cursor = 'pointer';

    // clique
    bg.on('pointerdown', () => {
      options.onClick?.();
    });

    // hover
    bg.on('pointerover', () => {
      bg.scale.set(1.05);
    });

    bg.on('pointerout', () => {
      bg.scale.set(1);
    });

    this.container.addChild(bg);

    // texto
    if (options.text) {
      const label = new PIXI.Text(options.text, {
        fill: '#000',
        fontSize: 20,
        fontWeight: 'bold',
      });

      label.anchor.set(0.5);
      label.x = (options.width ?? 150) / 2;
      label.y = (options.height ?? 60) / 2;

      this.container.addChild(label);
    }

    this.container.x = options.x;
    this.container.y = options.y;
  }
}