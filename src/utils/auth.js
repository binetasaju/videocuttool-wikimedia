import PopupTools from 'popup-tools';
import { socket } from './socket';

const onLogin = (apiUrl, setCurrentUser, updateAppState) => {
	PopupTools.popup(`${apiUrl}/login`, 'Wiki Connect', { width: 1000, height: 600 }, (err, data) => {
		if (!err) {
			updateAppState({
				notification: {
					type: 'info',
					messageId: 'welcome',
					text: data.user.username
				}
			});
			setCurrentUser(data.user);
			socket.emit('join', data.user);
		} else {
			updateAppState({
				notification: {
					type: 'error',
					messageId: 'login-error'
				}
			});
		}
	});
};

const onLogOut = async (apiUrl, updateAppState, setCurrentUser, navigate) => {
	setCurrentUser(null);
	updateAppState({
		notification: {
			type: 'info',
			messageId: 'logout-message'
		}
	});

	document.querySelector('#logout-button').click();

	// Log out from the server (clear cookies)
	try {
		await fetch(`${apiUrl}/logout`, {
			method: 'GET',
			credentials: 'include'
		});
		navigate('/');
	} catch (e) {
		updateAppState({
			notification: {
				type: 'error',
				messageId: 'logout-error'
			}
		});
	}
};
export { onLogin, onLogOut };
