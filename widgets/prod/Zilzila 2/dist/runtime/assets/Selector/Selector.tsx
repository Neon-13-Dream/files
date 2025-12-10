import { React } from "jimu-core"
import "./Selector.css"

interface selectorProps {
	value: string
	options: string[]
	onChange: (selected: string) => void
	openUp: boolean
}

export default function Selector(props: selectorProps) {
	const [isSelectorVisible, setSelectorVisible] = React.useState(false)

	return (
		<div className="selectorBtnArea">
			<div className="selectorBtn" onClick={() => { setSelectorVisible(!isSelectorVisible) }}>
				{props.value} {isSelectorVisible ? (
					<span className="arrow">▲</span>
				) : (
					<span className="arrow">▼</span>
				)}
			</div>

			{isSelectorVisible && <div className={`optionsArea ${props.openUp ? "up" : "down"}`}>
				{props.options.map((item: string) => (
					<div className={`option ${item === props.value ? "activ" : ""}`} onClick={() => {
						setSelectorVisible(!isSelectorVisible)
						props.onChange(item)
					}}>{item}</div>
				))}
			</div>}
		</div>
	)
}
