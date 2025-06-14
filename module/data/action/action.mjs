import { abilities } from '../../config/actorConfig.mjs';
import { DHActionDiceData, DHDamageData, DHDamageField } from './actionDice.mjs';

const fields = foundry.data.fields;

/*
    ToDo
    - Apply ActiveEffect => Add to Chat message like Damage Button ?
    - Add Drag & Drop for documentUUID field (Macro & Summon)
    - Add optionnal Role for Healing ?
    - Handle Roll result as part of formula if needed
    - Target Check
    - Cost Check
    - Range Check
    - Area of effect and measurement placement
    - Auto use costs and action
*/

export class DHBaseAction extends foundry.abstract.DataModel {
    static defineSchema() {
        return {
            _id: new fields.DocumentIdField(),
            type: new fields.StringField({ initial: undefined, readonly: true, required: true }),
            name: new fields.StringField({ initial: undefined }),
            description: new fields.HTMLField(),
            img: new fields.FilePathField({ initial: undefined, categories: ['IMAGE'], base64: false }),
            actionType: new fields.StringField({ choices: SYSTEM.ITEM.actionTypes, initial: 'action', nullable: true }),
            cost: new fields.ArrayField(
                new fields.SchemaField({
                    type: new fields.StringField({
                        choices: SYSTEM.GENERAL.abilityCosts,
                        nullable: false,
                        required: true,
                        initial: 'hope'
                    }),
                    value: new fields.NumberField({ nullable: true, initial: 1 }),
                    scalable: new fields.BooleanField({ initial: false }),
                    step: new fields.NumberField({ nullable: true, initial: null })
                })
            ),
            uses: new fields.SchemaField({
                value: new fields.NumberField({ nullable: true, initial: null }),
                max: new fields.NumberField({ nullable: true, initial: null }),
                recovery: new fields.StringField({
                    choices: SYSTEM.GENERAL.refreshTypes,
                    initial: null,
                    nullable: true
                })
            }),
            range: new fields.StringField({
                choices: SYSTEM.GENERAL.range,
                required: true,
                blank: false,
                initial: 'self'
            })
        };
    }

    prepareData() {}

    get index() {
        return this.parent.actions.indexOf(this);
    }

    get item() {
        return this.parent.parent;
    }

    get actor() {
        return this.item?.actor;
    }

    get chatTemplate() {
        return 'systems/daggerheart/templates/chat/attack-roll.hbs';
    }

    static getRollType() {
        return 'ability';
    }

    static getSourceConfig(parent) {
        const updateSource = {};
        updateSource.img ??= parent?.img ?? parent?.system?.img;
        if (parent?.system?.trait) {
            updateSource['roll'] = {
                type: this.getRollType(),
                trait: parent.system.trait
            };
        }
        if (parent?.system?.range) {
            updateSource['range'] = parent?.system?.range;
        }
        return updateSource;
    }

    async use(event) {
        if(this.cost?.length) {
            const hasCost = await this.checkCost();
            if(!hasCost) return ui.notifications.warn("You don't have the resources to use that action.");
        }
        if(this.target?.type) {
            const hasTarget = await this.checkTarget();
        }
        if(this.range) {
            const hasRange = await this.checkRange();
        }
        if (this.roll.type && this.roll.trait) {
            const modifierValue = this.actor.system.traits[this.roll.trait].value;
            const config = {
                event: event,
                title: this.item.name,
                roll: {
                    modifier: modifierValue,
                    label: game.i18n.localize(abilities[this.roll.trait].label),
                    type: this.actionType,
                    difficulty: this.roll?.difficulty
                },
                chatMessage: {
                    template: this.chatTemplate
                }
            };
            if (this.target?.type) config.checkTarget = true;
            if (this.damage.parts.length) {
                config.damage = {
                    value: this.damage.parts.map(p => p.getFormula(this.actor)).join(' + '),
                    type: this.damage.parts[0].type
                };
            }
            if (this.effects.length) {
                // Apply Active Effects. In Chat Message ?
            }
            return this.actor.diceRoll(config);
        }
    }

    async checkCost() {
        if(!this.cost.length || !this.actor) return true;
        console.log(this.actor, this.cost)
        return this.cost.reduce((a, c) => a && this.actor.system.resources[c.type]?.value >= (c.value * (c.scalable ? c.step : 1)), true);
    }

    async checkTarget() {
        /* targets = Array.from(game.user.targets).map(x => {
            const target = {
                id: x.id,
                name: x.actor.name,
                img: x.actor.img,
                difficulty: x.actor.system.difficulty,
                evasion: x.actor.system.evasion?.value
            };

            target.hit = target.difficulty ? roll.total >= target.difficulty : roll.total >= target.evasion;

            return target;
        }); */
        const targets = targets = Array.from(game.user.targets).map(x => {
            return {
                id,
                name: this.actor.name,
                img: x.actor.img,
                difficulty: x.actor.system.difficulty,
                evasion: x.actor.system.evasion?.value
            }
        });
        console.log(this.target)
        if(this.target.type === SYSTEM.ACTIONS.targetTypes.self.id) return this.actor;
        if(this.target.amount) {

        }
    }
    
    async checkRange() {
        console.log(this.range)
    }
}

const tmpTargetObject = () => {

}

const extraDefineSchema = (field, option) => {
    return {
        [field]: {
            // damage: new fields.SchemaField({
            //     parts: new fields.ArrayField(new fields.EmbeddedDataField(DHDamageData))
            // }),
            damage: new DHDamageField(option),
            roll: new fields.SchemaField({
                type: new fields.StringField({ nullable: true, initial: null, choices: SYSTEM.GENERAL.rollTypes }),
                trait: new fields.StringField({ nullable: true, initial: null, choices: SYSTEM.ACTOR.abilities }),
                difficulty: new fields.NumberField({ nullable: true, initial: null, integer: true, min: 0 })
            }),
            target: new fields.SchemaField({
                type: new fields.StringField({
                    choices: SYSTEM.ACTIONS.targetTypes,
                    initial: SYSTEM.ACTIONS.targetTypes.any.id,
                    nullable: true, initial: null
                }),
                amount: new fields.NumberField({ nullable: true, initial: null, integer: true, min: 0 })
            }),
            effects: new fields.ArrayField( // ActiveEffect
                new fields.SchemaField({
                    _id: new fields.DocumentIdField()
                })
            )
        }[field]
    };
};

export class DHAttackAction extends DHBaseAction {
    static defineSchema() {
        return {
            ...super.defineSchema(),
            ...extraDefineSchema('damage', true),
            ...extraDefineSchema('roll'),
            ...extraDefineSchema('target'),
            ...extraDefineSchema('effects')
        };
    }

    static getRollType() {
        return 'weapon';
    }

    prepareData() {
        super.prepareData();
        if (this.damage.includeBase && !!this.item?.system?.damage) {
            const baseDamage = this.getParentDamage();
            this.damage.parts.unshift(new DHDamageData(baseDamage));
        }
    }

    getParentDamage() {
        return {
            multiplier: 'proficiency',
            dice: this.item?.system?.damage.value,
            bonus: this.item?.system?.damage.bonus ?? 0,
            type: this.item?.system?.damage.type,
            base: true
        };
    }

    // Temporary until full formula parser
    // getDamageFormula() {
    //     return this.damage.parts.map(p => p.formula).join(' + ');
    // }
}

export class DHSpellCastAction extends DHBaseAction {
    static defineSchema() {
        return {
            ...super.defineSchema(),
            ...extraDefineSchema('damage'),
            ...extraDefineSchema('roll'),
            ...extraDefineSchema('target'),
            ...extraDefineSchema('effects')
        };
    }

    static getRollType() {
        return 'spellcast';
    }
}

export class DHDamageAction extends DHBaseAction {
    static defineSchema() {
        return {
            ...super.defineSchema(),
            ...extraDefineSchema('damage', false),
            ...extraDefineSchema('target'),
            ...extraDefineSchema('effects')
        };
    }

    async use(event) {
        const formula = this.damage.parts.map(p => p.getFormula(this.actor)).join(' + ');
        if (!formula || formula == '') return;

        let roll = { formula: formula, total: formula };
        if (isNaN(formula)) {
            roll = await new Roll(formula).evaluate();
        }

        const cls = getDocumentClass('ChatMessage');
        const msg = new cls({
            user: game.user.id,
            content: await foundry.applications.handlebars.renderTemplate(
                'systems/daggerheart/templates/chat/damage-roll.hbs',
                {
                    roll: roll.formula,
                    total: roll.total,
                    type: this.damage.parts.map(p => p.type)
                }
            )
        });

        cls.create(msg.toObject());
    }
}

export class DHHealingAction extends DHBaseAction {
    static defineSchema() {
        return {
            ...super.defineSchema(),
            healing: new fields.SchemaField({
                type: new fields.StringField({
                    choices: SYSTEM.GENERAL.healingTypes,
                    required: true,
                    blank: false,
                    initial: SYSTEM.GENERAL.healingTypes.health.id,
                    label: 'Healing'
                }),
                value: new fields.EmbeddedDataField(DHActionDiceData)
            }),
            ...extraDefineSchema('target'),
            ...extraDefineSchema('effects')
        };
    }

    async use(event) {
        const formula = this.healing.value.getFormula(this.actor);
        if (!formula || formula == '') return;

        // const roll = await super.use(event);
        let roll = { formula: formula, total: formula };
        if (isNaN(formula)) {
            roll = await new Roll(formula).evaluate();
        }

        const cls = getDocumentClass('ChatMessage');
        const msg = new cls({
            user: game.user.id,
            content: await foundry.applications.handlebars.renderTemplate(
                'systems/daggerheart/templates/chat/healing-roll.hbs',
                {
                    roll: roll.formula,
                    total: roll.total,
                    type: this.healing.type
                }
            )
        });

        cls.create(msg.toObject());
    }

    get chatTemplate() {
        return 'systems/daggerheart/templates/chat/healing-roll.hbs';
    }
}

export class DHResourceAction extends DHBaseAction {
    static defineSchema() {
        return {
            ...super.defineSchema(),
            // ...extraDefineSchema('roll'),
            ...extraDefineSchema('target'),
            ...extraDefineSchema('effects'),
            resource: new fields.SchemaField({
                type: new fields.StringField({
                    choices: [],
                    blank: true,
                    required: false,
                    initial: '',
                    label: 'Resource'
                }),
                value: new fields.NumberField({ initial: 0, label: 'Value' })
            })
        };
    }
}

export class DHSummonAction extends DHBaseAction {
    static defineSchema() {
        return {
            ...super.defineSchema(),
            documentUUID: new fields.StringField({ blank: true, initial: '', placeholder: 'Enter a Creature UUID' })
        };
    }
}

export class DHEffectAction extends DHBaseAction {
    static defineSchema() {
        return {
            ...super.defineSchema(),
            ...extraDefineSchema('effects')
        };
    }
}

export class DHMacroAction extends DHBaseAction {
    static defineSchema() {
        return {
            ...super.defineSchema(),
            documentUUID: new fields.StringField({ blank: true, initial: '', placeholder: 'Enter a macro UUID' })
        };
    }

    async use(event) {
        const fixUUID = !this.documentUUID.includes('Macro.') ? `Macro.${this.documentUUID}` : this.documentUUID,
            macro = await fromUuid(fixUUID);
        try {
            if (!macro) throw new Error(`No macro found for the UUID: ${this.documentUUID}.`);
            macro.execute();
        } catch (error) {
            ui.notifications.error(error);
        }
    }
}
