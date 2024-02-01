import { MODULE_ID, PATH } from './config.js';
import { readFile } from './utils.js';

/**
 * Represents a class for managing the actor skills application.
 * @extends FormApplication
 */
export class FineTuneSkills extends FormApplication {
	/**
	 * The target property uniquely represents the application intent.
	 * The application uses the target property to register the settings and load data.
	 * @type {string}
	 */
	static target = 'skills';
	static title = 'Skills';

	static get slug() {
		return this.target.titleCase();
	}

	/** @override */
	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			id: 'finetune',
			title: `Fine Tune 5e: Skills`,
			classes: ['finetune', 'sheet'],
			template: `${PATH}/templates/fine-tune.hbs`,
			width: 700,
			height: 'auto',
		});
	}

	/**
	 * The preview variable stores the preview data.
	 * The settings are only actually updated when the user clicks the implement button.
	 * @type {null}
	 */
	preview = null;
	get actor() {
		return this.object;
	}

	/**
	 * Retrieves a cloned preview of the ability.
	 * @returns {Object} The preview of the ability.
	 */
	#getPreview() {
		const clone = deepClone(CONFIG.DND5E[this.constructor.target]);
		const hidden = this.getHiddenSkills();
		Object.entries(clone).forEach(([key, value]) => {
			value.visible = !hidden.has(key) ?? true;
			value.abbreviation = key;
			value.fullKey ??= '';
			value.icon ??= 'icons/svg/d20.svg';
			value.reference ??= '';
		});
		return clone;
	}

	/**
	 * Retrieves the actor visibilities.
	 * @returns {Object} The actor visibilities.
	 */
	getHiddenSkills() {
		return new Set(this.actor.getFlag(MODULE_ID, 'hidden') || []);
	}

	/**
	 * Updates the visibility state of the eye icon and associated elements.
	 * @returns {Promise<void>} A promise that resolves once the visibility state is updated.
	 */
	async updateVisibleEyeState() {
		const html = this.element;
		const eye = html.find('#show-hide');
		const visibles = html.find('[data-eye]').toArray();
		const open = visibles.some((el) => el.checked === false);
		eye.toggleClass('fa-eye', open);
		eye.toggleClass('fa-eye-slash', !open);
		eye[0].dataset.action = open ? 'show' : 'hide';
	}

	/**
	 * Toggles the visibility of entries based on the provided show parameter.
	 * @param {boolean} show - Determines whether to show or hide the entries.
	 * @returns {void}
	 */
	async showHideEntries(show) {
		this.element.find('[data-eye]').each((idx, el) => {
			el.checked = show;
			setProperty(this.preview, el.dataset.bind, show);
		});
		this.updateVisibleEyeState();
	}

	/* ------- Overrides ------- */

	/** @override */
	_getHeaderButtons() {
		const buttons = super._getHeaderButtons();
		buttons.unshift(
			{
				label: 'Save',
				class: 'save',
				icon: 'fas fa-save',
				onclick: () => saveDataToFile(JSON.stringify(this.preview), 'text/json', `${this.constructor.target}.json`),
			},
			{
				label: 'Load',
				class: 'load',
				icon: 'fas fa-undo',
				onclick: () => {
					readFile().then((data) => {
						if (typeof data?.data !== 'string') return;
						const preview = JSON.parse(data.data);
						this.preview = preview;
						ui.notifications.info(`Loaded table with success: ${data.file.name}`);
						this.render();
					});
				},
			}
		);
		return buttons;
	}

	/** @override */
	activateListeners(html) {
		super.activateListeners(html);
		const actions = {
			show: () => this.showHideEntries(true),
			hide: () => this.showHideEntries(false),
		};
		html.find('[data-action]').each((idx, el) =>
			el.addEventListener('click', () => actions[el.dataset.action].call(this, el))
		);
		html.find('[data-bind]').each((idx, el) =>
			el.addEventListener('change', () => {
				setProperty(this.preview, el.dataset.bind, el.checked);
				this.updateVisibleEyeState();
			})
		);
	}

	/** @override */
	async getData(_options) {
		this.preview ??= this.#getPreview();
		const values = Object.values(this.preview);
		const entries = [];
		for (const entry of values) {
			const link = (await fromUuid(entry.reference)).link;
			const reference = link ? await TextEditor.enrichHTML(link, { async: true }) : '';
			entries.push({
				...entry,
				reference: reference || 'No reference available.',
			});
		}
		return {
			hideEye: !values.some((entry) => entry.visible === false),
			table: entries,
		};
	}

	/** @override */
	async close() {
		this.preview = null;
		super.close({ force: true });
	}

	/** @override */
	async _updateObject(_ev, _formData) {
		if (this.preview === null) return;
		if (objectsEqual(this.#getPreview(), this.preview)) return;
		const confirm = await Dialog.confirm({
			title: 'Confirm Changes',
			content: `<p>${game.i18n.localize('Are you sure you want to implement the changes?')}</p>`,
			rejectClose: false,
		});
		if (!confirm) return;
		this.saveData();
	}

	async saveData() {
		const data = Object.entries(this.preview)
			.map(([k, v]) => (v.visible ? null : k))
			.filter(Boolean);
		await this.actor?.setFlag(MODULE_ID, 'hidden', data);
		ui.notifications.info('Skills Saved.');
	}
}
