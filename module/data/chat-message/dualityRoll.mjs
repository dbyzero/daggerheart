import { DualityRollColor } from '../settings/Appearance.mjs';

const fields = foundry.data.fields;
const diceField = () =>
    new fields.SchemaField({
        dice: new fields.StringField({}),
        value: new fields.NumberField({ integer: true })
    });

export default class DHDualityRoll extends foundry.abstract.TypeDataModel {
    static dualityResult = {
        hope: 1,
        fear: 2,
        critical: 3
    };

    static defineSchema() {
        return {
            title: new fields.StringField(),
            /* origin: new fields.StringField({ required: true }), */
            roll: new fields.DataField({}),
            /* modifiers: new fields.ArrayField(
                new fields.SchemaField({
                    value: new fields.NumberField({ integer: true }),
                    label: new fields.StringField({})
                })
            ), */
            /* hope: diceField(),
            fear: diceField(),
            advantageState: new fields.BooleanField({ nullable: true, initial: null }), */
            /* advantage: diceField(), */
            targets: new fields.ArrayField(
                new fields.SchemaField({
                    id: new fields.StringField({}),
                    name: new fields.StringField({}),
                    img: new fields.StringField({}),
                    difficulty: new fields.NumberField({ integer: true, nullable: true }),
                    evasion: new fields.NumberField({ integer: true }),
                    hit: new fields.BooleanField({ initial: false })
                })
            ),
            hasDamage: new fields.BooleanField({ initial: false }),
            hasEffect: new fields.BooleanField({ initial: false }),
            source: new fields.SchemaField({
                actor: new fields.StringField(),
                item: new fields.StringField(),
                action: new fields.StringField()
            })
        };
    }

    /* get diceTotal() {
        return this.hope.value + this.fear.value;
    }

    get modifierTotal() {
        const total = this.modifiers.reduce((acc, x) => acc + x.value, 0);
        return {
            value: total,
            label: total > 0 ? `+${total}` : total < 0 ? `${total}` : ''
        };
    }

    get dualityResult() {
        return this.hope.value > this.fear.value
            ? this.constructor.dualityResult.hope
            : this.fear.value > this.hope.value
              ? this.constructor.dualityResult.fear
              : this.constructor.dualityResult.critical;
    }

    get totalLabel() {
        const label =
            this.hope.value > this.fear.value
                ? 'DAGGERHEART.General.Hope'
                : this.fear.value > this.hope.value
                  ? 'DAGGERHEART.General.Fear'
                  : 'DAGGERHEART.General.CriticalSuccess';

        return game.i18n.localize(label);
    }

    get colorful() {
        return (
            game.settings.get(SYSTEM.id, SYSTEM.SETTINGS.gameSettings.appearance).dualityColorScheme ===
            DualityRollColor.colorful.value
        );
    }

    prepareDerivedData() {
        this.hope.discarded = this.hope.value < this.fear.value;
        this.fear.discarded = this.fear.value < this.hope.value;
    } */
}
