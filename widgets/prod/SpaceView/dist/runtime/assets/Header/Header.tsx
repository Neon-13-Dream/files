import { React } from "jimu-core"
import "./Header.css"

import {
    allThemes,
    LanguageIcon,
    ThemeIcon,
    LogoIcon,
    LocationIcon,
    SearchIcon,
    translate,
    yearRasters
} from "../../config"

interface headerProps {
    setUrl: (theme: string) => void
    onChange: (type: string, data: any) => void
    getTheme: string
    setTheme: (theme: string) => void
    getLang: string
    setLang: (lang: string) => void
}

export default function Header({ setUrl, onChange, getTheme, setTheme, getLang, setLang }: headerProps) {
    const [getInputValue, setInputValue] = React.useState<string>("")
    const [getResult, setResult] = React.useState<any[]>([])
    const debounceRef = React.useRef<NodeJS.Timeout | null>(null)
    const [isInputFocused, setFocus] = React.useState(false)
    const [isThemeVisible, setThemeVisible] = React.useState(false)
    const [isLangVisible, setLangVisible] = React.useState(false)

    const [getSelectedYear, setSelectedYear] = React.useState<string>("2025")
    const [getRootInfo, setRootInfo] = React.useState<DOMRect>()
    const selectorSizeRef = React.useRef()
    const [showOptions, toggleOptions] = React.useState<Boolean>(false)

    const updateType = (type: string, data: any) => {
        if (type === "address" && data) {
            setInputValue(data.address)
            onChange("address", data.extent)
        }
    }

    const PlaceSearch = async (input: string) => {
        const query = `O'zbekiston ${input}`;
        const url = `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?f=json&SingleLine=${encodeURIComponent(query)}&outSR=4326&maxLocations=10`;
        const response = await fetch(url);
        const data = await response.json();
        setResult(data.candidates);
    }

    const handleInput = (text: string) => {
        setInputValue(text);

        if (debounceRef.current) clearTimeout(debounceRef.current);

        debounceRef.current = setTimeout(() => {
            if (text.trim().length === 0) {
                setResult([]);
                return;
            }

            PlaceSearch(text);
        }, 300);
    };

    React.useEffect(() => {
        if (selectorSizeRef.current) setRootInfo(selectorSizeRef.current.getBoundingClientRect());
    }, [])

    return (
        <div className="HeaderArea">
            <div className="HeaderLeftContent">
                <div className="HeaderLogo">
                    <LogoIcon size="100%" color={`rgb(${allThemes[getTheme]["--main-second-color-rgb"]})`} />
                </div>
                <div className="HeaderTitle">
                    "Uz Space View" subplatformasi
                </div>
            </div>
            <div className="HeaderCenterContent">
                <div className="HeaderActions">
                    <div className="HeaderInputArea">
                        <div className="HeaderInputSearch"><SearchIcon size="100%" color={`rgb(${allThemes[getTheme]["--main-second-color-rgb"]})`} /></div>
                        <input
                            type="text"
                            className="HeaderInput"
                            value={getInputValue}
                            onChange={(event: any) => { handleInput(event.target.value) }}
                            onFocus={() => setFocus(true)}
                            onBlur={() => { setTimeout(() => setFocus(false), 100) }}
                            onKeyDown={(event: any) => {
                                if (event.code === "Enter") {
                                    updateType("address", getResult[0])
                                }
                            }}
                            placeholder={translate["Manzilni qidirish"][getLang]}
                        />
                        {getInputValue.length > 0 && isInputFocused && <div className="HeaderInputResultArea">
                            {getResult.map((item: any) => (
                                <div className="ResultItem" onClick={() => {
                                    updateType("address", { extent: item.extent, address: item.address })
                                }}>
                                    <div className="ResultIcon"><LocationIcon size="90%" color={`rgb(${allThemes[getTheme]["--main-second-color-rgb"]})`} /></div>
                                    <div className="ResultItmTitle">{item.address}</div>
                                </div>
                            ))}
                        </div>}
                    </div>
                </div>
            </div>
            <div className="HeaderRightContent">
                <div className="headerSelector" onClick={() => {
                    toggleOptions(!showOptions)
                    setThemeVisible(false)
                    setLangVisible(false)
                }
                }>
                    <div className="headerActiveOption" ref={selectorSizeRef}>{getSelectedYear}</div>
                    {showOptions && <div className="headerOptionsArea">
                        {Object.keys(yearRasters).map((item: string) => (
                            <div className={`ThemeItem ${item === getSelectedYear && "activ"}`} key={item}
                                style={{
                                    height: getRootInfo.height
                                }}
                                onClick={() => {
                                    setSelectedYear(item)
                                    setUrl(yearRasters[item])
                                }}
                            >{item}</div>
                        ))}
                    </div>}
                </div>
                <div className="ThemeArea">
                    <div className="ThemeBtn" onClick={() => {
                        setLangVisible(false)
                        setThemeVisible(!isThemeVisible)
                        toggleOptions(false)
                    }}><ThemeIcon size="90%" color={`rgb(${allThemes[getTheme]["--main-second-color-rgb"]})`} /></div>
                    {isThemeVisible && <div className="ThemeAreaSelector">
                        <div className={`ThemeItem ${getTheme === "Dark" ? 'activ' : ''}`} onClick={() => { setTheme("Dark") }}>Dark</div>
                        <div className={`ThemeItem ${getTheme === "Light" ? 'activ' : ''}`} onClick={() => { setTheme("Light") }}>Light</div>
                    </div>}
                </div>
                <div className="ThemeArea">
                    <div className="ThemeBtn" onClick={() => {
                        setThemeVisible(false)
                        setLangVisible(!isLangVisible)
                        toggleOptions(false)
                    }}><LanguageIcon size="90%" color={`rgb(${allThemes[getTheme]["--main-second-color-rgb"]})`} /></div>
                    {isLangVisible && <div className="ThemeAreaSelector">
                        <div className={`ThemeItem ${getLang === "UZ" ? 'activ' : ''}`} onClick={() => { setLang("UZ") }}>O'zbekcha</div>
                        <div className={`ThemeItem ${getLang === "RU" ? 'activ' : ''}`} onClick={() => { setLang("RU") }}>Русский</div>
                    </div>}
                </div>
                <div className="HeaderBtn" style={{ display: "none" }}></div>
            </div>
        </div>
    )
}