import * as PIXI from 'pixi.js';

export class Character {
  public sprite: PIXI.AnimatedSprite;

  private idleFrames: PIXI.Texture[];
  private winFrames: PIXI.Texture[];

  constructor(
    idleFrames: PIXI.Texture[],
    winFrames: PIXI.Texture[],
    app: PIXI.Application,
    scale: number = 1,
    animationSpeed: number = 0.2
  ) {
    this.idleFrames = idleFrames;
    this.winFrames = winFrames;

    this.sprite = new PIXI.AnimatedSprite(this.idleFrames);

    this.sprite.anchor.set(0.5);
    this.sprite.x = app.screen.width - 80;
    this.sprite.y = app.screen.height - 230;

    this.setAnimationSpeed(animationSpeed);
    this.sprite.loop = true;

    this.sprite.play();

    this.setScale(scale);
  }

  setScale(scale: number) {
    const clampedScale = Math.max(0.0001, scale);

    this.sprite.scale.set(clampedScale);
    this.sprite.scale.x *= -1;
  }

  setAnimationSpeed(animationSpeed: number) {
    this.sprite.animationSpeed = Math.max(0, animationSpeed);
  }

  playWin() {
    this.sprite.textures = this.winFrames;
    this.sprite.loop = false;
    this.sprite.gotoAndPlay(0);

    this.sprite.onComplete = () => {
      this.playIdle();
    };
  }

  playIdle() {
    this.sprite.textures = this.idleFrames;
    this.sprite.loop = true;
    this.sprite.gotoAndPlay(0);
  }
}