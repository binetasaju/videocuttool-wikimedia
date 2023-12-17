import { useState, useRef, useContext, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { Message } from '@wikimedia/react.i18n';
import InputGroup from 'react-bootstrap/InputGroup';
import { Spinner, Form } from 'react-bootstrap';
import { GlobalContext } from '../context/GlobalContext';
import { UserContext } from '../context/UserContext';
import { VideoDetailsContext } from '../context/VideoDetailsContext';
import { checkFileExist, fetchViaUrl, fetchVideoId } from '../utils/video';


function UrlBox(props) {
	const navigate = useNavigate();
	const { updateAppState } = useContext(GlobalContext);
	const { setVideoDetails, setVideoUrl, setFile, setVideoId, setCurrentSubStep, setCurrentStep } = useContext(VideoDetailsContext);
	const { currentUser } = useContext(UserContext);
	const { title: requiredTitle } = props;
	const allowedExtensions = 'mp4,webm,mov,flv,ogv,mpg,mpeg';
	const [mouseHover, setMouseHover] = useState(false);
	const [loading, setLoading] = useState(false);
	const [title, setTitle] = useState('');
	const fileUpload = useRef(null);
	const dragEnter = () => {
		setMouseHover(true);
	};

	const dragLeave = () => {
		setMouseHover(false);
	};

	const dragOver = e => {
		e.preventDefault();
	};

	useEffect(() => {
		fetchViaUrl(updateAppState, setVideoDetails, setVideoUrl, setVideoId, navigate, currentUser, setCurrentSubStep, setLoading);
	}, []);


	const onFileUpload = async (e) => {
		const files = (e.dataTransfer && e.dataTransfer.files) || e.nativeEvent.target.files;
		if (files.length === 0) {
			return;
		}

		const fileExt = files[0].name.split('.').pop().toLowerCase();
		if (allowedExtensions.split(',').indexOf(fileExt) === -1) {
			// eslint-disable-next-line
			alert('File extension not allowed. Currently we allow only ' + allowedExtensions + ' files.');
			return;
		}

		setFile(files[0]);
		const fileurl = URL.createObjectURL(files[0])
		setVideoUrl(fileurl);
		setVideoDetails({
			title: files[0].name.replace(/\s/g, '_')
		});
		await fetchVideoId(
			files[0].name.replace(/\s/g, '_')
			, fileurl, files[0], setVideoId, navigate, currentUser, setCurrentSubStep, updateAppState, setVideoUrl);

	};

	const dropped = e => {
		e.preventDefault();
		setMouseHover(false);
		onFileUpload(e);
	};

	// Call the function to fetch the UUID

	useEffect(() => {
		setTitle(requiredTitle);
		checkFileExist(requiredTitle, updateAppState, setVideoDetails, setVideoUrl, setCurrentStep);
	}, [requiredTitle]);

	const onUrlInput = async (e) => {
		const inputURl = e.target.value
		if (inputURl.includes('https://commons.wikimedia.org/wiki/File')) {
			setTimeout(() => {
				setLoading(true);
			}, 2000)
		}
		setTitle(inputURl);
		try {
			const result = await checkFileExist(inputURl, updateAppState, setVideoDetails, setVideoUrl, setLoading);
			if (result) {
				fetchVideoId(result.title, result.url, null, setVideoId, navigate, currentUser, setCurrentSubStep, updateAppState, setVideoUrl);
			}
		}
		catch (e) {
			console.log(e);
		}
	};

	return (
		<>
			{loading ? (
				<div id="main-container">
					<Message id="task-stage-downloading" />
					<Spinner animation="border" className="mt-4" />
				</div>
			) : (
				<div id="url-box" data-step-count="1">
					<div className="url-box-container">
						<div className="upload-info-message">
							<Message id="upload-upload-text" />
						</div>
						<input
							className="d-none"
							ref={fileUpload}
							type="file"
							id="upload-file-input"
							accept={allowedExtensions}
							onChange={onFileUpload}
							autoComplete="on"
						/>
						<div
							className="drop-area"
							data-mouseover={mouseHover ? "true" : "false"}
							onDragEnter={dragEnter}
							onDragLeave={dragLeave}
							onDragOver={dragOver}
							onDrop={dropped}
						>
							<InputGroup className="upload-url-input">
								<Form.Control
									className="url-input"
									type="text"
									placeholder="https://commons.wikimedia.org/wiki/File:video.webm"
									onChange={onUrlInput}
									autoComplete="true"
									value={title}
								/>
							</InputGroup>
							{/* <Button className='inputbox-url'><img src={closebutton} alt="closebutton" /></Button> */}
							<div className="or-container">
								<div className="left-line"></div>
								<div className="or-text">Or</div>
								<div className="right-line"></div>
							</div>
							<Form.Label className="drop-area-click" htmlFor="upload-file-input" ref={fileUpload}>
								Choose video
							</Form.Label>
							{/* <p>Drop files here</p> */}
						</div>
					</div>
				</div>
			)}
		</>
	);

}
export default UrlBox;
