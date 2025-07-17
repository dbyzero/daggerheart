const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export default class BeastformDialog extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(configData) {
        super();

        this.configData = configData;
        this.selected = null;
    }

    static DEFAULT_OPTIONS = {
        tag: 'form',
        classes: ['daggerheart', 'views', 'dh-style', 'beastform-selection'],
        position: {
            width: 600,
            height: 'auto'
        },
        actions: {
            selectBeastform: this.selectBeastform,
            submitBeastform: this.submitBeastform
        },
        form: {
            handler: this.updateBeastform,
            submitOnChange: true,
            submitOnClose: false
        }
    };

    get title() {
        return game.i18n.localize('DAGGERHEART.ITEMS.Beastform.dialogTitle');
    }

    /** @override */
    static PARTS = {
        beastform: {
            template: 'systems/daggerheart/templates/dialogs/beastformDialog.hbs'
        }
    };

    // _attachPartListeners(partId, htmlElement, options) {
    //     super._attachPartListeners(partId, htmlElement, options);

    //     htmlElement.querySelector('');
    // }

    async _prepareContext(_options) {
        const context = await super._prepareContext(_options);

        context.beastformTiers = game.items.reduce((acc, x) => {
            const tier = CONFIG.DH.GENERAL.tiers[x.system.tier];
            if (x.type !== 'beastform' || tier.value > this.configData.tierLimit) return acc;

            if (!acc[tier.value]) acc[tier.value] = { label: game.i18n.localize(tier.label), values: {} };
            acc[tier.value].values[x.uuid] = { selected: this.selected == x.uuid, value: x };

            return acc;
        }, {}); // Also get from compendium when added
        context.canSubmit = this.selected;

        return context;
    }

    static updateBeastform(event, _, formData) {
        this.selected = foundry.utils.mergeObject(this.selected, formData.object);

        this.render();
    }

    static async selectBeastform(_, target) {
        this.selected = this.selected === target.dataset.uuid ? null : target.dataset.uuid;
        const beastform = this.selected ? await foundry.utils.fromUuid(this.selected) : null;
        if (beastform && beastform.system.beastformType !== CONFIG.DH.ITEM.beastformTypes.normal.id) {
            this.element.classList.add('expanded');
        } else {
            this.element.classList.remove('expanded');
        }

        this.render();
    }

    static async submitBeastform() {
        await this.close({ submitted: true });
    }

    /** @override */
    _onClose(options = {}) {
        if (!options.submitted) this.config = false;
    }

    static async configure(configData) {
        return new Promise(resolve => {
            const app = new this(configData);
            app.addEventListener('close', () => resolve(app.selected), { once: true });
            app.render({ force: true });
        });
    }
}
