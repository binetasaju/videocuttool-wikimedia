import { useEffect, useState, useRef, useContext } from 'react';
import { ToggleButtonGroup, ButtonGroup, Button, ToggleButton } from 'react-bootstrap';
import {
	ArrowClockwise,
	ArrowCounterclockwise,
	VolumeMute,
	VolumeUpFill,
	Scissors,
	Crop,
	PlayCircle,
	XCircle,
	VolumeDownFill,
	ArrowLeft
} from 'react-bootstrap-icons';
import { Message } from '@wikimedia/react.i18n';
import { GlobalContext } from '../context/GlobalContext';
import { List } from 'react-bootstrap-icons';
import logo from '../logo.svg';
import { Image } from 'react-bootstrap';

import { VideoDetailsContext } from '../context/VideoDetailsContext';
import { UserContext } from '../context/UserContext';

import DragResize from '../components/DragResize';
import VideoProcess from '../components/VideoProcess';
import Trim from '../components/Trim';
import VideoPlayer from '../components/VideoPlayer';
import { storeItem, getStoredItem, clearItems } from '../utils/storage';
import { formatTime } from '../utils/time';
import Slider from '../components/Slider';
import { toTitleCase, processVideo } from '../utils/video';
import Header from '../components/Header';
import ENV_SETTINGS from '../env';
import Footer from '../components/Footer';
import Notification from '../components/Notification';

/**
 * Handle videos settings UI and actions
 * @param {object} props Inherited props
 * @returns {string} Output
 */
function VideoSettings() {
	const { updateAppState, appState, uploadedVideo } = useContext(GlobalContext);
	const { socketId, notifications, themeMode } = appState;
	const { currentUser } = useContext(UserContext);
	const {
		videoUrl,
		currentSubStep,
		setCurrentSubStep,
		file,
		videoId,
		setVideoUrl,
		setVideoDetails
	} = useContext(VideoDetailsContext);

	const videoPlayer = useRef(null);
	const trims = useRef(null);
	const trimMode = useRef('single');
	const { backend_url: backendUrl } = ENV_SETTINGS();

	// Hash to reset trim
	const trimHash = useRef(getStoredItem('video-trim-hash') || Date.now());
	const [totalChanges, setTotalChanges] = useState(0);
	const [changes, setChanges] = useState([]);
	const [isModified, setIsModified] = useState(false);

	const initialVideoManipulationData = {
		crop_x: 0,
		crop_y: 0,
		crop_height: 0,
		crop_width: 0,
		rotate_value: 3,
		mute: false,
		volume: 100
	};
	const videoManipulationData = useRef(initialVideoManipulationData);
	const [videoAttr, setVideoAttr] = useState({});
	const [videoReady, setVideoReady] = useState(false);

	// Set initial settings array for each of the settings
	const initialSettingsState = [
		{
			type: 'mute',
			title_id: 'setting-audio',
			modified: false,
			icon: VolumeMute
		},
		{
			type: 'rotate',
			title_id: 'setting-rotate',
			modified: false,
			icon: ArrowClockwise
		},
		{
			type: 'trim',
			title_id: 'setting-trim',
			modified: false,
			icon: Scissors
		},
		{
			type: 'crop',
			title_id: 'setting-crop',
			modified: false,
			icon: Crop
		},
		{
			type: 'volume',
			title_id: 'setting-volume',
			modified: false,
			icon: VolumeDownFill
		}
	];

	const [settings, setSettings] = useState(initialSettingsState);
	const [canPreview, setCanPreview] = useState(false);
	const [currentSetting, setCurrentSetting] = useState(false);
	const [currentVolume, setCurrentVolume] = useState(100);
	const [showHeader, setShowHeader] = useState(false);

	useEffect(() => {
		if (uploadedVideo) {
			setCanPreview(true);
		}
	}, []);

	const UploadDirect = async () => {
		setCurrentSubStep('process');
		const userinfo = {
			mediawikiId: currentUser.mediawikiId,
			username: currentUser.username,
			socketId: socketId
		};
		const formData = new FormData();
		formData.append('data', JSON.stringify(settingData));
		formData.append('videoId', videoId);
		formData.append('user', JSON.stringify(userinfo));
		formData.append('file', file);
		await processVideo(formData, updateAppState, setCurrentSubStep);
	};

	/**
	 * Update settings by first cloning the current settings
	 * and then merging with the new ones
	 *
	 * @param {object} newSettings Object of new settings
	 * @param {string} type Type of setting (trim, mute .. etc)
	 */
	const updateSettings = (newSettings, type = currentSetting.type) => {
		// eslint-disable-next-line
		const storedSettings = maybeGetStoredSettings();
		const cloneSettings = [...storedSettings];
		const currentSettingIndex = settings.findIndex(setting => setting.type === type);
		cloneSettings[currentSettingIndex] = { ...cloneSettings[currentSettingIndex], ...newSettings };
		setSettings(cloneSettings);

		// gets the settings where 	`modified=true`,
		// to get number of features enabled

		const modifiedSettings = cloneSettings.filter(setting => setting.modified);
		if (modifiedSettings.length !== 0) {
			setIsModified(true);
			setChanges([
				...modifiedSettings.map(obj => toTitleCase(obj.type) + ('values' in obj ? obj.values : ''))
			]);
			setTotalChanges(modifiedSettings.length);
		} else {
			setChanges([]);
			setIsModified(false);
		}
		storeItem('video-settings', cloneSettings);

		// Update current setting
		setCurrentSetting({ ...currentSetting, ...newSettings });
	};

	/**
	 * If settings exist in localstorage then return them,
	 * otherwise return current state settings
	 * @returns {array} Array of objects of settings
	 */
	const maybeGetStoredSettings = () => {
		const storedVideoSettings = getStoredItem('video-settings');

		if (storedVideoSettings === null) {
			return settings;
		}

		const updatedSettings = settings.map((setting, index) => {
			setting.modified = storedVideoSettings[index].modified;
			return setting;
		});
		return updatedSettings;
	};

	const updateVideoManipulationData = newData => {
		const updatedManipulations = { ...videoManipulationData.current, ...newData };
		videoManipulationData.current = updatedManipulations;
		storeItem('video-manipulations', updatedManipulations);
	};

	useEffect(() => {
		if (currentSubStep !== '') {
			return;
		}
		// Check if manipulations is saved to localstorage and restore it
		const storedManipulations = getStoredItem('video-manipulations');

		if (storedManipulations !== null) {
			updateVideoManipulationData(storedManipulations);
		}
	}, [currentSubStep]);

	useEffect(() => {
		// Check if any value is modified and set preview to true
		const isModified = settings.filter(setting => setting.modified === true);

		setCanPreview(isModified.length > 0);

		if (videoPlayer.current !== null) {
			// videoPlayer.current.addEventListener('onplay', videoCanPlay);
			setVideoAttr(videoPlayer.current.getState());
		}
	});

	useEffect(() => {
		// console.log('VIDE', videoAttr);
	}, [videoAttr]);

	/**
	 * Callback to modify mute setting
	 *
	 * @param {boolean} change True to mute, false otherwise
	 */
	const muteAudio = change => {
		updateVideoManipulationData({
			mute: change
		});

		// Toggle mute on displayed video
		videoPlayer.current.videoEl.muted = change;

		updateSettings(
			{
				modified: change
			},
			'mute'
		);
	};

	const changeVolume = e => {
		const newVolume = e.target.value;
		if (newVolume == 0) {
			muteAudio(true);
			updateSettings({
				modified: false
			});
		} else {
			muteAudio(false);
			updateVideoManipulationData({
				volume: newVolume
			});
			updateSettings({
				modified: newVolume != 100,
				values: `(${newVolume}%)`
			});
		}
		setCurrentVolume(newVolume);
		videoPlayer.current.videoEl.volume = newVolume / 100;
	};
	/**
	 * Callback to handle video rotation
	 * @param {int} newRotateValue New rotation value
	 */
	const changeRotation = newRotateValue => {
		if (newRotateValue < 0) newRotateValue = 3;
		if (newRotateValue > 3) newRotateValue = 0;
		const videoEl = document.querySelector('#video-player video');
		const videoWidth = videoEl.offsetWidth;
		const videoHeight = videoEl.offsetHeight;

		// rotate video according to rotate value
		const transformRotate = (newRotateValue + 1) * 90;
		let transform = `rotate(${transformRotate}deg)`;

		// if video is rotated 90 or 180 deg then add scale
		if (newRotateValue === 0 || newRotateValue === 2) {
			const scale = videoHeight / videoWidth;
			transform += ` scale(${scale})`;
		}

		// Apply transform
		document.querySelector('#video-player video').style.transform = transform;
		updateVideoManipulationData({
			rotate_value: newRotateValue
		});

		updateSettings({
			modified: newRotateValue !== 3,
			values: `(${transformRotate}°)`
		});
		console.log(currentSetting);
	};

	/**
	 * This function is passed to child component to update
	 * crop date once changes have been committed by user
	 *
	 * @param {object} data Crop data
	 */
	const updateCropFromChild = data => {
		const { left, top, width, height } = data;
		const cropValues = {
			crop_x: left,
			crop_y: top,
			crop_height: height,
			crop_width: width
		};
		updateVideoManipulationData(cropValues);

		// If rotate value changed it will trigger crop rendering.
		// Prevent changing setting attributes if crop is not selected
		if (currentSetting.type === 'crop') {
			const isCropModified = left === 0 && top === 0 && width === 100 && height === 100;
			updateSettings({
				modified: !isCropModified,
				values: `(${cropValues.crop_height}x${cropValues.crop_width})`
			});
		}
	};

	/**
	 * This function is passed to child componenet to update trim state
	 *
	 * @param {string} type Setting type to change (trims, trimMode)
	 * @param {array|boolean} newValue Array of trim data, or boolean for trimMode type
	 */
	const updateTrimsFromChild = (type, newValue) => {
		let areTrimsModified = false;
		let isModeModified = false;
		const { duration } = videoAttr;
		if (type === 'trims') {
			trims.current = newValue;
			areTrimsModified =
				newValue.length > 1 ||
				parseFloat(newValue[0].from) !== 0 ||
				(parseFloat(newValue[0].to) !== parseFloat(duration.toFixed(2)) &&
					newValue[0].to < duration);
		} else if (type === 'trimMode') {
			trimMode.current = newValue;
			isModeModified = newValue !== 'single' || trims.current !== null;
		}
		let trimValue = '';
		for (let i = 0; i < newValue.length; i++) {
			const formattedFrom = formatTime(newValue[i].from).split('.')[0];
			const formattedTo = formatTime(videoPlayer?.current.getState().duration).split('.')[0];
			trimValue += `(${formattedFrom} - ${formattedTo})`;
		}
		updateSettings(
			{
				modified: areTrimsModified || isModeModified,
				values: !isModeModified ? trimValue : undefined
			},
			'trim'
		);
	};

	/**
	 * Handle undo changes button for each setting type
	 */
	const undoChanges = () => {
		const { type } = currentSetting;
		switch (type) {
			case 'rotate':
				updateVideoManipulationData({ rotate_value: 3 });
				changeRotation(3);
				break;
			case 'mute':
				updateVideoManipulationData({ mute: false });
				break;
			case 'crop':
				setCurrentSetting({});
				break;
			case 'trim':
				trimHash.current = Date.now();
				clearItems(['video-trim-hash']);
				break;
			case 'volume':
				updateVideoManipulationData({ volume: 100 });
				setCurrentVolume(100);
				break;
			default:
				break;
		}
		updateSettings({ modified: false });
	};

	const manipulations = videoManipulationData.current;
	const volumeInt = parseInt(manipulations.volume);
	const settingData = {
		rotateValue: manipulations.rotate_value,
		inputVideoUrl: videoUrl,
		trimMode: trimMode.current,
		trims: trims.current,
		volume: volumeInt,
		modified: settings.reduce((acc, setting) => {
			const { type, modified } = setting;
			acc[type] = modified;
			return acc;
		}, {}),
		crop: {
			width: manipulations.crop_width,
			height: manipulations.crop_height,
			x: manipulations.crop_x,
			y: manipulations.crop_y
		}
	};
	/**
	 * Move to process video screen if changes have been made
	 *
	 * @returns {void}
	 */
	const processvideo = async () => {
		if (!canPreview) {
			return;
		}

		// if user is not logged in, this would be empty object
		const userinfo = {
			...currentUser
		};

		setCurrentSubStep('process');
		const formData = new FormData();
		formData.append('videoId', videoId);
		formData.append('data', JSON.stringify(settingData));
		formData.append('user', JSON.stringify(userinfo));
		await processVideo(formData, updateAppState, setCurrentSubStep);
	};

	/**
	 * Callback to set video to playbale state once canplay event is triggered
	 */
	const videoCanPlay = () => {
		setVideoReady(true);
	};

	const [hash, setHash] = useState([1, 1, 1, 1, 1]);
	const [showSubEdits, setShowSubEdits] = useState(false);

	// Function to set an element at a specific index to 1
	const setAtIndexToOne = (index) => {
		if (index >= 0 && index < hash.length) {
			const updatedHash = hash.fill(0); // Create a copy of the original array
			updatedHash[index] = 1; // Change the value at the specified index to 1
			setHash(updatedHash);
		} else {
			console.error('Invalid index'); // Handle invalid index
		}
	};

	const settingsComponent = (
		<div id="video-settings">
			<div className="d-flex flex-column pb-3">
				<div className="ms-auto d-flex">
					<Button
						variant="primary"
						className="me-3"
						disabled={canPreview === false}
						onClick={processvideo}
						size="sm"
					>
						{/* <PlayCircle /> */}
						<span className="setting-title">
							<Message id="preview-text" />
						</span>
					</Button>
					{uploadedVideo ? (
						<Button
							variant="primary"
							className="me-5"
							disabled={canPreview === true}
							onClick={UploadDirect}
						>

							<span className="setting-title">Upload Directlty</span>
						</Button>
					) : (
						''
					)}

					<Button
						variant="danger"
						disabled={currentSetting.modified === false}
						onClick={undoChanges}
						size="sm"
					>
						{/* <XCircle /> */}
						<span className="setting-title">
							<Message id="reset-text" />
						</span>
					</Button>
				</div>
			</div>
			<div className="video-wrapper">
				<div style={{ display: 'flex', flexDirection: 'column' }}>
					<ToggleButtonGroup
						name="manipulations"
						className="video-manipulation-group"
						aria-label="Video Manipulation"
						vertical
						style={{ backgroundColor: 'white' }}
					>
						{hash.filter(value => value === 0).length === 4 && (
							<ToggleButton
								variant={themeMode}
								id="video-manipulation-4"
								onChange={() => {
									setHash([1, 1, 1, 1, 1])
									setShowSubEdits(false);
								}}
								type="radio"
								name="manipulation"
								checked={currentSetting.type === settings[4].type}
							>
								<ArrowLeft size={18} />
								{/* {settings[4].modified && <span className="modified" />} */}
							</ToggleButton>
						)}

						{hash[1] ? <ToggleButton
							variant={themeMode}
							id="video-manipulation-1"
							onChange={() => {
								changeRotation(videoManipulationData.current.rotate_value + 1);
								setCurrentSetting(settings[1])
							}}
							type="radio"
							name="manipulation"
							checked={currentSetting.type === settings[1].type}
						>
							<ArrowClockwise size={18} />
							{/* {settings[1].modified && <span className="modified" />} */}
						</ToggleButton> : ''
						}
						{hash[2] ? <ToggleButton
							variant={themeMode}
							id="video-manipulation-2"
							onChange={() => {
								setCurrentSetting(settings[2])
								setAtIndexToOne(2);
								setShowSubEdits(true);
							}}
							type="radio"
							name="manipulation"
							checked={currentSetting.type === settings[2].type}
						>
							<Scissors size={18} />

						</ToggleButton> : ''}

						{hash[3] ? <ToggleButton
							variant={themeMode}
							id="video-manipulation-3"
							onChange={() => {
								setCurrentSetting(settings[3])
								setAtIndexToOne(3);
								setShowSubEdits(true);
							}}
							type="radio"
							name="manipulation"
							checked={currentSetting.type === settings[3].type}
						>
							<Crop size={18} />
							{/* {settings[3].modified && <span className="modified" />} */}
						</ToggleButton> : ''}
						{hash[4] ? <ToggleButton
							variant={themeMode}
							id="video-manipulation-4"
							onChange={() => {
								setCurrentSetting(settings[4]);
								setAtIndexToOne(4);
								setShowSubEdits(true);
							}}
							type="radio"
							name="manipulation"
							checked={currentSetting.type === settings[4].type}
						>
							<VolumeDownFill size={18} />
							{/* {settings[4].modified && <span className="modified" />} */}
						</ToggleButton> : ''}


					</ToggleButtonGroup>
					{showSubEdits ? <div className="video-manipulations-options">
						{currentSetting.type === 'volume' && (
							<div className="vertical-slider">
								<Slider title="Volume" onChange={changeVolume} value={currentVolume} />
							</div>
						)}
					</div> : ''}
				</div>
				<VideoPlayer ref={videoPlayer} videoUrl={videoUrl} onCanPlay={videoCanPlay}>
					{videoPlayer.current && (
						<DragResize
							display={currentSetting.type === 'crop'}
							boundsEl="video"
							rotateValue={videoManipulationData.current.rotate_value}
							videoReady={videoReady}
							cropUpdater={updateCropFromChild}
						/>
					)}
				</VideoPlayer>
			</div>
			<div className="video-manipulations">

				{videoPlayer.current && (
					<Trim
						hash={trimHash.current}
						display={currentSetting.type === 'trim'}
						player={videoPlayer.current}
						videoSelector="#video-player video"
						videoReady={videoAttr.canplay}
						trimsUpdater={updateTrimsFromChild}
					/>
				)}
			</div>
		</div>
	);
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
				{currentSubStep !== 'process' ? settingsComponent : <VideoProcess settings={settings} />}
				<Footer />
			</div>
			{notifications && notifications.length > 0 && <Notification />}
		</div>
	);
}

export default VideoSettings;
