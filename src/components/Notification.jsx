import { useContext, useEffect } from 'react';
import { Toast } from 'react-bootstrap';
import {
	InfoCircleFill,
	ExclamationCircleFill,
	ExclamationTriangleFill,
	CheckCircleFill
} from 'react-bootstrap-icons';
import { Message } from '@wikimedia/react.i18n';
import { GlobalContext } from '../context/GlobalContext';

function Notification() {
	// if notification type is not present, default to info
	const notificationTypes = {
		info: <InfoCircleFill />,
		warning: <ExclamationTriangleFill />,
		error: <ExclamationCircleFill />,
		success: <CheckCircleFill />
	};
	const defaultType = 'info';

	const { appState, updateNotification } = useContext(GlobalContext);
	const { notifications } = appState;

	const onToastClose = index => {
		updateNotification({ show: false }, index);
	};

	useEffect(() => {
		// Automatically close notifications after 5 seconds
		const notificationTimeout = setTimeout(() => {
		  notifications.forEach((notification, index) => {
			if (notification.show) {
			  onToastClose(index);
			}
		  });
		}, 5000);
	
		// Clear the timeout when the component is unmounted or when notifications change
		return () => clearTimeout(notificationTimeout);
	  }, [notifications]);

	return (
		<div id="notification-wrapper">
			{notifications.map((notification, index) => (
				<Toast
					key={`notification-${index}`}
					onClose={() => onToastClose(index)}
					show={notification.show}
					data-type={notification.type}
					// eslint-disable-next-line
					{...(notification.autohide && notification.type !== 'error'
						? { delay: notification.delay, autohide: true }
						: { autohide: false })}
				>
					<div className="notification-icon">
						{Object.keys(notificationTypes).includes(notification.type)
							? notificationTypes[notification.type]
							: notificationTypes[defaultType]}
					</div>
					<div className="notification-header">
						<strong className="me-auto">
							{Object.keys(notificationTypes).includes(notification.type) ? (
								<Message id={`notifications-title-${notification.type}`} />
							) : (
								<Message id={`notifications-title-${defaultType}`} />
							)}
						</strong>
						<button
							type="button"
							className="ms-2 mb-1 close"
							data-dismiss="notification-wrapper"
							aria-label="Close"
							onClick={() => onToastClose(index)}
						>
							<span aria-hidden="true">&times;</span>
						</button>
					</div>
					<div className="notification-body">
						{notification.messageId ? (
							<Message
								id={notification.messageId}
								// applies placeholder when text is present
								placeholders={notification.text && [notification.text]}
							/>
						) : (
							// applies text when messageId is not present, and notification.text is present
							notification.text && notification.text
						)}
					</div>
					<div className="notification-footer">
						{notification.footerId && (
							<Message
								id={notification.footerId}
								placeholders={
									// applies placeholder if link is present
									notification.link && [
										<a href={notification.link} target="_blank" rel="noreferrer">
											<Message id={notification.linkTitle} />
										</a>
									]
								}
							/>
						)}
					</div>
				</Toast>
			))}
		</div>
	);
}

export default Notification;
