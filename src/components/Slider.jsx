function Slider(props) {
	return (
				<div className="slider">
			<div className="slider-inner">
				<input
					type="range"
					min="0"
					max="100"
					id="slider"
					onChange={props.onChange}
					value={props.value}
				/>
			</div>
			<div className="volume-value">
				<span>{props.value}%</span>
			</div>
		</div>
			);
}
export default Slider;
