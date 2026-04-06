import { React } from "jimu-core"
import "./Calendar.css"

interface DateStruct {
	day: number
	month: number // 0-11
	year: number
}

interface DateInputProps {
	value: string
	onChange: (date: string) => void
	minDate?: string
	maxDate?: string
	format?: string // например "%D.%M.%Y" или "%D/%M/%Y"
	weekDays?: string[]
	monthNames?: string[]
	className?: string
	afterInfo?: string
	placeholder?: string
}

export default function Calendar(props: DateInputProps) {
	const wrapRef = React.useRef<HTMLDivElement>(null)
	const inputRef = React.useRef<HTMLInputElement>(null)
	const today = new Date()

	// ====================== Проверка и инициализация weekDays/monthNames ======================
	const weekDays = props.weekDays && props.weekDays.length === 7
		? props.weekDays
		: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"]

	const monthNames = props.monthNames && props.monthNames.length === 12
		? props.monthNames
		: ["Янв", "Фев", "Мар", "Апр", "Май", "Июн",
			"Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"]

	// ====================== Парсинг даты ======================
	function parseDate(value?: string): DateStruct | null {
		if (!value || !props.format) return null

		// Определяем разделитель из формата (первый символ между %D и %M)
		const sepMatch = props.format.match(/%D(.)%M/)
		const sep = sepMatch ? sepMatch[1] : "."

		const parts = value.split(sep).map(v => parseInt(v))
		if (parts.length !== 3) return null

		// Определяем индексы дня, месяца и года по формату
		const indices: { [key: string]: number } = {
			"%D": props.format.indexOf("%D") / 3,
			"%M": props.format.indexOf("%M") / 3,
			"%Y": props.format.indexOf("%Y") / 3,
		}

		const arr: number[] = []
		arr[indices["%D"]] = parts[0]
		arr[indices["%M"]] = parts[1]
		arr[indices["%Y"]] = parts[2]

		return { day: arr[0], month: arr[1] - 1, year: arr[2] }
	}

	// ====================== MIN / MAX ======================
	const minDate: DateStruct = parseDate(props.minDate) ?? { day: 1, month: 0, year: 1970 }
	const maxDate: DateStruct = parseDate(props.maxDate) ?? { day: today.getDate(), month: today.getMonth(), year: today.getFullYear() }

	const min = new Date(minDate.year > 0 ? minDate.year : 1970, minDate.month, minDate.day)
	const max = new Date(maxDate.year > 0 ? maxDate.year : today.getFullYear(), maxDate.month, maxDate.day)

	// ====================== State ======================
	const [isOpen, setOpen] = React.useState(false)
	const [mode, setMode] = React.useState<"days" | "months" | "years">("days")
	const [selected, setSelected] = React.useState<DateStruct>({ day: -1, month: -1, year: -1 })
	const [view, setView] = React.useState<DateStruct>({ day: today.getDate(), month: today.getMonth(), year: today.getFullYear() })

	// ====================== Входящее значение ======================
	React.useEffect(() => {
		const parsed = parseDate(props.value)
		if (!parsed) {
			setSelected({ day: -1, month: -1, year: -1 })
			return
		}
		setSelected(parsed)
		setView(parsed)
	}, [props.value])

	// ====================== Формат вывода ======================
	function formatDate(d: DateStruct) {
		if (!props.format) return `${d.day}.${d.month + 1}.${d.year}`
		return props.format
			.replace(/%D/g, String(d.day).padStart(2, "0"))
			.replace(/%M/g, String(d.month + 1).padStart(2, "0"))
			.replace(/%Y/g, String(d.year))
	}

	// ====================== Ограничения ======================
	function isDisabledDay(d: DateStruct) {
		const t = new Date(d.year > 0 ? d.year : today.getFullYear(), d.month, d.day)
		return t < min || t > max
	}

	function isDisabledMonth(month: number, year: number) {
		const start = new Date(year, month, 1)
		const end = new Date(year, month + 1, 0)
		return end < min || start > max
	}

	function isDisabledYear(year: number) {
		if (minDate.year <= 0 && maxDate.year <= 0) return true
		return year < minDate.year || year > maxDate.year
	}

	// ====================== Календарь ======================
	function getCalendar(y: number, m: number) {
		const result: DateStruct[] = []
		const startDay = (new Date(y, m, 1).getDay() + 6) % 7
		const daysInMonth = new Date(y, m + 1, 0).getDate()
		const daysPrev = new Date(y, m, 0).getDate()
		let day = 1

		for (let i = 0; i < 42; i++) {
			const obj: DateStruct = { day: 0, month: m, year: y }

			if (i < startDay) {
				obj.day = daysPrev - (startDay - 1 - i)
				obj.month = m === 0 ? 11 : m - 1
				obj.year = m === 0 ? y - 1 : y
			} else if (day <= daysInMonth) {
				obj.day = day++
			} else {
				obj.day = day - daysInMonth
				obj.month = (m + 1) % 12
				obj.year = m === 11 ? y + 1 : y
				day++
			}

			result.push(obj)
		}
		return result
	}

	// ====================== Выбор дня ======================
	function selectDay(d: DateStruct) {
		if (isDisabledDay(d)) return

		// Если кликнули на уже выбранный день — снимаем выделение
		if (selected.day === d.day && selected.month === d.month && selected.year === d.year) {
			setSelected({ day: -1, month: -1, year: -1 })
			props.onChange("")  // возвращаем пустую строку
			setView({ year: today.getFullYear(), month: today.getMonth(), day: today.getDate() })
			return
		}

		setSelected(d)
		setView({ year: d.year, month: d.month, day: d.day })
		props.onChange(formatDate(d))
		setOpen(false)
		setMode("days")
	}

	// ====================== Клик вне ======================
	React.useEffect(() => {
		const handle = (e: MouseEvent) => {
			if (!wrapRef.current?.contains(e.target as Node)) {
				setOpen(false)
				setMode("days")
			}
		}
		document.addEventListener("mousedown", handle)
		return () => { document.removeEventListener("mousedown", handle) }
	}, [])

	// ====================== Навигация ======================
	const handlePrev = () => {
		if (mode === "days") {
			const prevMonth = view.month === 0 ? 11 : view.month - 1
			const prevYear = view.month === 0 ? view.year - 1 : view.year
			if (new Date(prevYear, prevMonth + 1, 0) < min) return
			setView({ ...view, month: prevMonth, year: prevYear })
		} else if (mode === "months") {
			if (view.year <= minDate.year) return
			setView(v => ({ ...v, year: v.year - 1 }))
		} else if (mode === "years") {
			setView(v => ({ ...v, year: v.year - 10 }))
		}
	}

	const handleNext = () => {
		if (mode === "days") {
			const nextMonth = view.month === 11 ? 0 : view.month + 1
			const nextYear = view.month === 11 ? view.year + 1 : view.year
			if (new Date(nextYear, nextMonth, 1) > max) return
			setView({ ...view, month: nextMonth, year: nextYear })
		} else if (mode === "months") {
			if (view.year >= maxDate.year) return
			setView(v => ({ ...v, year: v.year + 1 }))
		} else if (mode === "years") {
			setView(v => ({ ...v, year: v.year + 10 }))
		}
	}

	// ====================== Render ======================
	return (
		<div ref={wrapRef} className="calendarInputArea">
			<input
				ref={inputRef}
				className={props.className}
				value={props.value}
				onChange={e => { props.onChange(e.target.value) }}
				onFocus={() => { setOpen(true) }}
				placeholder={props.placeholder}
			/>
			{props.afterInfo}

			<div className={`calendarPopup ${isOpen ? "open" : ""}`}>
				<div className="calendarBtns">
					<div className="calendarBtn" onClick={handlePrev}>{"<"}</div>
					<div
						className="calendarInfo"
						onClick={() => {
							setMode(mode === "days" ? "months" : mode === "months" ? "years" : "days")
						}}
					>
						{mode === "days" && `${String(view.month + 1).padStart(2, "0")}.${view.year}`}
						{mode === "months" && view.year}
						{mode === "years" && minDate.year > 0 && maxDate.year > 0 && `${minDate.year} - ${maxDate.year}`}
					</div>
					<div className="calendarBtn" onClick={handleNext}>{">"}</div>
				</div>

				<div className="line" />

				{mode === "days" && (
					<>
						<div className="weeksArea">
							{weekDays.map(w => <div key={w} className="weeks">{w}</div>)}
						</div>
						<div className="daysArea">
							{getCalendar(view.year, view.month).map((d, i) => {
								const isSelected = d.day === selected.day && d.month === selected.month && d.year === selected.year
								const isToday = d.day === today.getDate() && d.month === today.getMonth() && d.year === today.getFullYear()
								const inCurrentMonth = d.month === view.month

								return (
									<div
										key={i}
										className={
											"days " +
											(isSelected ? "selected-day " : "") +
											(isToday ? "today-day " : "") +
											(!inCurrentMonth ? "other-month " : "") +
											(isDisabledDay(d) ? "disabled" : "")
										}
										onClick={() => { selectDay(d) }}
									>
										{d.day}
									</div>
								)
							})}
						</div>
					</>
				)}

				{mode === "months" && (
					<div className="monthArea">
						{monthNames.map((m, i) => {
							const isSelectedMonth = view.month === i
							return (
								<div
									key={i}
									className={`month ${isDisabledMonth(i, view.year) ? "disabled" : ""} ${isSelectedMonth ? "selected-month" : ""}`}
									onClick={() => {
										if (isDisabledMonth(i, view.year)) return
										setView(v => ({ ...v, month: i }))
										setMode("days")
									}}
								>
									{m}
								</div>
							)
						})}
					</div>
				)}

				{mode === "years" && minDate.year > 0 && maxDate.year > 0 && (
					<div className="yearArea">
						{Array.from({ length: maxDate.year - minDate.year + 1 }).map((_, i) => {
							const year = minDate.year + i
							return (
								<div
									key={year}
									className={`year ${year === selected.year ? "activ" : ""}`}
									onClick={() => {
										if (isDisabledYear(year)) return
										setView(v => ({ ...v, year }))
										setMode("months")
									}}
								>
									{year}
								</div>
							)
						})}
					</div>
				)}
			</div>
		</div>
	)
}
