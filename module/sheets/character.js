import { register } from '../actor.js';
import { MODULE_ID } from '../config.js';

export function apply(app, html, data) {
	const actor = app.actor;
	const skillsList = html.find('.skills ul');
	const hiddenSkills = actor.getFlag(MODULE_ID, 'hidden');
	if (!hiddenSkills) return;
	hiddenSkills.forEach((skill) => {
		skillsList.find(`li[data-key="${skill}"]`).hide();
	});
}

register('ActorSheet5eCharacter2', apply);
