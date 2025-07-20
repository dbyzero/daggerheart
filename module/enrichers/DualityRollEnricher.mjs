import { abilities } from '../config/actorConfig.mjs';
import { getCommandTarget, rollCommandToJSON } from '../helpers/utils.mjs';

export default function DhDualityRollEnricher(match, _options) {
    const roll = rollCommandToJSON(match[1]);
    if (!roll) return match[0];

    return getDualityMessage(roll);
}

export function getDualityMessage(roll) {
    const traitLabel =
        roll.trait && abilities[roll.trait]
            ? game.i18n.format('DAGGERHEART.GENERAL.check', {
                  check: game.i18n.localize(abilities[roll.trait].label)
              })
            : null;

    const label = traitLabel ?? game.i18n.localize('DAGGERHEART.GENERAL.duality');
    const dataLabel = traitLabel
        ? game.i18n.localize(abilities[roll.trait].label)
        : game.i18n.localize('DAGGERHEART.GENERAL.duality');

    const dualityElement = document.createElement('span');
    dualityElement.innerHTML = `
        <button class="duality-roll-button" 
            data-title="${label}"
            data-label="${dataLabel}"
            data-hope="${roll.hope ?? 'd12'}" 
            data-fear="${roll.fear ?? 'd12'}"
            ${roll.difficulty ? `data-difficulty="${roll.difficulty}"` : ''}
            ${roll.trait && abilities[roll.trait] ? `data-trait="${roll.trait}"` : ''}
            ${roll.advantage ? 'data-advantage="true"' : ''}
            ${roll.disadvantage ? 'data-disadvantage="true"' : ''}
        >
            <i class="fa-solid fa-circle-half-stroke"></i>
            ${label}
            ${roll.difficulty ? `(${roll.difficulty})` : ''}
        </button>
    `;

    return dualityElement;
}

export const renderDualityButton = async event => {
    const button = event.currentTarget,
        traitValue = button.dataset.trait?.toLowerCase(),
        target = getCommandTarget(),
        difficulty = button.dataset.difficulty;
    if (!target) return;

    const config = {
        event: event,
        title: button.dataset.title,
        roll: {
            modifier: traitValue ? target.system.traits[traitValue].value : null,
            label: button.dataset.label,
            difficulty: difficulty,
            type: button.dataset.actionType ?? null // Need check
        },
        chatMessage: {
            template: 'systems/daggerheart/templates/ui/chat/duality-roll.hbs'
        }
    };
    await target.diceRoll(config);
};
