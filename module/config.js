export const MODULE_ID = 'dnd5e-fine-tune-skills';
export const PATH = `modules/${MODULE_ID}`;

const settings = {
	playerCanEdit: {
		name: 'Players Can Edit',
		hint: 'Allow players to edit the skills for actors they own.',
		scope: 'world',
		config: true,
		type: Boolean,
		default: true,
	},
};

function registerSettings() {
	for (const [key, setting] of Object.entries(settings)) {
		game.settings.register(MODULE_ID, key, setting);
	}
}

Hooks.on('setup', registerSettings);
