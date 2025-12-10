import { React } from "jimu-core"
import Calendar from "../Calendar/Calendar"
import type { dataFilterStruct } from "../../config"
import "./Filter.css"

import closeImg from "../imgs/close.png"
import clearImg from "../imgs/reload.png"
import { min } from "lodash-es"

interface filterProps {
    filter: dataFilterStruct;
    minDate: string
    onChange: (filter: dataFilterStruct) => void;
    active: boolean;
    close: (toggle: boolean) => void;
}

export default function Filter(props: filterProps) {
    const [tempFilter, setTempFilter] = React.useState<dataFilterStruct>({ ...props.filter })
    const [dateInput, setDateInput] = React.useState<{ from: string, to: string }>({
        from: props.filter.from_date,
        to: props.filter.to_date
    })

    // Мап для названий
    const filters = {
        Magnituda: "magnitude",
        Chuqurlik: "depth",
        Kenglik: "latitude",
        Uzoqlik: "longitude"
    }

    // 🔥 Универсальный update, который СБРАСЫВАЕТ страницу
    function updateFilterReset(field: keyof dataFilterStruct, value: string) {
        const updated: dataFilterStruct = {
            ...tempFilter,
            [field]: value === "" ? "" : value,
            page: 0
        }

        setTempFilter(updated)
        props.onChange(updated)
    }

    // ---- обновление эпицентра ----
    function updateEpicenter(value: string) {
        const updated = {
            ...tempFilter,
            epicenter: value,
            page: 0
        }
        setTempFilter(updated)
        props.onChange(updated)
    }

    // ---- обновление дат ----
    function updateDate(field: "from_date" | "to_date", value: string) {
        setDateInput(prev => ({
            ...prev,
            [field === "from_date" ? "from" : "to"]: value
        }))

        const updated = {
            ...tempFilter,
            [field]: value,
            page: 0
        }

        setTempFilter(updated)
        props.onChange(updated)
    }

    // ---- сброс ----
    function clearFilter() {
        const cleared: dataFilterStruct = {
            sort: "datetime_desc",
            per_page: 10,
            page: 0,
            epicenter: "",
            from_date: "",
            to_date: "",
            from_magnitude: "",
            to_magnitude: "",
            from_depth: "",
            to_depth: "",
            from_latitude: "",
            to_latitude: "",
            from_longitude: "",
            to_longitude: ""
        }

        setTempFilter(cleared)
        setDateInput({ from: "", to: "" })
        props.onChange(cleared)
    }

    // синхронизация снаружи
    React.useEffect(() => {
        setTempFilter({ ...props.filter })
        setDateInput({
            from: props.filter.from_date,
            to: props.filter.to_date,
        })
    }, [props.filter])

    if (!props.active) return null

    return (
        <div className="filtersArea">

            <div className="filterTitle">
                Filtrlash
                <div className="filterBtns">
                    <div className="btnStyle" onClick={() => clearFilter()}>
                        <img className="imgStyle" src={clearImg} />
                    </div>
                    <div className="btnStyle" onClick={() => props.close(false)}>
                        <img className="imgStyle" src={closeImg} />
                    </div>
                </div>
            </div>

            {/* --- Большой верхний input для поиска по эпицентрам --- */}
            <div className="filter">
                <div className="filterName">Epitsentr</div>
                <div className="inputStyle">
                    <input
                        type="text"
                        className="filterInput bigInput"
                        placeholder="Hudud nomi"
                        value={tempFilter.epicenter}
                        onChange={e => updateEpicenter(e.target.value)}
                    />
                </div>
            </div>

            {/* ---- Фильтр по дате ---- */}
            <div className="dateFilter">
                <div className="filterName">Sana</div>

                <div className="filterArea">
                    <div className="inputStyle">
                        <Calendar
                            value={dateInput.from}
                            minDate={props.minDate}
                            onChange={val => updateDate("from_date", val)}
                            weekDays={["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"]}
                            monthNames={["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"]}
                            className="filterInput"
                            afterInfo="dan"
                        />
                    </div>

                    <div className="inputStyle">
                        <Calendar
                            value={dateInput.to}
                            minDate={dateInput.from}
                            onChange={val => updateDate("to_date", val)}
                            weekDays={["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"]}
                            monthNames={["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"]}
                            className="filterInput"
                            afterInfo="gacha"
                        />
                    </div>
                </div>
            </div>

            {/* ---- Остальные числовые фильтры ---- */}
            {Object.keys(filters).map(item => (
                <div className="filter" key={item}>
                    <div className="filterName">{item}</div>

                    <div className="filterArea">
                        <div className="inputStyle">
                            <div>
                                <input
                                    type="number"
                                    className="filterInput"
                                    placeholder="From"
                                    step="0.1"
                                    min={0}
                                    value={tempFilter[`from_${filters[item]}`]}
                                    onChange={e =>
                                        updateFilterReset(
                                            `from_${filters[item]}` as keyof dataFilterStruct,
                                            e.target.value
                                        )
                                    }
                                />
                                dan
                            </div>
                        </div>

                        <div className="inputStyle">
                            <div>
                                <input
                                    type="number"
                                    className="filterInput"
                                    placeholder="To"
                                    step="0.1"
                                    min={0}
                                    value={tempFilter[`to_${filters[item]}`]}
                                    onChange={e =>
                                        updateFilterReset(
                                            `to_${filters[item]}` as keyof dataFilterStruct,
                                            e.target.value
                                        )
                                    }
                                />
                                gacha
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}
