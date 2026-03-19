import { React } from "jimu-core"
import MapView from "@arcgis/core/views/MapView"
import "./BottomArea.css"

import MGRSIcon from "../../imgs/MGRS.png"

import {
    allThemes,
    dataStruct,
    CrosshairsIcon,
    CursorIcon
} from "../../../config";

interface bottomArea {
    viewMap: MapView
    mapData: dataStruct
    onChange: (newValue: any) => void
    getTheme: string
}

export default function BottomArea(props: bottomArea) {
    const { viewMap: mapView, mapData, onChange } = props;
    const [localScale, setLocalScale] = React.useState(mapData.mapScale);
    const [localZoom, setLocalZoom] = React.useState(mapData.mapZoom);


    React.useEffect(() => {
        setLocalScale(mapData.mapScale);
        setLocalZoom(mapData.mapZoom);
    }, [mapData.mapScale, mapData.mapZoom]);

    const handleScaleDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.code !== "Enter") return;
        if (!mapView) return;

        const newScale = parseFloat(localScale.toString());
        if (isNaN(newScale)) return;

        mapView.scale = newScale;

        onChange((prev: dataStruct) => {
            return {
                ...prev,
                mapScale: newScale
            }
        });
    };

    const handleZoomDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.code !== "Enter") return;
        if (!mapView) return;

        const newZoom = parseFloat(localZoom.toString());
        if (isNaN(newZoom)) return;

        mapView.zoom = newZoom;

        onChange((prev: dataStruct) => {
            return {
                ...prev,
                mapZoom: newZoom
            }
        });
    };

    React.useEffect(() => {
        if (!mapView) return;

        const stationaryHandler = mapView.watch("stationary", (st: boolean) => {
            if (!st) return;
            onChange((prev: dataStruct) => {
                return {
                    ...prev,
                    mapScale: mapView.scale.toFixed(0),
                    mapZoom: mapView.zoom.toFixed(0)
                }
            });
        });

        return () => {
            stationaryHandler.remove();
        };
    }, [mapView, mapData]);

    return (
        <div className="MapAttribute">
            <div className="MapAttributeTitle">Esri, © OpenStreetMap contributors, TomTom, Garmin, FAO, NOAA, USGS</div>
            <div className="MapInfo">
                <div className="CursorInfoArea">
                    <div className="CursorInfo">
                        <div className="CursorInfoIcon"><CrosshairsIcon size="100%" color={`rgb(${allThemes[props.getTheme]["--main-second-color-rgb"]})`} /></div>
                        <div className="CursorInfoStyle">{mapData.GCS.lat}°N</div>
                        <div className="CursorInfoStyle">{mapData.GCS.lon}°E</div>
                    </div>
                    <div className="CursorInfo">
                        <div className="CursorInfoIcon"><CursorIcon size="100%" color={`rgb(${allThemes[props.getTheme]["--main-second-color-rgb"]})`} /></div>
                        <div className="CursorInfoStyle">{mapData.MGRS}</div>
                    </div>
                </div>
                <div className="CursorInfo" style={{ gap: "5px" }}>
                    <div className="CursorInfoStyle">Zoom:</div>
                    <input
                        className="mapZoomStyle"
                        type="number"
                        value={localZoom}
                        onChange={(e) => setLocalZoom(parseFloat(e.target.value))}
                        onKeyDown={handleZoomDown}
                    />

                    <div className="CursorInfoStyle">Scale 1:</div>
                    <input
                        className="mapScaleStyle"
                        type="number"
                        value={localScale}
                        onChange={(e) => setLocalScale(parseFloat(e.target.value))}
                        onKeyDown={handleScaleDown}
                    />
                    {/* <div className="CursorInfoIcon"><img src={mapScaleIcon} /></div> */}
                </div>
            </div>
        </div>
    )
}