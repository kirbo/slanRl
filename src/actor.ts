import { game } from '.';
import { ConfusedAI, MonsterAI, PlayerAI } from './ai';
import Attacker from './attacker';
import Container from './container';
import Destructible, { Character, Color, Name } from './destructible';
import Fov from './fov';
import {
  Confuser,
  Fireball,
  Healer,
  LightningBolt,
  PickableType,
} from './pickable';

export type AiType = PlayerAI | MonsterAI | ConfusedAI;

export type X = number;
export type Y = number;

export default class Actor {
  ai?: PlayerAI | MonsterAI | ConfusedAI;
  attacker?: Attacker;
  blocks = true;
  ch: Character;
  color: Color;
  container?: Container;
  destructible?: Destructible;
  fov?: Fov;
  fovOnly = true;
  name: Name;
  pickable?: PickableType;
  x: X;
  y: Y;

  constructor(x: X, y: Y, ch: Character, name: Name, color: Color) {
    this.x = x;
    this.y = y;
    this.ch = ch;
    this.name = name;
    this.color = color;
  }

  create(actorTemplate: Actor) {
    if (!actorTemplate.pickable?.type) {
      return;
    }
    const { pickable } = actorTemplate;

    switch (pickable.type) {
      case 'lightingBolt':
        this.pickable = new LightningBolt(pickable.range, pickable.damage);
        break;
      case 'fireBall':
        this.pickable = new Fireball(pickable.range, pickable.damage);
        break;
      case 'healer':
        this.pickable = new Healer(pickable.amount);
        break;
      case 'confuser':
        this.pickable = new Confuser(pickable.nbTurns, pickable.range);
        break;
      default:
        break;
    }
  }

  render() {
    const fovValue = game.player?.fov?.getMapped(this.x, this.y);
    if (fovValue === 2 || (fovValue != 0 && !this.fovOnly)) {
      game.drawChar(this.ch, this.x, this.y, this.color);
    }
  }

  async update() {
    if (this.ai) {
      await this.ai.update(this);
    }
  }

  computeFov() {
    if (this.fov) {
      this.fov.compute(this.x, this.y, 10);
    }
  }

  getDistance(x: X, y: Y) {
    const dx = this.x - x;
    const dy = this.y - y;
    return Math.sqrt(dx * dx + dy * dy);
  }
}