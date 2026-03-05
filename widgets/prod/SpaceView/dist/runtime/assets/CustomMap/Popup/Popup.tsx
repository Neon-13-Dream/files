import { React } from "jimu-core"
import "./Popup.css"

import Calendar from "../../Calendar/Calendar"
import MinMaxBar from "../../MinMaxBar/MinMaxBat"
import ActivCalendar from "../../imgs/DateCalendarActiv.png"

import {
    allThemes,
    CheckIcon,
    translate
} from "../../../config"

interface popupProps {
    actiom: {
        type: string,
        data: any
    }
    onChange: (where: string) => void
    getTheme: string
    getLang: string
}

interface filterData {
    date_from: string
    date_to: string
    bulut_from: string
    bulut_to: string
    satel_from: string
    satel_to: string
}

interface FieldConfig<T = any> {
    label: string;
    format?: (value: T) => string;
}

interface checkList {
    title: string
    state: boolean
}

const fieldMap: { [key: string]: FieldConfig } = {
    "Catalog_ID": {
        label: "Tasvir ID"
    },
    "Viloyat": {
        label: "Hudud"
    },
    "Tur": {
        label: "Ma'lumot turi"
    },
    "Aniqligi": {
        label: "Fazoviy aniqligi (m/piksel)"
    },
    "Spektral": {
        label: "Spektral kanallar soni"
    },
    "Sana": {
        label: "Kosmik surat olingan sana",
        format: (value: any) => { return value ? new Date(value).toLocaleDateString('ru-RU') : '' }
    },
    "Bulut_qop": {
        label: "Bulut qoplami (%)"
    },
    "Ogish_bur": {
        label: "Og'ish burchagi (')"
    },
    "Radiometri": {
        label: "Radiometrik ko'rsatkichi",
        format: (value: any) => `${value}/piksel`
    },
    "Yuza": {
        label: "Maydoni (kv.km)"
    }
}

export default function Popup(props: popupProps) {
    const [InformationTypes, setInformationTypes] = React.useState<checkList[]>([
        { title: "Optik", state: false },
        { title: "Radiolokatsion", state: false },
        { title: "Relyefning raqamli modellari (DSM/DTM)", state: false },
    ])

    const [SatelliteTypes, setSatelliteTypes] = React.useState<checkList[]>([
        { title: "WorldView-2", state: false },
        { title: "WorldView-3", state: false },
        { title: "Pleiades", state: false },
        { title: "Neo", state: false },
    ])

    const [getFilter, setFilter] = React.useState<filterData>({
        date_from: "",
        date_to: "",
        bulut_from: "",
        bulut_to: "",
        satel_from: "",
        satel_to: ""
    })

    const updateFilter = (field: string, value: any) => {
        setFilter((prev: any) => {
            return {
                ...prev,
                [field]: value
            }
        })
    }

    const buildFilterQuery = () => {
        const conditions: string[] = []

        const toSqlDate = (d: string, endOfDay = false) => {
            const [day, month, year] = d.split(".")

            if (endOfDay) {
                return `TIMESTAMP '${year}-${month}-${day} 23:59:59'`
            }

            return `TIMESTAMP '${year}-${month}-${day} 00:00:00'`
        }

        if (getFilter.date_from && getFilter.date_to) {
            conditions.push(
                `Sana BETWEEN ${toSqlDate(getFilter.date_from)} AND ${toSqlDate(getFilter.date_to, true)}`
            )
        } else if (getFilter.date_from) {
            conditions.push(`Sana >= ${toSqlDate(getFilter.date_from)}`)
        } else if (getFilter.date_to) {
            conditions.push(`Sana <= ${toSqlDate(getFilter.date_to, true)}`)
        }

        if (getFilter.bulut_from !== "" && getFilter.bulut_to !== "") {
            conditions.push(`Bulut_qop BETWEEN ${getFilter.bulut_from} AND ${getFilter.bulut_to}`)
        } else if (getFilter.bulut_from !== "") {
            conditions.push(`Bulut_qop >= ${getFilter.bulut_from}`)
        } else if (getFilter.bulut_to !== "") {
            conditions.push(`Bulut_qop <= ${getFilter.bulut_to}`)
        }

        if (getFilter.satel_from !== "" && getFilter.satel_to !== "") {
            conditions.push(`Aniqligi BETWEEN ${getFilter.satel_from} AND ${getFilter.satel_to}`)
        } else if (getFilter.satel_from !== "") {
            conditions.push(`Aniqligi >= ${getFilter.satel_from}`)
        } else if (getFilter.satel_to !== "") {
            conditions.push(`Aniqligi <= ${getFilter.satel_to}`)
        }

        const selectedInfo = InformationTypes
            .filter(item => item.state)
            .map(item => `'${item.title}'`)

        if (selectedInfo.length) {
            conditions.push(`Tur IN (${selectedInfo.join(", ")})`)
        }

        const selectedSensors = SatelliteTypes
            .filter(item => item.state)
            .map(item => `'${item.title}'`)

        if (selectedSensors.length) {
            conditions.push(`Sensor IN (${selectedSensors.join(", ")})`)
        }

        // conditions.push(`Name NOT LIKE 'Ov%'`)
        const where = conditions.join(" AND ")
        props.onChange(where)
    }

    React.useEffect(() => {
        buildFilterQuery()
    }, [InformationTypes, SatelliteTypes, getFilter])

    // <AreaIcon size="40%" color={`rgb(${allThemes[getTheme]["--main-second-color-rgb"]})`} />
    // <CheckIcon size="40%" color={`rgb(${allThemes[getTheme]["--main-second-color-rgb"]})`} />
    // <CircleIcon size="40%" color={`rgb(${allThemes[getTheme]["--main-second-color-rgb"]})`} />
    // <DeleteIcon size="40%" color={`rgb(${allThemes[getTheme]["--main-second-color-rgb"]})`} />
    // <FilterIcon size="40%" color={`rgb(${allThemes[getTheme]["--main-second-color-rgb"]})`} />
    // <LanguageIcon size="40%" color={`rgb(${allThemes[getTheme]["--main-second-color-rgb"]})`} />
    // <LayersIcon size="40%" color={`rgb(${allThemes[getTheme]["--main-second-color-rgb"]})`} />
    // <MinusIcon size="40%" color={`rgb(${allThemes[getTheme]["--main-second-color-rgb"]})`} />
    // <PlusIcon size="40%" color={`rgb(${allThemes[getTheme]["--main-second-color-rgb"]})`} />
    // <PolygonIcon size="40%" color={`rgb(${allThemes[getTheme]["--main-second-color-rgb"]})`} />
    // <ReactangleIcon size="40%" color={`rgb(${allThemes[getTheme]["--main-second-color-rgb"]})`} />
    // <RulerIcon size="40%" color={`rgb(${allThemes[getTheme]["--main-second-color-rgb"]})`} />
    // <ThemeIcon size="40%" color={`rgb(${allThemes[getTheme]["--main-second-color-rgb"]})`} />
    // <ZoomIcon size="40%" color={`rgb(${allThemes[getTheme]["--main-second-color-rgb"]})`} />
    // <SearchIcon size="40%" color={`rgb(${allThemes[getTheme]["--main-second-color-rgb"]})`} />
    // <LogoIcon size="100px" color={`rgb(${allThemes[getTheme]["--main-second-color-rgb"]})`} />

    return (
        <div className={`PopupArea ${props.actiom.type !== "none" ? 'activ' : ''}`}>
            {props.actiom.type === 'info' ? <div className="PopupInfoArea">
                <div className="PopupTitle">{translate["Tasvir ma’lumotlari"][props.getLang]}</div>
                {Object.keys(fieldMap).map((key: any) => (
                    <div className="PopupInfoBlock">
                        <div className="PopupInfoTitle">{fieldMap[key].label}</div>
                        <div className="PopupInfoValue">{fieldMap[key]?.format ? fieldMap[key].format(props.actiom.data[key]) : props.actiom.data[key]}</div>
                    </div>
                ))}
            </div>
                :
                <div className="FilterArea">
                    <div className="FilterBlock">
                        <div className="FilterTitle">{translate["Sanalar oralig’i"][props.getLang]}:</div>
                        <div className="FilterInputBlock">
                            <div className="FilterInputImg">
                                <img src={ActivCalendar} />
                            </div>
                            <Calendar
                                value={getFilter.date_from}
                                minDate={"01.01.2000"}
                                maxDate={getFilter.date_to}
                                onChange={(val: string) => {
                                    updateFilter("date_from", val)
                                }}
                                weekDays={["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"]}
                                monthNames={["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"]}
                                className="FilterDate"
                                placeholder="KK.OO.YYYY"
                                format="%D.%M.%Y"
                            />
                        </div>
                        <div className="FilterInputBlock">
                            <div className="FilterInputImg">
                                <img src={ActivCalendar} />
                            </div>
                            <Calendar
                                value={getFilter.date_to}
                                minDate={getFilter.date_from}
                                onChange={(val: string) => {
                                    updateFilter("date_to", val)
                                }}
                                weekDays={["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"]}
                                monthNames={["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"]}
                                className="FilterDate"
                                placeholder="KK.OO.YYYY"
                                format="%D.%M.%Y"
                            />
                        </div>
                    </div>
                    <div className="FilterBlock">
                        <div className="FilterTitle">{translate["Bulut qoplami"][props.getLang]} (%):</div>

                        <MinMaxBar
                            minValue={0}
                            maxValue={100}
                            onChange={(min: any, max: any) => {
                                updateFilter("bulut_from", min)
                                updateFilter("bulut_to", max)
                            }}
                            step={1}
                            minGap={5}
                            inclusive={true}
                            initialMin={getFilter.bulut_from}
                            initialMax={getFilter.bulut_to}
                        />
                    </div>
                    <div className="FilterBlock">
                        <div className="FilterTitle">{translate["Ma'lumot turi"][props.getLang]}:</div>
                        {InformationTypes.map((item: checkList, index: number) => (
                            <div className="itemRow">
                                <div className={`ItemCheckBox ${item.state ? 'activ' : ''}`} onClick={() => {
                                    setInformationTypes((prev: any) => {
                                        return prev.map((item: checkList, i: number) =>
                                            index === i
                                                ? { ...item, state: !item.state }
                                                : item
                                        )
                                    })
                                }}>
                                    {item.state && <CheckIcon size="90%" color={`rgb(${allThemes[props.getTheme]["--main-activ-color"]})`} />}
                                </div>
                                <div className="FilterText">{translate[item.title][props.getLang]}</div>
                            </div>
                        ))}
                    </div>
                    <div className="FilterBlock">
                        <div className="FilterTitle">{translate["Sun’iy yo‘ldosh turi"][props.getLang]}:</div>
                        {SatelliteTypes.map((item: checkList, index: number) => (
                            <div className="itemRow">
                                <div className={`ItemCheckBox ${item.state ? 'activ' : ''}`} onClick={() => {
                                    setSatelliteTypes((prev: any) => {
                                        return prev.map((item: checkList, i: number) =>
                                            index === i
                                                ? { ...item, state: !item.state }
                                                : item
                                        )
                                    })
                                }}>
                                    {item.state && <CheckIcon size="90%" color={`rgb(${allThemes[props.getTheme]["--main-activ-color"]})`} />}
                                </div>
                                <div className="FilterText">{item.title}</div>
                            </div>
                        ))}
                    </div>
                    <div className="FilterBlock">
                        <div className="FilterTitle">{translate["Fazoviy aniqligi"][props.getLang]} (m/piksel):</div>

                        <MinMaxBar
                            minValue={0}
                            maxValue={10}
                            onChange={(min: any, max: any) => {
                                updateFilter("satel_from", min)
                                updateFilter("satel_to", max)
                            }}
                            step={0.1}
                            minGap={0.5}
                            inclusive={true}
                            initialMin={getFilter.satel_from}
                            initialMax={getFilter.satel_to}
                        />
                    </div>
                </div>
            }

        </div>
    )
}
