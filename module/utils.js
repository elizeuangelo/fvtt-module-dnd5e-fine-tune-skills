/**
 * Reads a file from user input and returns a promise that resolves with the file and its content.
 * @returns {Promise<{ file: File, data: string }>} A promise that resolves with an object containing the file and its content.
 */
export async function readFile() {
	const input = $('<input type="file">');
	return new Promise((resolve) => {
		input.on('change', (ev) => {
			const file = ev.target.files[0];
			if (!file) {
				alert('No file selected.');
				return;
			}
			const reader = new FileReader();
			reader.onload = (ev) => {
				const fileContent = ev.target.result;
				resolve({ file, data: fileContent });
			};
			reader.onabort = reader.onerror = () => resolve(null);
			reader.readAsText(file);
		});
		input.trigger('click');
	});
}
