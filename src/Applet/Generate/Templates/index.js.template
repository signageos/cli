import './index.css';
import sos from '@signageos/front-applet';

// Wait on sos data are ready (https://docs.signageos.io/api/js/content/latest/js-applet-basics#onready)
sos.onReady().then(async function () {
	const contentElement = document.getElementById('root');
	if (contentElement) {
		console.log('sOS is ready');
		contentElement.innerHTML = 'sOS is ready';
	}
});
