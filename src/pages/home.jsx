import { useContext, useEffect, useState } from 'react';
import { Image } from 'react-bootstrap';
import { List } from 'react-bootstrap-icons';
import UrlBox from '../components/UrlBox';
import Header from '../components/Header';
import { GlobalContext } from '../context/GlobalContext';
import { UserContext } from '../context/UserContext';
import { socket } from '../utils/socket';
import Notification from '../components/Notification';
import { clearItems, getStoredItem, storeItem } from '../utils/storage';
import ENV_SETTINGS from '../env';
import { Message } from '@wikimedia/react.i18n';
import logo from '../logo.svg';
import '../style/main.scss';
import '../style/dark-theme.scss';
import Footer from '../components/Footer';
import { VideoDetailsContext } from '../context/VideoDetailsContext';
import { fetchQueryParams } from '../utils/video';

const { backend_url: backendUrl } = ENV_SETTINGS();
const currentUser = getStoredItem('user');

socket.on('connect', () => {
	if (currentUser) {
		socket.emit('join', currentUser);
	}
	console.log('check 2', socket.connected);
});

socket.on('connect_error', err => {
	console.log(`connect_error due to ${err.message}`);
});

function Home() {
	const { appState, updateAppState } = useContext(GlobalContext);
	const { notifications } = appState || {};
	const { setCurrentUser } = useContext(UserContext);
	const { videoDetails, setVideoDetails } = useContext(VideoDetailsContext);

	const [showHeader, setShowHeader] = useState(false);

	const userLocalStorage = getStoredItem('user');

	socket.on('update', data => {
		const { socketId } = data;
		updateAppState({ socketId });
		const params = fetchQueryParams(videoDetails);
		setVideoDetails(params);
	});

	useEffect(() => {
		// Clear localstorage
		clearItems([
			'video-manipulations',
			'video-settings',
			'video-trim-hash',
			'video-trims',
			'video-crop'
		]);

		// Update socket reference
		updateAppState({ socket });

		// Update current user
		setCurrentUser(userLocalStorage);
		const params = fetchQueryParams(videoDetails);
		setVideoDetails(params);
	}, []);

	const [isOnline, setIsOnline] = useState(true);
	const [tabActive, setTabActive] = useState(true);

	useEffect(() => {
		socket.on('connect', () => {
			setIsOnline(true);
		});

		socket.on('connect_error', () => {
			setIsOnline(false);
		});
		const handleVisibilityChange = () => {
			setTabActive(!document.hidden);
		};

		document.addEventListener('visibilitychange', handleVisibilityChange);

		if (!isOnline) {
			updateAppState({
				notification: {
					type: 'error',
					messageId: 'internet-connection-lost'
				}
			});
		}
		// Specify how to clean up after this effect for performance improvment
		return () => {
			document.removeEventListener('visibilitychange', handleVisibilityChange);
		};
	}, [isOnline, tabActive]);

	const toggleHeader = () => {
		const status = !showHeader;
		document.body.setAttribute('data-sidebar', status ? 'show' : 'hide');
		setShowHeader(status);
	};

	return (
		<div id="main-container">
			<Header apiUrl={backendUrl} />
			<div id="content" className="flex-column">
				<div className="logo-wrapper flex-sm-row">
					<span className="menu-icon" data-testid="sidebar-toggle-button" onClick={toggleHeader}>
						<List size="25" />
					</span>
					<Image alt="logo" src={logo} width="100" height="40" />
					<h1 className="text-white" data-testid="title">
						<Message id="title" />
					</h1>
				</div>
				<UrlBox />
				<Footer />
			</div>

			{notifications && notifications.length > 0 && <Notification />}
		</div>
	);
}

export default Home;
