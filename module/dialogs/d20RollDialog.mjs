const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export default class D20RollDialog extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(config={}, options={}) {
        super(options);

        this.config = config;
        this.config.experiences = [];
        
        this.item = config.actor.parent.items.get(config.source.item);
        this.action = this.item.system.actions.find(a => a._id === config.source.action);
    }

    static DEFAULT_OPTIONS = {
        tag: 'form',
        id: 'roll-selection',
        classes: ['daggerheart', 'views', 'roll-selection'],
        position: {
            width: 400,
            height: 'auto'
        },
        actions: {
            updateIsAdvantage: this.updateIsAdvantage,
            selectExperience: this.selectExperience,
            submitRoll: this.submitRoll
        },
        form: {
            handler: this.updateRollConfiguration,
            submitOnChange: true,
            submitOnClose: false
        }
    };

    /** @override */
    static PARTS = {
        costSelection: {
            id: 'costSelection',
            template: 'systems/daggerheart/templates/views/costSelection.hbs'
        },
        rollSelection: {
            id: 'rollSelection',
            template: 'systems/daggerheart/templates/views/rollSelection.hbs'
        }
    };

    async _prepareContext(_options) {
        const context = await super._prepareContext(_options);
        context.experiences = Object.keys(this.config.actor.experiences).map(id => ({ id, ...this.config.actor.experiences[id] }));
        context.selectedExperiences = this.config.experiences;
        context.advantage = this.config.advantage;
        /* context.diceOptions = this.diceOptions; */
        context.canRoll = true;
        if(this.config.costs?.length) {
            const updatedCosts = this.action.calcCosts(this.config.costs);
            context.costs = updatedCosts
            context.canRoll = this.action.getRealCosts(updatedCosts)?.hasCost;
        }
        return context;
    }

    static updateRollConfiguration(event, _, formData) {
        const { ...rest } = foundry.utils.expandObject(formData.object);
        console.log(formData.object, rest)
        this.config.costs = foundry.utils.mergeObject(this.config.costs, rest.costs);
        this.render();
    }

    static updateIsAdvantage(_, button) {
        const advantage = Number(button.dataset.advantage);
        this.config.advantage = this.config.advantage === advantage ? 0 : advantage;
        this.render();
    }

    static selectExperience(_, button) {
        if (this.config.experiences.find(x => x === button.dataset.key)) {
            this.config.experiences = this.config.experiences.filter(x => x !== button.dataset.key);
        } else {
            this.config.experiences = [...this.config.experiences, button.dataset.key];
        }
        this.render();
    }

    static async submitRoll() {
        await this.close({ submitted: true  });
    }

    /** @override */
    _onClose(options={}) {
        if ( !options.submitted ) this.config = false;
    }

    static async configure(config={}) {
        return new Promise(resolve => {
            const app = new this(config);
            app.addEventListener("close", () => resolve(app.config), { once: true });
            app.render({ force: true });
        });
    }
}