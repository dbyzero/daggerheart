import { default as DhDamageEnricher } from './DamageEnricher.mjs';
import { default as DhDualityRollEnricher } from './DualityRollEnricher.mjs';
import { default as DhTemplateEnricher } from './TemplateEnricher.mjs';

export { DhDamageEnricher, DhDualityRollEnricher, DhTemplateEnricher };

export const enricherConfig = [
    {
        pattern: /^@Damage\[(.*)\]$/g,
        enricher: DhDamageEnricher
    },
    {
        pattern: /\[\[\/dr\s?(.*?)\]\]/g,
        enricher: DhDualityRollEnricher
    },
    {
        pattern: /^@Template\[(.*)\]$/g,
        enricher: DhTemplateEnricher
    }
];
