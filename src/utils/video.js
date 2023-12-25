import ENV_SETTINGS from '../env';
const { phab_link, base_wiki_url, backend_url: API_URL, file_url } = ENV_SETTINGS();

/**
 * Get video date from either commons site or user uploads
 *
 * @param {string} videoUrl Video Path
 * @param {string} videoTitle Video Title
 * @param {function} updateAppState Update app state function
 * @returns {void}
 */
const retrieveVideoData = async (
	videoUrl,
	videoTitle,
	updateAppState,
	setVideoDetails,
	setVideoUrl,
	categories
) => {
	if (!videoUrl.includes('commons.wikimedia.org')) {
		return;
	}
	try {
		const baseUrl = `${base_wiki_url}/w/api.php?`;
		const params = {
			action: 'query',
			format: 'json',
			prop: 'videoinfo',
			titles: decodeURI(videoTitle),
			viprop: 'user|url|canonicaltitle|comment|url',
			origin: '*'
		};

		const res = await fetch(baseUrl + new URLSearchParams(params));
		const response = await res.json();
		const { pages } = response.query;
		if (Object.keys(pages)[0] !== '-1') {
			const { user, canonicaltitle, comment, url } = pages[Object.keys(pages)[0]].videoinfo[0];
			setVideoUrl(url);
			setVideoDetails({
				author: user,
				title: decodeURIComponent(canonicaltitle.slice(5)).replace(/\s/g, '_'),
				comment,
				categories
			});
			return {
				author: user,
				title: decodeURIComponent(canonicaltitle.slice(5)).replace(/\s/g, '_'),
				comment,
				url,
				categories
			};
		}
	} catch (err) {
		updateAppState({
			notification: {
				type: 'error',
				messageId: 'error-retrieve-data',
				footerId: 'notification-error-bug-call-to-action',
				linkTitle: 'notifications-error-bug-report',
				link: phab_link
			}
		});
	}
};

/**
 * Check that video exist on commons site
 *
 * @param {string} filePath Video path
 * @param {function} updateAppState Update app state function
 * @returns {void}
 */
const checkFileExist = async (
	filePath,
	updateAppState,
	setVideoDetails,
	setVideoUrl,
	setLoading,
	categories
) => {
	// First check if pattern File:(filename) exists
	const matchPath = filePath.match(/File:(.*)$/);
	if (matchPath === null) {
		return;
	}
	const fileName = matchPath[0];
	const baseUrl = `${base_wiki_url}/w/api.php?`;
	const params = {
		action: 'query',
		titles: fileName,
		format: 'json',
		formatversion: 2,
		origin: '*'
	};
	try {
		const res = await fetch(baseUrl + new URLSearchParams(params));
		const response = await res.json();
		const pageObj = response.query.pages[0];
		if ('missing' in pageObj) {
			return;
		}
		// File exists, retrieve video data
		const result = await retrieveVideoData(
			filePath,
			fileName,
			updateAppState,
			setVideoDetails,
			setVideoUrl,
			categories
		);
		return result;
	} catch (err) {
		setLoading(false);
		updateAppState({
			notification: {
				type: 'error',
				messageId: 'error-file-not-exist',
				footerId: 'notification-error-bug-call-to-action',
				linkTitle: 'notifications-error-bug-report',
				link: phab_link
			}
		});
	}
};

/**
 * Process the video after manipulations
 *
 * @param {object} formData Form data
 * @param {function} updateAppState Update app state function
 * @returns {void}
 */
const processVideo = async (formData, updateAppState, setCurrentSubStep) => {
	try {
		const res = await fetch(`${API_URL}/process`, {
			method: 'POST',
			body: formData
		});
		const response = await res.json();
		if (!response.success) throw response;
	} catch (err) {
		// errors are catched here from the fetch call
		if (err.message) {
			setCurrentSubStep('');
			updateAppState({
				notification: {
					type: 'error',
					messageId: err.message,
					footerId: 'notification-error-bug-call-to-action',
					linkTitle: 'notifications-error-bug-report',
					link: phab_link
				}
			});
		}
	}
};

/**
 * Upload videos to commons site
 *
 * @param {function} setShowProgress Set show progress function
 * @param {object} videoState Video state
 * @param {object} user User object
 * @param {string} wantTitle Wanted title
 * @param {function} updateAppState Update app state function
 * @returns {void}
 */

const uploadVideos = async (
	setShowProgress,
	videoState,
	user,
	wantTitle,
	updateAppState,
	setVideoUrl,
	setCurrentSubStep,
	navigate
) => {
	setShowProgress(true);
	const uploadData = {
		upload: true,
		videos: videoState,
		user
	};

	try {
		const uploadResponse = await fetch(`${API_URL}/upload`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(uploadData)
		});

		const data = await uploadResponse.json();

		const { success } = data;

		if (data.type === 'Error' && !success) throw data;

		setShowProgress(false);

		if (success === true) {
			updateAppState({
				notification: {
					type: 'success',
					messageId: 'task-uploaded-wikimedia-commons',
					link: `${base_wiki_url}/wiki/File:${wantTitle}`,
					linkTitle: 'task-uploaded-wikimedia-commons-footer-cover',
					footerId: 'task-uploaded-wikimedia-commons-footer'
				}
			});
			navigate(`/`);
			setCurrentSubStep('');
			setVideoUrl('');
		} else {
			const { type, warnings } = data;
			if (type === 'Warning') {
				// Show all concerned warnings
				for (let warning of warnings) {
					updateAppState({
						notification: {
							type: 'warning',
							messageId: `${warning}-message`,
							footerId: `${warning}-footer`,

							// conditional adding of the link attribute, if present
							...(warning === 'badfilename' && {
								link: 'https://www.mediawiki.org/wiki/Manual:$wgIllegalFileChars',
								linkTitle: 'warning-badfilename-footer-cover'
							})
						}
					});
				}
			}
		}
	} catch (err) {
		// errors are catched here from the fetch call
		setShowProgress(false);
		updateAppState({
			notification: {
				type: 'error',
				text: err.message,
				footerId: 'notification-error-bug-call-to-action',
				linkTitle: 'notifications-error-bug-report',
				link: phab_link
			}
		});
	}
};

/** utility function to convert string to Title case.
 * @param {string} type, string to convert
 * @returns {string} type, string after converting to title case
 * Note-> Planned to migrate this function to another file in future
 */
function toTitleCase(type) {
	return type.charAt(0).toUpperCase() + type.slice(1);
}

const fetchVideoId = async (
	title,
	url,
	file,
	setVideoId,
	navigate,
	currentUser,
	setCurrentSubStep,
	updateAppState,
	setVideoUrl
) => {
	const formData = new FormData();
	formData.append('title', JSON.stringify(title));
	formData.append('url', JSON.stringify(url));
	formData.append('user', JSON.stringify(currentUser));
	formData.append('file', file);
	try {
		const response = await fetch(`${API_URL}/register`, {
			method: 'POST',
			body: formData
		});

		const data = await response.json();
		if (!response.ok) {
			throw data;
		}
		const apiPath = data.path.replace('/app/server', '/api');
		setVideoUrl(apiPath);
		setVideoId(data.id);
		navigate(`/edit/${data.id}`);
	} catch (err) {
		if (err.message) {
			setCurrentSubStep('');
			updateAppState({
				notification: {
					type: 'error',
					messageId: err.message,
					footerId: 'notification-error-bug-call-to-action',
					linkTitle: 'notifications-error-bug-report',
					link: phab_link
				}
			});
		}
	}
};

const fetchViaUrl = async (
	updateAppState,
	setVideoDetails,
	setVideoUrl,
	setVideoId,
	navigate,
	currentUser,
	setCurrentSubStep,
	setLoading,
	categories
) => {
	const currentUrl = new URL(window.location.href);
	const title = currentUrl.searchParams.get('title');
	if (!title) {
		return;
	}
	const decodedTitle = decodeURIComponent(title);
	const originalUrl = `${file_url}${decodedTitle}`;
	try {
		const result = await checkFileExist(
			originalUrl,
			updateAppState,
			setVideoDetails,
			setVideoUrl,
			setLoading,
			categories
		);
		if (result) {
			fetchVideoId(
				result.title,
				result.url,
				null,
				setVideoId,
				navigate,
				currentUser,
				setCurrentSubStep,
				updateAppState,
				setVideoUrl
			);
		}
	} catch (e) {
		console.log(e);
	}
};

/**
 * Fetch query params from url
 *
 * @returns {object} params
 */

const fetchQueryParams = oldVideoDetails => {
	const location = new URL(window.location.href);
	const title = location.searchParams.get('title');
	const categories = location.searchParams.getAll('category');
	const params = {
		...(title && { title: `${base_wiki_url}/wiki/File:${title}` }),
		...(categories && categories.length > 0 && { categories })
	};
	return { ...oldVideoDetails, ...params };
};

export {
	checkFileExist,
	processVideo,
	uploadVideos,
	toTitleCase,
	fetchVideoId,
	fetchViaUrl,
	fetchQueryParams
};
