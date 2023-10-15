const fs = require('fs');
const utils = require('./utils.js');

async function workerProcess(job) {
	const startTime = Date.now();
	const {
		_id,
		inputVideoUrl,
		videoName,
		videoDownloadPath,
		mediawikiId,
		settings: { trims, trimMode, crop, modified, rotateValue, volume }
	} = job.data;
	const videoId = _id;
	const downloadingVideoInfo = {
		videoName,
		videoId
	};
	try {
		let error = false;
		let videoPath = videoDownloadPath;
		if (videoDownloadPath === null) {
			const urlDownload = await utils.downloadVideo(
				this,
				mediawikiId,
				inputVideoUrl,
				downloadingVideoInfo
			);
			videoPath = urlDownload.videoPath;
			error = urlDownload.error;
		}
		if (error || !videoPath || !fs.existsSync(videoPath)) {
			return 'Error downloading video';
		}
		// Combine audio disable, rotation and cropping in one command if set
		const manipulations = {};
		if (modified.mute === true) {
			manipulations.disable_audio = true;
		}
		if (modified.rotate === true) {
			manipulations.rotate = rotateValue;
		}
		if (modified.crop === true) {
			manipulations.crop = crop;
		}
		if (modified.volume === true) {
			manipulations.volume = volume;
		}
		let newVideoPath = null;
		const hasManipulations = Object.keys(manipulations).length > 0;
		// Manipulate video if audio disable, rotation or cropping or volume change is set and trim is not set
		if (hasManipulations && modified.trim !== true) {
			const manipulationsVideoInfo = {
				videoPath,
				videoId
			};
			const manipulateStage = await utils.manipulateVideo(
				this,
				mediawikiId,
				manipulationsVideoInfo,
				manipulations
			);
			newVideoPath = manipulateStage.newVideoPath;
		}
		// Trim video is set
		if (modified.trim === true) {
			manipulations.trim = true;
			newVideoPath = newVideoPath || videoPath;
			const trimmingVideoInfo = {
				videoPath: newVideoPath,
				videoId
			};
			const trimStage = await utils.trimVideos(
				this,
				mediawikiId,
				trimmingVideoInfo,
				trims,
				manipulations
			);
			newVideoPath = trimStage.trimsLocations;
			// Concatenate videos if mode is single
			if (trimMode === 'single' && trims.length > 1) {
				const concatenatingVideoInfo = {
					videoPaths: newVideoPath,
					videoId
				};
				const concatStage = await utils.concatVideos(this, mediawikiId, concatenatingVideoInfo);
				newVideoPath = concatStage.concatenatedLocation;
			}
		}
		// Convert video and return the converted video path
		const convertingVideoInfo = {
			videoPaths: newVideoPath,
			videoId
		};
		const convertFormat = await utils.convertVideoFormat(this, mediawikiId, convertingVideoInfo);

		// Delete downloaded video
		utils.deleteFiles(videoPath);
		const endTime = Date.now();

		return { videoId, convertFormat, timeTaken: endTime - startTime, mediawikiId };
	} catch (manipulationError) {
		this.emit('error', {
			type: 'server-side-and-frontend-update',
			videoId,
			mediawikiId,
			data: {
				videoId,
				status: 'error',
				error: manipulationError,
				timeTaken: 0
			}
		});
		console.log('ERROR', manipulationError);
		return manipulationError;
	}
}

module.exports = workerProcess;
