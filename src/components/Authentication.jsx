import React, { useContext } from 'react';
import { Button, OverlayTrigger } from 'react-bootstrap';
import { Message } from '@wikimedia/react.i18n';
import { GlobalContext } from '../context/GlobalContext';
import { onLogin, onLogOut } from '../utils/auth';
import ENV_SETTINGS from '../env';

const { base_wiki_url,backend_url } = ENV_SETTINGS();
import { UserContext } from '../context/UserContext';
import GeneralPopover from './GeneralPopover';

function Authentication() {
	const { updateAppState } = useContext(GlobalContext);
	const { setCurrentUser, currentUser: user } = useContext(UserContext);
	// Login redirect URL to the back-end server
	const handleLogin = () => {
		onLogin(backend_url, setCurrentUser, updateAppState);
	};

	const handleLogOut = () => {
		onLogOut(updateAppState, setCurrentUser);
	};
	const TruncatedUsername = (username) => {
		if (username) {
			const truncatedUsername = username.length > 10 ? `${username.slice(0, 10)}...` : username;
			return truncatedUsername
		}
		return '';
	};

	const popoverProps = {
		id: 'popover-basic',
		title: <Message id="logout-confirm-text" />,
		body: (
			<div>
				<Button variant="primary" size="sm" onClick={handleLogOut}>
					<Message id="logout-confirm-yes" />
				</Button>
				<Button
					variant="light"
					size="sm"
					onClick={() => document.querySelector('#logout-button').click()}
				>
					<Message id="logout-confirm-no" />
				</Button>
			</div>
		)
	};
	return (
		<div>
			{!user && (
				<div className="functionality-btn">
					<Button variant="secondary" onClick={handleLogin} data-testid="login">
						<Message id="login" />
					</Button>
				</div>
			)}

			{user && (
				<div className="functionality-btn">
					<span data-testid="username">
						<Message
							id="welcome"
							placeholders={[
								<a
									className="font-weight-bold"
									href={`${base_wiki_url}/wiki/user:${user.username}`}
								>
									{TruncatedUsername(user.username)}
								</a>
							]}
						/>
					</span>
					<span className="logout-btn">
						<OverlayTrigger
							trigger="click"
							rootClose
							placement="bottom"
							overlay={GeneralPopover(popoverProps)}
						>
							<Button variant="light" id="logout-button" size="sm">
								<Message id="logout" />
							</Button>
						</OverlayTrigger>
					</span>
				</div>
			)}
		</div>
	);
}

export default Authentication;
