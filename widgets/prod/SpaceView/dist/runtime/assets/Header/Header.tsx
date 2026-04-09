import { React, SessionManager, getAppStore } from "jimu-core"
import "./Header.css"

import {
    allThemes,
    LanguageIcon,
    ThemeIcon,
    LogoIcon,
    LocationIcon,
    SearchIcon,
    translate,
    yearRasters,
    CalendarIcon
} from "../../config"

interface headerProps {
    setUrl: (theme: string) => void
    onChange: (type: string, data: any) => void
    getTheme: string
    setTheme: (theme: string) => void
    getLang: string
    setLang: (lang: string) => void
}

type ContentType = "theme" | "language" | "profile" | "year" | null

function LogoutIcon({
    size = "100%",
    color = "currentColor"
}: {
    size?: string
    color?: string
}) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M10 17L15 12L10 7"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M15 12H4"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M20 20V4"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
            />
        </svg>
    )
}

export default function Header({ setUrl, onChange, getTheme, setTheme, getLang, setLang }: headerProps) {
    const userRef = React.useRef(getAppStore().getState())

    const [getInputValue, setInputValue] = React.useState<string>("")
    const [getResult, setResult] = React.useState<any[]>([])
    const debounceRef = React.useRef<NodeJS.Timeout | null>(null)
    const [isInputFocused, setFocus] = React.useState(false)

    const [getSelectedYear, setSelectedYear] = React.useState<string>("2025")
    const [getRootInfo, setRootInfo] = React.useState<DOMRect>()
    const selectorSizeRef = React.useRef<HTMLDivElement | null>(null)

    const [getContent, setContent] = React.useState<ContentType>(null)
    const [getAvatar, setAvatar] = React.useState<string | null>(null)

    const updateType = (type: string, data: any) => {
        if (type === "address" && data) {
            setInputValue(data.address)
            onChange("address", data.extent)
        }
    }

    const PlaceSearch = async (input: string) => {
        const query = `O'zbekiston ${input}`
        const url = `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?f=json&SingleLine=${encodeURIComponent(query)}&outSR=4326&maxLocations=10`
        const response = await fetch(url)
        const data = await response.json()
        setResult(data.candidates || [])
    }

    const handleInput = (text: string) => {
        setInputValue(text)

        if (debounceRef.current) clearTimeout(debounceRef.current)

        debounceRef.current = setTimeout(() => {
            if (text.trim().length === 0) {
                setResult([])
                return
            }

            PlaceSearch(text)
        }, 300)
    }

    const closeAll = React.useCallback(() => {
        setContent(null)
    }, [])

    const onLogout = React.useCallback(() => {
        try {
            SessionManager.getInstance().signOut()

            const portalUrl = userRef.current?.portalUrl
            if (portalUrl) {
                window.location.href =
                    `${portalUrl}/sharing/rest/oauth2/signout?redirect_uri=${window.location.origin}${window.location.pathname}`
                return
            }

            window.location.reload()
        } catch (err) {
            console.error("Ошибка при выходе:", err)
            window.location.reload()
        }
    }, [])

    React.useEffect(() => {
        if (selectorSizeRef.current) {
            setRootInfo(selectorSizeRef.current.getBoundingClientRect())
        }
    }, [])

    React.useEffect(() => {
        let cancelled = false

            ; (async () => {
                try {
                    const session = SessionManager.getInstance().getMainSession()
                    if (!session) {
                        if (!cancelled) setAvatar(null)
                        return
                    }

                    const user = await session.getUser()
                    if (!user?.thumbnail) {
                        if (!cancelled) setAvatar(null)
                        return
                    }

                    const base = session.portal.replace(/\/+$/, "")
                    const path = `${base}/community/users/${encodeURIComponent(user.username)}/info/${encodeURIComponent(user.thumbnail)}`
                    const url = session.token ? `${path}?token=${encodeURIComponent(session.token)}` : path

                    if (!cancelled) setAvatar(url)
                } catch (error) {
                    if (!cancelled) setAvatar(null)
                }
            })()

        return () => {
            cancelled = true
        }
    }, [])

    const renderContent = () => {
        switch (getContent) {
            case "year":
                return (
                    <div className="ThemeAreaSelector">
                        {Object.keys(yearRasters).map((item: string) => (
                            <div
                                className={`ThemeItem ${item === getSelectedYear ? "activ" : ""}`}
                                key={item}
                                style={{
                                    height: getRootInfo ? getRootInfo.height : undefined
                                }}
                                onClick={() => {
                                    setSelectedYear(item)
                                    setUrl(yearRasters[item])
                                    closeAll()
                                }}
                            >
                                {item}
                            </div>
                        ))}
                    </div>
                )

            case "theme":
                return (
                    <div className="ThemeAreaSelector">
                        <div
                            className={`ThemeItem ${getTheme === "Dark" ? "activ" : ""}`}
                            onClick={() => {
                                setTheme("Dark")
                                closeAll()
                            }}
                        >
                            Dark
                        </div>
                        <div
                            className={`ThemeItem ${getTheme === "Light" ? "activ" : ""}`}
                            onClick={() => {
                                setTheme("Light")
                                closeAll()
                            }}
                        >
                            Light
                        </div>
                    </div>
                )

            case "language":
                return (
                    <div className="ThemeAreaSelector">
                        <div
                            className={`ThemeItem ${getLang === "UZ" ? "activ" : ""}`}
                            onClick={() => {
                                setLang("UZ")
                                closeAll()
                            }}
                        >
                            O'zbekcha
                        </div>
                        <div
                            className={`ThemeItem ${getLang === "RU" ? "activ" : ""}`}
                            onClick={() => {
                                setLang("RU")
                                closeAll()
                            }}
                        >
                            Русский
                        </div>
                    </div>
                )

            case "profile":
                return (
                    <div className="ThemeAreaSelector profilePopup">
                        <div className="profileBlock">
                            <div className="profileTop">
                                <div className="profileAvatarWrap">
                                    {getAvatar ? (
                                        <img className="profileAvatarImg" src={getAvatar} alt="avatar" />
                                    ) : (
                                        <div className="profileAvatarFallback">
                                            {(userRef.current?.user?.firstName?.[0] || "U").toUpperCase()}
                                        </div>
                                    )}
                                </div>

                                <div className="profileInfo">
                                    <div className="profileName">
                                        {userRef.current?.user?.fullName ||
                                            `${userRef.current?.user?.lastName || ""} ${userRef.current?.user?.firstName || ""}`.trim() ||
                                            "User"}
                                    </div>
                                    <div className="profileUsername">
                                        {userRef.current?.user?.username || ""}
                                    </div>
                                </div>
                            </div>

                            <div className="profileLogoutBtn" onClick={onLogout}>
                                Выйти
                            </div>
                        </div>
                    </div>
                )

            default:
                return null
        }
    }

    return (
        <div className="HeaderArea">
            <div className="HeaderLeftContent">
                <div className="HeaderLogo">
                    <LogoIcon size="100%" color={`rgb(${allThemes[getTheme]["--main-second-color-rgb"]})`} />
                </div>
                <div className="HeaderTitle">
                    UzSpaceView
                </div>
            </div>

            <div className="HeaderCenterContent">
                <div className="HeaderActions">
                    <div className="HeaderInputArea">
                        <div className="HeaderInputSearch">
                            <SearchIcon size="100%" color={`rgb(${allThemes[getTheme]["--main-second-color-rgb"]})`} />
                        </div>
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
                        {getInputValue.length > 0 && isInputFocused && (
                            <div className="HeaderInputResultArea">
                                {getResult.map((item: any, index: number) => (
                                    <div
                                        key={index}
                                        className="ResultItem"
                                        onClick={() => {
                                            updateType("address", { extent: item.extent, address: item.address })
                                        }}
                                    >
                                        <div className="ResultIcon">
                                            <LocationIcon size="90%" color={`rgb(${allThemes[getTheme]["--main-second-color-rgb"]})`} />
                                        </div>
                                        <div className="ResultItmTitle">{item.address}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="HeaderRightContent">
                <div className="ThemeArea">
                    <div
                        className="ThemeBtn"
                        ref={selectorSizeRef}
                        onClick={() => {
                            setContent(getContent === "year" ? null : "year")
                        }}
                    >
                        <CalendarIcon
                            size="85%"
                            color={`rgb(${allThemes[getTheme]["--main-second-color-rgb"]})`}
                        />
                    </div>
                    {getContent === "year" && renderContent()}
                </div>

                <div className="ThemeArea">
                    <div
                        className="ThemeBtn"
                        onClick={() => {
                            setContent(getContent === "theme" ? null : "theme")
                        }}
                    >
                        <ThemeIcon size="90%" color={`rgb(${allThemes[getTheme]["--main-second-color-rgb"]})`} />
                    </div>
                    {getContent === "theme" && renderContent()}
                </div>

                <div className="ThemeArea">
                    <div
                        className="ThemeBtn"
                        onClick={() => {
                            setContent(getContent === "language" ? null : "language")
                        }}
                    >
                        <LanguageIcon size="90%" color={`rgb(${allThemes[getTheme]["--main-second-color-rgb"]})`} />
                    </div>
                    {getContent === "language" && renderContent()}
                </div>

                <div className="ThemeArea">
                    <div
                        className="ThemeBtn"
                        onClick={() => {
                            setContent(getContent === "profile" ? null : "profile")
                        }}
                        title="Profile"
                    >
                        <LogoutIcon
                            size="85%"
                            color={`rgb(${allThemes[getTheme]["--main-second-color-rgb"]})`}
                        />
                    </div>
                    {getContent === "profile" && renderContent()}
                </div>
            </div>
        </div>
    )
}