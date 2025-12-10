import { React } from "jimu-core"
import "./Calendar.css"

interface DateStruct {
    day: number
    month: number
    year: number
}

interface DateInputProps {
    value: string
    onChange: (date: string) => void
    minDate?: string // теперь строкой
    format?: "dd.mm.yyyy" | "yyyy-mm-dd" | "mm/dd/yyyy"
    weekDays?: string[]
    monthNames?: string[]
    className?: string
    afterInfo?: string
}

export default function Calendar(props: DateInputProps) {
    const wrapRef = React.useRef<HTMLDivElement>(null)
    const inputRef = React.useRef<HTMLInputElement>(null)
    const weekDays = props.weekDays || ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"]
    const monthNames = props.monthNames || ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"]

    const today = new Date()

    const parseDate = (v: string | undefined): DateStruct | null => {
        if (!v) return null
        let d: number, m: number, y: number

        if (/^\d{2}\.\d{2}\.\d{4}$/.test(v)) {
            const p = v.split(".")
            d = +p[0]
            m = +p[1] - 1
            y = +p[2]
        } else if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
            const p = v.split("-")
            y = +p[0]
            m = +p[1] - 1
            d = +p[2]
        } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(v)) {
            const p = v.split("/")
            m = +p[0] - 1
            d = +p[1]
            y = +p[2]
        } else return null

        return { day: d, month: m, year: y }
    }

    const [isOpen, setOpen] = React.useState(false)
    const [mode, setMode] = React.useState<"days" | "months" | "years">("days")
    const [selected, setSelected] = React.useState<DateStruct>({ day: -1, month: -1, year: -1 })
    const [view, setView] = React.useState<DateStruct>({
        day: today.getDate(),
        month: today.getMonth(),
        year: today.getFullYear()
    })

    const minDate = parseDate(props.minDate) || { day: 1, month: 0, year: 1970 }

    // ====================== Формат входящего значения ======================
    React.useEffect(() => {
        const sel = parseDate(props.value)
        if (sel) {
            setSelected(sel)
            setView(sel)
        } else {
            setSelected({ day: -1, month: -1, year: -1 })
        }
    }, [props.value])

    // ====================== Формат вывода ======================
    function formatDate(d: DateStruct) {
        const dd = String(d.day).padStart(2, "0")
        const mm = String(d.month + 1).padStart(2, "0")
        const yy = d.year

        switch (props.format) {
            case "yyyy-mm-dd":
                return `${yy}-${mm}-${dd}`
            case "mm/dd/yyyy":
                return `${mm}/${dd}/${yy}`
            default:
                return `${dd}.${mm}.${yy}`
        }
    }

    // ====================== Ограничения ======================
    function isDisabledDay(d: DateStruct, currentMonth: number) {
        const t = new Date(d.year, d.month, d.day)
        const min = new Date(minDate.year, minDate.month, minDate.day)
        const max = new Date(today.getFullYear(), today.getMonth(), today.getDate())
        return d.month !== currentMonth || t < min || t > max
    }

    function isDisabledMonth(month: number, year: number) {
        if (year < minDate.year || year > today.getFullYear()) return true
        if (year === minDate.year && month < minDate.month) return true
        if (year === today.getFullYear() && month > today.getMonth()) return true
        return false
    }

    function isDisabledYear(year: number) {
        return year < minDate.year || year > today.getFullYear()
    }

    // ====================== Дни ======================
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
                obj.month = m - 1 < 0 ? 11 : m - 1
                obj.year = m - 1 < 0 ? y - 1 : y
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

    function selectDay(d: DateStruct) {
        if (
            selected.day === d.day &&
            selected.month === d.month &&
            selected.year === d.year
        ) {
            setSelected({ day: -1, month: -1, year: -1 })
            props.onChange("")
            setOpen(false)
            return
        }

        if (isDisabledDay(d, view.month)) return

        setSelected(d)
        props.onChange(formatDate(d))
        setOpen(false)
        setMode("days")
    }

    // ====================== Клик вне ======================
    React.useEffect(() => {
        const handle = (e: MouseEvent) => {
            if (!wrapRef.current) return
            if (!wrapRef.current.contains(e.target as Node)) {
                setOpen(false)
                setMode("days")
            }
        }
        document.addEventListener("mousedown", handle)
        return () => { document.removeEventListener("mousedown", handle) }
    }, [])

    const handlePrev = () => {
        if (mode === "days") {
            const prevMonth = view.month === 0 ? 11 : view.month - 1
            const prevYear = view.month === 0 ? view.year - 1 : view.year
            if (prevYear < minDate.year || (prevYear === minDate.year && prevMonth < minDate.month)) return
            setView({ ...view, month: prevMonth, year: prevYear })
        } else if (mode === "months") {
            if (view.year <= minDate.year) return
            setView(v => ({ ...v, year: v.year - 1 }))
        }
    }

    const handleNext = () => {
        if (mode === "days") {
            const nextMonth = view.month === 11 ? 0 : view.month + 1
            const nextYear = view.month === 11 ? view.year + 1 : view.year
            if (nextYear > today.getFullYear() || (nextYear === today.getFullYear() && nextMonth > today.getMonth())) return
            setView({ ...view, month: nextMonth, year: nextYear })
        } else if (mode === "months") {
            if (view.year >= today.getFullYear()) return
            setView(v => ({ ...v, year: v.year + 1 }))
        }
    }

    return (
        <div ref={wrapRef} className="calendarInputArea">
            <input
                ref={inputRef}
                className={props.className}
                value={props.value}
                onChange={(e) => { props.onChange(e.target.value) }}
                onFocus={() => { setOpen(true) }}
                placeholder="дд.мм.гггг"
            />
            {props.afterInfo}

            <div className={`calendarPopup ${isOpen ? "open" : ""}`}>
                <div className="calendarBtns">
                    <div className="calendarBtn" onClick={handlePrev}>{"<"}</div>
                    <div
                        className="calendarInfo"
                        onClick={() => {
                            if (mode === "days") setMode("months")
                            else if (mode === "months") setMode("years")
                            else setMode("days")
                        }}
                    >
                        {mode === "days" &&
                            (selected.day > 0
                                ? `${String(selected.day).padStart(2, "0")}.${String(selected.month + 1).padStart(2, "0")}.${selected.year}`
                                : `${String(view.day).padStart(2, "0")}.${String(view.month + 1).padStart(2, "0")}.${view.year}`)}
                        {mode === "months" && view.year}
                        {mode === "years" && `${minDate.year} - ${today.getFullYear()}`}
                    </div>
                    <div className="calendarBtn" onClick={handleNext}>{">"}</div>
                </div>

                <div className="line" />

                {mode === "days" && (
                    <>
                        <div className="weeksArea">
                            {weekDays.map((w) => (
                                <div key={w} className="weeks">{w}</div>
                            ))}
                        </div>
                        <div className="daysArea">
                            {getCalendar(view.year, view.month).map((d, i) => {
                                const active =
                                    d.day === selected.day &&
                                    d.month === selected.month &&
                                    d.year === selected.year
                                return (
                                    <div
                                        key={i}
                                        className={
                                            "days " +
                                            (active ? "activ " : "") +
                                            (isDisabledDay(d, view.month) ? "disabled" : "")
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
                        {monthNames.map((m, i) => (
                            <div
                                key={i}
                                className={
                                    "month " +
                                    (i === selected.month && view.year === selected.year ? "activ " : "") +
                                    (isDisabledMonth(i, view.year) ? "disabled" : "")
                                }
                                onClick={() => {
                                    if (isDisabledMonth(i, view.year)) return
                                    setView(v => ({ ...v, month: i }))
                                    setMode("days")
                                }}
                            >
                                {m}
                            </div>
                        ))}
                    </div>
                )}

                {mode === "years" && (
                    <div className="yearArea">
                        {Array.from({ length: today.getFullYear() - minDate.year + 1 }).map((_, i) => {
                            const year = minDate.year + i
                            return (
                                <div
                                    key={year}
                                    className={"year " + (year === selected.year ? "activ" : "") + (isDisabledYear(year) ? "disabled" : "")}
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
