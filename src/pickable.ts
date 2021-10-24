import { game } from ".";
import Actor from "./actor";
import { TemporaryAI } from "./ai";
import { ensure } from "./utils";

export enum SelectorType {
  NONE,
  CLOSEST_MONSTER,
  SELECTED_MONSTER,
  WEARER_RANGE,
  SELECTED_RANGE,
}

export class TargetSelector {
  type: SelectorType;
  range: number;

  constructor(type: SelectorType, range: number) {
    this.type = type;
    this.range = range;
  }

  async selectTargets(wearer: Actor, listOfActors: Actor[]) {
    const handleSelectRange = async () => {
      const [isOnRange, tileX, tileY] = await game.pickATile(
        wearer.x,
        wearer.y,
      );

      if (isOnRange === undefined || isOnRange === false) {
        return;
      }

      const actor = game.getActor(tileX as number, tileY as number);

      if (
        actor &&
        actor.destructible &&
        !actor.destructible.isDead() &&
        actor.getDistance(tileX as number, tileY as number) <= this.range
      ) {
        listOfActors.push(actor);
      }
    };

    const handleSelectClosestMonster = () => {
      const actor: any = game.getClosestMonster(wearer.x, wearer.y, this.range);
      listOfActors.push(actor);
    };

    const handleSelectedMonster = async () => {
      const [isOnRange, tileX, tileY] = await game.pickATile(
        wearer.x,
        wearer.y,
      );
      if (isOnRange === false) {
        return;
      }

      const actor = game.getActor(tileX as number, tileY as number);
      if (actor) {
        listOfActors.push(actor);
      }
    };

    const handleWearerRange = () => {
      for (const actor of game.actors) {
        if (
          actor != wearer &&
          actor.destructible &&
          !actor.destructible.isDead() &&
          actor.getDistance(wearer.x, wearer.y) <= this.range
        ) {
          listOfActors.push(actor);
        }
      }
    };

    switch (this.type) {
      case SelectorType.CLOSEST_MONSTER:
        handleSelectClosestMonster();
        break;
      case SelectorType.SELECTED_MONSTER:
        await handleSelectedMonster();
        break;
      case SelectorType.WEARER_RANGE:
        handleWearerRange();
        break;
      case SelectorType.SELECTED_RANGE:
        await handleSelectRange();
        break;
      default:
        console.error(`Error with selectorType: ${this.type}`);
        break;
    }
    if (listOfActors.length === 0) {
      game.log.add("No enemy is close enough");
    }
  }
}

export class Effect {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  applyTo(actor: Actor): boolean {
    ensure(actor);
    return false;
  }
}

export class HealthEffect extends Effect {
  amount = 0;
  message: any;

  constructor(amount: number, message: string | void) {
    super();
    this.amount = amount;
    this.message = message;
  }

  applyTo(actor: Actor): boolean {
    if (!actor || !actor.destructible) return false;

    if (this.amount > 0) {
      //healing part
      const pointsHealed = actor.destructible.heal(this.amount);
      if (pointsHealed > 0) {
        if (this.message) {
          game.log.add(this.message, "#AAA");
        }
        return true;
      }
    } else {
      //hurting part
      if (this.message && -this.amount - actor.destructible.defense > 0) {
        game.log.add(this.message, "#AAA");
      }
      if (actor.destructible.takeDamage(actor, -this.amount) > 0) {
        return true;
      }
    }

    return false;
  }
}

export class AiChangeEffect extends Effect {
  message: string;
  newAi: TemporaryAI;

  constructor(newAi: TemporaryAI, message: string) {
    super();
    this.message = message;
    this.newAi = newAi;
  }

  applyTo(actor: Actor): boolean {
    this.newAi.applyTo(actor);
    if (this.message) {
      game.log.add(this.message);
    }
    return true;
  }
}

export default class Pickable {
  selector?: TargetSelector | any;
  effect: Effect | HealthEffect | AiChangeEffect | TemporaryAI | any;
  selectorName?: string;
  effectName?: string;
  constructor(
    selector: TargetSelector | void,
    effect: HealthEffect | AiChangeEffect | void,
  ) {
    this.selector = selector;
    this.effect = effect;
    if (this.selector !== undefined) {
      this.selectorName = this.selector.constructor.name;
    }
    if (this.effect !== undefined)
      this.effectName = this.effect.constructor.name;
  }

  pick(owner: Actor, wearer: Actor): boolean {
    if (wearer.container && wearer.container.add(owner)) {
      game.removeActor(owner);
      return true;
    }
    return false;
  }

  async use(owner: Actor, wearer: Actor) {
    game.log.add(`You use a ${owner.name}`);

    const actorList = Array<Actor>();

    if (this.selector) {
      //console.log("1");
      await this.selector.selectTargets(wearer, actorList);
    } else {
      //console.log("2");
      actorList.push(wearer);
    }

    let succeed = false;
    for (const actor of actorList) {
      if (this.effect?.applyTo(actor)) {
        succeed = true;
      }
    }

    if (succeed) {
      if (wearer.container) {
        wearer.container.remove(owner);
      }
    }

    return succeed;
  }

  drop(owner: Actor, wearer: Actor) {
    if (wearer.container) {
      wearer.container.remove(owner);
      game.actors.push(owner);
      game.sendToBack(owner);
      owner.x = wearer.x;
      owner.y = wearer.y;
      game.log.add(`${wearer.name} drops a ${owner.name}`);
    }
  }
}