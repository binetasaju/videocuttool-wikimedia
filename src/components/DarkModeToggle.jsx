import lightmode from '../lightmode.svg';
import darkmode from '../darkmode.svg';

function DarkModeToggle(props) {
	return (
		<div className="dark-mode-toggle">
			<input
				type="checkbox"
				id="darkmode-input"
				name="darkmode-input"
				onClick={props.switchTheme}
				checked={props.theme === 'dark' ? true : false}
				onChange={e => { }}
			/>
			<label className="darkmode-label" htmlFor="darkmode-input">
				{props.theme === "dark" ? <img src={darkmode} alt="light mode icon" className="lightmode-icon" /> : <img src={lightmode} alt="dark mode icon" className="darkmode-icon" />}
			</label>
		</div>
	);
}
export default DarkModeToggle;
