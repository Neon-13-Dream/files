// DatePicker.jsx
import { React } from "jimu-core";
import "./style.css";

export default function DatePicker({
    value,
    onChange,
    placeholder = "дд.мм.гггг",
    minYear = 1970,
    weekDays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"],
    monthNames = [
        "Янв", "Фев", "Мар", "Апр", "Май", "Июн",
        "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"
    ],
    className
}) {
    const today = new Date();            // added
    const maxYear = today.getFullYear(); // changed

    const parsedValue = parseDate(value);

    const [open, setOpen] = React.useState(false);
    const [mode, setMode] = React.useState("days");

    const [selected, setSelected] = React.useState(parsedValue);

    const [view, setView] = React.useState({
        year: parsedValue?.year ?? today.getFullYear(),
        month: parsedValue?.month ?? today.getMonth()
    });

    const ref = React.useRef(null);

    React.useEffect(() => {
        if (parsedValue) {
            setSelected(parsedValue);
            setView({ year: parsedValue.year, month: parsedValue.month });
        }
    }, [value]);

    React.useEffect(() => {
        const handleClick = (e: any) => {
            if (ref.current && !ref.current.contains(e.target)) {
                setOpen(false);
                setMode("days");
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    React.useEffect(() => {
        if (open) {
            const src = parsedValue ?? selected;
            if (src) {
                setView({ year: src.year, month: src.month });
            } else {
                setView({ year: today.getFullYear(), month: today.getMonth() });
            }
        }
    }, [open]);

    function parseDate(str: any) {
        if (!str) return null;
        const p = String(str).split(".");
        if (p.length !== 3) return null;
        const day = Number(p[0]);
        const month = Number(p[1]) - 1;
        const year = Number(p[2]);
        if (Number.isNaN(day) || Number.isNaN(month) || Number.isNaN(year)) return null;
        return { day, month, year };
    }

    function formatDate(obj: any) {
        if (!obj) return "";
        return `${String(obj.day).padStart(2, "0")}.${String(obj.month + 1).padStart(2, "0")}.${obj.year}`;
    }

    function selectDay(day: any) {
        const date = { day, month: view.month, year: view.year };
        setSelected(date);
        onChange?.(formatDate(date));
        setOpen(false);
        setMode("days");
    }

    function changeMonth(n: any) {
        let m = view.month + n;
        let y = view.year;
        if (m < 0) { m = 11; y--; }
        if (m > 11) { m = 0; y++; }
        if (y >= minYear && y <= maxYear) setView({ year: y, month: m });
    }

    function changeYear(n: any) {
        const y = view.year + n;
        if (y >= minYear && y <= maxYear) setView({ ...view, year: y });
    }

    // ---------- generate days WITH disable logic ----------
    function generateDays(year: any, month: any) {
        const date = new Date(year, month, 1);
        const startDay = (date.getDay() + 6) % 7;
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysPrev = new Date(year, month, 0).getDate();

        const res = [];
        let counter = 1;

        for (let i = 0; i < 42; i++) {
            let dayObj;

            if (i < startDay) {
                const d = daysPrev - (startDay - 1 - i);

                const cellDate = new Date(year, month - 1, d);
                dayObj = {
                    day: d,
                    current: false,
                    disabled: cellDate > today       // added
                };

            } else if (counter <= daysInMonth) {
                const cellDate = new Date(year, month, counter);

                dayObj = {
                    day: counter,
                    current: true,
                    disabled: cellDate > today       // added
                };

                counter++;
            } else {
                const d = counter - daysInMonth;

                const cellDate = new Date(year, month + 1, d);
                dayObj = {
                    day: d,
                    current: false,
                    disabled: cellDate > today       // added
                };

                counter++;
            }

            res.push(dayObj);
        }

        return res;
    }

    const actualSelected = parsedValue ?? selected;

    return (
        <div className="datepicker-container" ref={ref}>
            <input
                // value={formatDate(actualSelected)}
                value={value ?? ""}
                placeholder={placeholder}
                onChange={(e) => {
                    onChange?.(e.target.value);
                    const parsed = parseDate(e.target.value);
                    if (parsed) setSelected(parsed);
                }}
                onFocus={() => setOpen(true)}
                className={className}
            />

            {open && (
                <div className="datepicker-popup">

                    {/* header */}
                    <div className="dp-header">
                        <button onClick={() =>
                            mode === "days" ? changeYear(-1) :
                                changeYear(-5)
                        }>{'<<'}</button>

                        <button onClick={() =>
                            mode === "days" ? changeMonth(-1) :
                                changeYear(-1)
                        }>{'<'}</button>

                        <button
                            onClick={() =>
                                setMode(mode === "days" ? "months" : mode === "months" ? "years" : "days")
                            }
                            className="dp-center-btn"
                        >
                            {mode === "days" && `${monthNames[view.month]} ${view.year}`}
                            {mode === "months" && view.year}
                            {mode === "years" && `${view.year}`}
                        </button>

                        <button onClick={() =>
                            mode === "days" ? changeMonth(+1) :
                                changeYear(+1)
                        }>{'>'}</button>

                        <button onClick={() =>
                            mode === "days" ? changeYear(+1) :
                                changeYear(+5)
                        }>{'>>'}</button>
                    </div>

                    {/* days */}
                    {mode === "days" && (
                        <>
                            <div className="dp-week-row">
                                {weekDays.map((w, i) => <div key={i} className="dp-week-item">{w}</div>)}
                            </div>

                            <div className="dp-days-grid">
                                {generateDays(view.year, view.month).map((d, i) => {
                                    const isSelected =
                                        actualSelected &&
                                        actualSelected.year === view.year &&
                                        actualSelected.month === view.month &&
                                        actualSelected.day === d.day;

                                    return (
                                        <div
                                            key={i}
                                            className={
                                                "dp-cell dp-day-item " +
                                                (d.current ? "dp-current" : "dp-other") +
                                                (d.disabled ? " dp-other" : "") +  // added
                                                (isSelected ? " dp-selected" : "")
                                            }
                                            onClick={() => !d.disabled && d.current && selectDay(d.day)}
                                        >
                                            {d.day}
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}

                    {/* months */}
                    {mode === "months" && (
                        <div className="dp-months-grid">
                            {monthNames.map((m, i) => {
                                const isFutureMonth =
                                    view.year === today.getFullYear() && i > today.getMonth(); // added

                                if (isFutureMonth) return null; // hide

                                const isSelected =
                                    actualSelected &&
                                    actualSelected.year === view.year &&
                                    actualSelected.month === i;

                                return (
                                    <div
                                        key={i}
                                        className={
                                            "dp-cell dp-month-item" +
                                            (isSelected ? " dp-selected" : "")
                                        }
                                        onClick={() => {
                                            if (!isFutureMonth) {
                                                setView({ ...view, month: i });
                                                setMode("days");
                                            }
                                        }}
                                    >
                                        {m}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* years */}
                    {mode === "years" && (
                        <div className="dp-years-grid">
                            {Array.from({ length: maxYear - minYear + 1 }, (_, idx) => minYear + idx).map((y) => (
                                <div
                                    key={y}
                                    className={
                                        "dp-cell dp-year-item" +
                                        (actualSelected && actualSelected.year === y ? " dp-selected" : "")
                                    }
                                    onClick={() => { setView({ ...view, year: y }); setMode("months"); }}
                                >
                                    {y}
                                </div>
                            ))}
                        </div>
                    )}

                </div>
            )}
        </div>
    );
}
