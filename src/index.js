
require('./index.css');

window.addEventListener('sos.loaded', async function () {
	const contentElement = document.getElementById('root');
	console.log('sOS is loaded');
	contentElement.innerHTML = 'sOS is loaded';

	// Wait on sos data are ready (https://docs.signageos.io/api/sos-applet-api/#onReady)
	await sos.onReady();
	console.log('sOS is ready');
	contentElement.innerHTML = 'sOS is ready';
});
