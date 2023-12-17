import { useContext, useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom"
import { Button, ButtonGroup, ToggleButton, Form, InputGroup } from 'react-bootstrap';

import { Upload, Download, CardHeading, CardText, ChatLeftTextFill } from 'react-bootstrap-icons';
import { Message, BananaContext } from '@wikimedia/react.i18n';
import { GlobalContext } from '../context/GlobalContext';
import { VideoDetailsContext } from '../context/VideoDetailsContext';
import { UserContext } from '../context/UserContext';
import VideoPlayer from '../components/VideoPlayer';
import ProgressBar from '../components/ProgressBar';
import ENV_SETTINGS from '../env';
import { uploadVideos } from '../utils/video';
import { formatTime } from '../utils/time';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { List } from 'react-bootstrap-icons';
import logo from '../logo.svg';
import { Image } from 'react-bootstrap';
import Notification from '../components/Notification';
import closeIcon from "../close.svg"
import penicon from "../pen.svg";
import downicon from "../Down.svg"

const API_URL = ENV_SETTINGS().backend_url;
const fileNameRegex = /^(.*)\.[a-zA-Z0-9]+$/;

function Results() {
	const navigate = useNavigate();
	const banana = useContext(BananaContext);
	const { appState, updateAppState } = useContext(GlobalContext);
	const { notifications } = appState || {};
	const { videos, videoDetails, setVideoUrl, processTime, setCurrentSubStep } = useContext(VideoDetailsContext);
	const { currentUser: user } = useContext(UserContext);
	const [videoState, setVideoState] = useState([]);
	const [showProgress, setShowProgress] = useState(false);
	const [wantTitle, setWantTitle] = useState('');
	const [isDisabled, setIsDisabled] = useState(true);
	const [isDisabled1, setIsDisabled1] = useState(true);
	const [isDisabled2, setIsDisabled2] = useState(true);


	const enableTextarea = () => {
		if (isDisabled) {
			setIsDisabled(false);
		}
		else {
			setIsDisabled(true);
		}
	};
	const enableTextarea1 = () => {
		if (isDisabled1) {
			setIsDisabled1(false);
		}
		else {
			setIsDisabled1(true);
		}
	};
	const enableTextarea2 = () => {
		if (isDisabled2) {
			setIsDisabled2(false);
		}
		else {
			setIsDisabled2(true);
		}
	};

	const { backend_url: backendUrl } = ENV_SETTINGS();

	const updateVideoState = (newState, index) => {
		const newVideoData = { ...videoState[index], ...newState };
		const newVideosState = [...videoState];
		newVideosState[index] = newVideoData;
		setVideoState(newVideosState);
	};
	const toggleHeader = () => {
		const status = !showHeader;
		document.body.setAttribute('data-sidebar', status ? 'show' : 'hide');
		setShowHeader(status);
	};


	useEffect(() => {
		const { title, author, comment = '' } = videoDetails;
		const [day, month, year] = new Date()
			.toLocaleDateString('en-GB', {
				year: 'numeric',
				month: '2-digit',
				day: '2-digit'
			})
			.split('/');

		const user = localStorage.getItem('user');
		const { username } = JSON.parse(user);
		const actions = localStorage.getItem('video-settings');
		const changes = JSON.parse(actions);
		const rotation = localStorage.getItem('video-manipulations');
		const rotationAmount = JSON.parse(rotation).rotate_value;
		const titleArr = fileNameRegex.exec(title);
		const newTitle = titleArr[1];

		let subcomment = '';
		if (changes[0].modified === true) subcomment += 'put on mute ';
		if (changes[1].modified === true) {
			if (rotationAmount === 0) subcomment += 'rotated right ';
			else if (rotationAmount === 2) subcomment += 'rotated left ';
			else subcomment += 'rotated upsidedown ';
		}
		if (changes[2].modified === true) subcomment += 'trimmed ';
		if (changes[3].modified === true) subcomment += 'cropped ';
		if (changes[4].modified === true) subcomment += 'changed volume ';
		if (subcomment === '') {
			subcomment += 'not edited ';
		}
		// To avoid merging actions into single words, add a space after each action name.
		const videosWithDetails = videos.map((video, index) => {
			const newExtension = video.split('.');
			return {
				path: video,
				title: `${newTitle}_edited_${index}.${newExtension[1]}`,
				author,
				comment:
					comment ||
					`This video was ${subcomment.trimEnd()} and uploaded by ${username} with VideoCutTool`,
				text: [
					'=={{int:filedesc}}==',
					`{{Information${comment?.length > 0 ? `\n|description=${comment}` : ''}`,
					`|date=${`${year}-${month}-${day}`}`,
					`|source={{Derived from|1=${title}}}${author?.length > 0 ? `\n|author=[[User:${author}|${author}]]` : ''
					}`,
					'}}\n',
					'=={{int:license-header}}==',
					'{{self|cc-by-sa-4.0}}\n',
					'[[Category:VideoCutTool]]\n',
					`{{Extracted from|File:${title}}}`
				].join('\n'),
				selectedOptionName: 'new-file',
				displayUploadToCommons: true
			};
		});
		setVideoState(videosWithDetails);
		setWantTitle(videosWithDetails[0].title);
	}, []);

	const updateUploadType = (index, type) => {
		const data = {
			selectedOptionName: type
		};
		updateVideoState(data, index);
	};

	const updateTitle = (index, title) => {
		updateVideoState({ title }, index);
		setWantTitle(title);
	};

	const updateComment = (index, comment) => {
		updateVideoState({ comment }, index);
	};

	const updateWikiText = (index, text) => {
		updateVideoState({ text }, index);
	};

	const uploadVideo = async () => {
		await uploadVideos(setShowProgress, videoState, user, wantTitle, updateAppState, setVideoUrl, setCurrentSubStep, navigate);
	};

	return (
		<div id="main-container">
			<Header apiUrl={backendUrl}/>
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
				<div id="results-container" data-show-progress={showProgress ? 'true' : 'false'}>
					<div className="videos-container">
						{videoState.map((video, index) => (
							<div className="video-results-wrapper" key={`wrapper-${index}`}>
								<div className={`row ${video.displayUploadToCommons === false && 'd-none'}`}>
									<div className='alignment'>
										<div className="video-player-wrapper">
											<VideoPlayer videoUrl={`${API_URL}/${video.path}`} />
										</div>
										<div className="video-options col-md-5">
											{video.selectedOptionName === 'new-file' && (
												<InputGroup className="mb-3 input-group-style" title={banana.i18n('upload-action-new-file-title')}>
													<div className='input-dropdown'>
														<Form.Label className="input-lable-style" htmlFor="videoTitle">Video Title</Form.Label>
														{/* <Button className='down-button' onClick={hideinput1}>
															<img className='downicon' src={downicon} alt="" />
														</Button> */}
													</div>
													<div className='d-flex'>
														<Form.Control
															className={`input-input-style ${isDisabled1 ? 'disabled-input' : ''}`}
															type="text"
															defaultValue={video.title}
															onChange={e => updateTitle(index, e.target.value)}
															disabled={isDisabled1}
														/> <Button className={`pen-button`} onClick={enableTextarea1}>
															<img src={isDisabled1 ? penicon : closeIcon} alt="" />
														</Button></div>
												</InputGroup>
											)}
											<InputGroup className="mb-3 input-group-style" title={banana.i18n('upload-comment')}>
												<div className='input-dropdown'>
													<Form.Label className="input-lable-style" htmlFor="videocomment">Video Comment</Form.Label>
													{/* <Button className='down-button' onClick={hideinput2}>
														<img className='downicon' src={downicon} alt="" />
													</Button> */}
												</div>
												<div className='d-flex'>
													<Form.Control disabled={isDisabled} type="text" className={`input-input-style ${isDisabled ? 'disabled-input' : ''}`} defaultValue={video.comment} onChange={e => updateComment(index, e.target.value)} />
													<Button className={`pen-button`} onClick={enableTextarea} >
														<img src={isDisabled1 ? penicon : closeIcon} alt="" />
													</Button></div>
											</InputGroup>
											<div className="form-group" >
												<label className="input-lable-style">Upload option</label>
												<Form className="mb-2">
													<Form.Check
														label={<Message id="upload-action-overwrite" />}
														variant="secondary"
														onClick={() => updateUploadType(index, 'overwrite')}
														type="radio"
														name="upload-type"
														checked={video.selectedOptionName === 'overwrite'}
													>
													</Form.Check>
													<Form.Check

														label={<Message id="upload-action-new-file" />}
														variant="secondary"
														onClick={() => updateUploadType(index, 'new-file')}
														type="radio"
														name="upload-type"
														checked={video.selectedOptionName === 'new-file'}
													>

													</Form.Check>
												</Form>
											</div>

											<InputGroup className="mb-3 input-group-style" title={banana.i18n('upload-text')}>
												<div className='input-dropdown'>
													<Form.Label htmlFor="summary" className="input-lable-style">Video Summary</Form.Label>
													{/* <Button className='down-button' onClick={hideinput3}>
														<img className='downicon' src={downicon} alt="" />
													</Button> */}
												</div>
												<div className='d-flex'>
													<Form.Control disabled={isDisabled2} className={`input-input-style ${isDisabled2 ? 'disabled-input' : ''}`} as="textarea" rows={15} defaultValue={video.text} onChange={e => updateWikiText(index, e.target.value)}/>
													<Button className={`pen-button`} onClick={enableTextarea2}>
														<img src={isDisabled1 ? penicon : closeIcon} alt="" />
													</Button></div>
											</InputGroup>
											<div className="upload-button">
												<Button onClick={uploadVideo}>
													<Upload />
													<span className="button-title ms-3">
														<Message id="upload-button" />
													</span>
												</Button>
												<Button
													onClick={() => {
														window.location.href = `${API_URL}/download/${video.path.replace(
															'/public',
															''
														)}`;
													}}
												>
													<Download />
													<span className="button-title ms-3">
														<Message id="step-result-choice-download" />
													</span>
												</Button>
											</div>
										</div>
									</div>
								</div>
							</div>

						))}
					</div>
					<div className="upload-progress-container">
						<ProgressBar />
						<div className="current-process-task mt-4">
							<Message id="task-uploading-wikimedia-commons" />
						</div>
					</div>
				</div>
				<Footer />
			</div>

			{notifications && notifications.length > 0 && <Notification />}
		</div>
	);
}
export default Results;
