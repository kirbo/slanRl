import { game } from ".";
import Actor from "./actor";
import { ArmorType } from "./armor";
import { Colors } from "./colors";
import { SelectorType } from "./pickable";
import { ensure } from "./utils";

export default class Container {
  size: number;
  inventory: Actor[];

  constructor(size: number) {
    this.size = size; //maximum number of actors
    this.inventory = [];
  }

  add(actor: Actor): boolean {
    if (this.size > 0 && this.inventory.length >= this.size) {
      //inventory is full
      return false;
    } else {
      this.inventory.push(actor);
      return true;
    }
  }

  remove(actor: Actor) {
    for (let i = 0; i < this.inventory.length; i++) {
      if (this.inventory[i] === actor) {
        this.inventory.splice(i, 1);
        return;
      }
    }
  }

  renderMenuBackground(props: {
    title: string;
    x: number;
    y: number;
    w: number;
    h: number;
  }) {
    for (let yy = 0; yy < props.h; yy++) {
      for (let xx = 0; xx < props.w; xx++) {
        if ((yy === 0 || yy === props.h - 1) && xx > 0 && xx < props.w - 1)
          game.drawChar("-", xx + props.x, yy + props.y, Colors.MENU_BORDER);
        else if ((xx === 0 || xx === props.w - 1) && yy > 0 && yy < props.h - 1)
          game.drawChar("|", xx + props.x, yy + props.y, Colors.MENU_BORDER);
        else if (
          yy === 0 ||
          xx === 0 ||
          yy === props.h - 1 ||
          xx === props.w - 1
        )
          game.drawChar("+", xx + props.x, yy + props.y, Colors.MENU_BORDER);
        else game.drawChar(" ", xx + props.x, yy + props.y, Colors.MENU_BORDER);
      }
    }

    //game.drawText(" INVENTORY ", 34, 0);
    for (let i = 0; i < props.title.length; i++) {
      game.drawChar(
        props.title.charAt(i),
        props.x + props.w / 2 - props.title.length / 2 + i,
        props.y,
        Colors.DEFAULT_TEXT,
      );
    }
  }

  render() {
    this.renderMenuBackground({
      title: "INVENTORY",
      x: 15,
      y: 4,
      w: 45,
      h: 30,
    });

    let shortcut = "a";
    let i = 0;
    const menuStartY = 6;
    for (const it of this.inventory) {
      game.drawText(shortcut + ") " + it.name, 16, menuStartY + i);
      const weight = ensure(it.pickable).weight;
      game.drawText(`${weight} lb`, 54, menuStartY + i);
      shortcut = String.fromCharCode(shortcut.charCodeAt(0) + 1);

      let propertiesText = "";
      if (it.armor) {
        if (it.armor.armorType === ArmorType.SHIELD)
          propertiesText = `AC: ${it.armor.armorClass}, shield`;
        if (it.armor.armorType === ArmorType.LIGHT_ARMOR)
          propertiesText = `AC: ${it.armor.armorClass}, light armor`;
        if (it.armor.armorType === ArmorType.MEDIUM_ARMOR)
          propertiesText = `AC: ${it.armor.armorClass}, medium armor`;
        if (it.armor.armorType === ArmorType.HEAVY_ARMOR)
          propertiesText = `AC: ${it.armor.armorClass}, heavy armor`;
      }

      if (it.pickable?.effect) {
        let effectText = "";

        if (it.pickable.effectName === "HealthEffect") {
          if (it.pickable.effect.amount > 0) {
            effectText = `healing: ${Math.abs(it.pickable.effect.amount)}`;
          } else {
            effectText = `damage: ${Math.abs(it.pickable.effect.amount)}`;
          }
        }
        if (it.pickable.effectName === "AiChangeEffect") {
          effectText = `confused ${it.pickable.effect.newAi.nbTurns} turns`;
        }

        if (it.name === "scroll of map") {
          effectText = "Reveal current map";
        }

        propertiesText += `${effectText}`;

        if (it.pickable?.selector) {
          propertiesText += ", ";
        }
      }

      if (it.pickable?.selector) {
        let selectorText = "";
        const range = it.pickable.selector.range;

        if (it.pickable.selector.type === SelectorType.CLOSEST_MONSTER)
          selectorText = "closest enemy";
        if (it.pickable.selector.type === SelectorType.SELECTED_MONSTER)
          selectorText = "selected monster";
        if (it.pickable.selector.type === SelectorType.SELECTED_RANGE)
          selectorText = "selected range";
        if (it.pickable.selector.type === SelectorType.WEARER_RANGE)
          selectorText = "wearer range";

        propertiesText += `${selectorText}, range: ${range}`;
      }

      game.drawText(`${propertiesText}`, 30, menuStartY + i);

      i++;
    }
  }
}
