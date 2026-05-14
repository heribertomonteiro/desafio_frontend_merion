import * as PIXI from 'pixi.js';

export type MoneyDisplayOptions = {
  balance?: number;
  bet?: number;
};

export class MoneyDisplay {
  public container: PIXI.Container;

  private balanceLabel: PIXI.Text;
  private winLabel: PIXI.Text;
  private betLabel: PIXI.Text;

  private balance: number;
  private readonly bet: number;

  constructor(options: MoneyDisplayOptions = {}) {
    this.container = new PIXI.Container();

    this.balance = options.balance ?? 4000;
    this.bet = options.bet ?? 100;

    const gradient = new PIXI.FillGradient({
        type: 'linear',
        start: { x: 0, y: 0 },
        end: { x: 0, y: 1 },
        colorStops: [
            { offset: 0, color: 0xFFFFFF },
            { offset: 0.5, color: 0x00FF00 },
            { offset: 1, color: 0x006600 },
        ],
    });

    const textStyle = new PIXI.TextStyle({
      fill: gradient,
      fontSize: 32,
      fontWeight: 'bold',
      fontFamily: 'Russo One',
      stroke: { color: '#003300', width: 3 },
    });

    this.balanceLabel = new PIXI.Text(`$${this.balance.toLocaleString()}`, textStyle);
    this.balanceLabel.anchor.set(0.5);
    this.balanceLabel.scale.set(0.5);
    this.balanceLabel.position.set(233, 502);

    this.winLabel = new PIXI.Text('$ 0', textStyle);
    this.winLabel.anchor.set(0.5);
    this.winLabel.position.set(355, 502);
    this.winLabel.scale.set(0.5);

    this.betLabel = new PIXI.Text(`$ ${this.bet}`, textStyle);
    this.betLabel.anchor.set(0.5);
    this.betLabel.scale.set(0.5);
    this.betLabel.position.set(464, 502);
    
    this.container.addChild(this.balanceLabel);
    this.container.addChild(this.winLabel);
    this.container.addChild(this.betLabel);

    this.balanceLabel.text = `$ ${this.balance.toLocaleString()}`;
    this.winLabel.text = '$ 0';
    this.betLabel.text = `$ ${this.bet}`;
  }

  deductBet() {
    this.balance = Math.max(0, this.balance - this.bet);
    this.balanceLabel.text = `$ ${this.balance.toLocaleString()}`;
  }

  addWin(amount: number) {
    this.balance += amount;
    this.winLabel.text = `$ ${amount.toLocaleString()}`;
    this.balanceLabel.text = `$ ${this.balance.toLocaleString()}`;
  }

  resetWin() {
    this.winLabel.text = '$ 0';
  }
}