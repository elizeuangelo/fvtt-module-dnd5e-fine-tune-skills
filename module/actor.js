import { MODULE_ID } from './config.js';
import { FineTuneSkills } from './finetune.js';

export function register(name, apply) {
	registry[name] = apply;
}

const registry = {};

Hooks.on('renderActorSheet5e', (app, html, data) => {
	const name = app.constructor.name;
	const apply = registry[name];
	if (apply) apply(app, html, data);
});

Hooks.on('getActorSheet5eHeaderButtons', (app, buttons) => {
	if (!game.user.isGM && !(game.settings.get(MODULE_ID, 'playerCanEdit') && app.actor.isOwner)) return;
	const name = app.constructor.name;
	if (!(name in registry)) return;
	const fineTune = new FineTuneSkills(app.actor, {});
	buttons.unshift({
		label: 'Skills',
		class: 'fine-tune-skills',
		icon: 'fas fa-user-pen',
		onclick: () => {
			fineTune.render(true);
		},
	});
});
