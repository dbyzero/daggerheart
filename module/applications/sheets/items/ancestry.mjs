import DHHeritageSheet from '../api/heritage-sheet.mjs';

export default class AncestrySheet extends DHHeritageSheet {
    /**@inheritdoc */
    static DEFAULT_OPTIONS = {
        classes: ['ancestry'],
        actions: {
            editFeature: AncestrySheet.#editFeature
        },
        dragDrop: [{ dragSelector: null, dropSelector: '.tab.features .drop-section' }]
    };

    /**@inheritdoc */
    static PARTS = {
        header: { template: 'systems/daggerheart/templates/sheets/items/ancestry/header.hbs' },
        ...super.PARTS,
        features: { template: 'systems/daggerheart/templates/sheets/items/ancestry/features.hbs' }
    };

    /* -------------------------------------------- */
    /*  Application Clicks Actions                  */
    /* -------------------------------------------- */

    /**
     * Edit an existing feature on the item
     * @type {ApplicationClickAction}
     */
    static async #editFeature(_event, button) {
        const target = button.closest('.feature-item');
        const feature = this.document.system[`${target.dataset.type}Feature`];
        if (!feature || Object.keys(feature).length === 0) {
            ui.notifications.warn(game.i18n.localize('DAGGERHEART.UI.Notifications.featureIsMissing'));
            return;
        }

        feature.sheet.render(true);
    }

    /* -------------------------------------------- */
    /*  Application Drag/Drop                       */
    /* -------------------------------------------- */

    /**
     * On drop on the item.
     * @param {DragEvent} event - The drag event
     */
    async _onDrop(event) {
        event.stopPropagation();
        const data = foundry.applications.ux.TextEditor.implementation.getDragEventData(event);

        const item = await fromUuid(data.uuid);
        if (item?.type === 'feature') {
            const subType = event.target.closest('.primary-feature') ? 'primary' : 'secondary';
            if (item.system.subType && item.system.subType !== CONFIG.DH.ITEM.featureSubTypes[subType]) {
                const error = subType === 'primary' ? 'featureNotPrimary' : 'featureNotSecondary';
                ui.notifications.warn(game.i18n.localize(`DAGGERHEART.UI.Notifications.${error}`));
                return;
            }

            await item.update({
                system: {
                    subType: subType,
                    originItemType: CONFIG.DH.ITEM.featureTypes[this.document.type].id,
                    originId: this.document.uuid
                }
            });

            await this.document.update({
                'system.features': [...this.document.system.features.map(x => x.uuid), item.uuid]
            });
        }
    }
}
