import { React, AllWidgetProps } from "jimu-core";
import { JimuMapView } from "jimu-arcgis";
import Map from "esri/Map";
import MapView from "esri/views/MapView";
import Graphic from "esri/Graphic";
import ImageryLayer from "esri/layers/ImageryLayer";
import { Extent } from "esri/geometry";
import MosaicRule from "esri/layers/support/MosaicRule";
import * as geometryEngine from "esri/geometry/geometryEngine";
import Point from "esri/geometry/Point";
import Polygon from "esri/geometry/Polygon";
import { forEach } from "lodash-es";
import './assets/style.css';
import CustomSelect from "./assets/selector";

export default function CustomMapWidget(props: AllWidgetProps<any>) {
    const mapContainerRef = React.useRef<HTMLDivElement>(null);
    const [view, setView] = React.useState<MapView | null>(null);
    const [getData, setData] = React.useState([])
    const [getConfig, setConfig] = React.useState([])
    const [sort, setSort] = React.useState("Eng yangi");
    const url = "https://api.smrm.uz/api/earthquakes" // ?sort=datetime_desc&epicenter=&from_date=&to_date=&from_magnitude=&to_magnitude=&from_depth=&to_depth=&from_latitude=&to_latitude=&from_longitude=&to_longitude=&uzb=0&per_page=10&page=2
    const filter = React.useRef({
        sort: "datetime_desc",  //   sort           = datetime_desc &
        epicenter: "",          //   epicenter      = &
        from_date: "",          //   from_date      = &
        to_date: "",            //   to_date        = &
        from_magnitude: "",     //   from_magnitude = &
        to_magnitude: "",       //   to_magnitude   = &
        from_depth: "",         //   from_depth     = &
        to_depth: "",           //   to_depth       = &
        from_latitude: "",      //   from_latitude  = &
        to_latitude: "",        //   to_latitude    = &
        from_longitude: "",     //   from_longitude = &
        to_longitude: "",       //   to_longitude   = &
        uzb: 1,                 //   uzb            = 0 &
        per_page: 10,           //   per_page       = 10 &
        page: 1,                //   page           = 2
    })
    const allPoints = React.useRef([])
    const [mapState, setMapState] = React.useState({
        center: [0, 0],
        zoom: 0,
        rotation: 0,
        tilt: 0,
    });
    const activIndex = React.useRef(0)
    const dataCount = React.useRef(0)

    const filterData = () => {
        console.log(props.config.fields);

        fetch(`${url}?${Object.entries(filter.current).map(([key, value]) => `${key}=${value}`).join("&")}`)
            .then((result: any) => result.json())
            .then((data: any) => {
                dataCount.current = data.result.total
                data.result.data.forEach((item: any, index: number) => {
                    allPoints.current[index].geometry = {
                        type: "point",
                        x: item.longitude,
                        y: item.latitude,
                        spatialReference: { wkid: 4236 }
                    }
                    allPoints.current[index].symbol = {
                        type: "simple-marker",
                        color: item.color,
                        size: "12px"
                    }
                })

                setData(data.result.data)
            })
    }

    const Moving = (index: number) => {
        view.goTo(allPoints.current[index].geometry, {
            duration: 500,
            easing: "in-out-cubic",
        })
    }

    React.useEffect(() => {
        if (props.config.fields && props.config.fields.length > 0) {
            setConfig(props.config.fields.filter((item: any) => item.use))
        }
    }, [props.config.fields])

    React.useEffect(() => {
        if (!mapContainerRef.current) return;

        // Создаём карту
        const map = new Map({
            basemap: "streets-navigation-vector",
        });

        // Создаём MapView
        const mapView = new MapView({
            container: mapContainerRef.current,
            map,
            zoom: 6,
            center: [64.8987, 41.1001], // Ташкент пример
        });

        for (let pointIndex = 0; pointIndex < filter.current.per_page; pointIndex++) {
            const g = new Graphic({
                geometry: { type: "point", longitude: 69.2401, latitude: 41.2995, spatialReference: { wkid: 4236 } },
                symbol: { type: "simple-marker", color: "red", size: "12px" }
            })

            mapView.graphics.add(g);
            allPoints.current.push(g);
        }

        filterData()

        mapView.watch(["center", "zoom", "rotation", "tilt"], () => {
            setMapState({
                center: [mapView.center.longitude, mapView.center.latitude],
                zoom: mapView.zoom,
                rotation: mapView.rotation,
                tilt: mapView.tilt,
            });
        });

        // drawPolygon(mapView)
        setView(mapView);

        mapView.goTo(allPoints.current[activIndex.current].geometry, {
            duration: 500,
            easing: "in-out-cubic",
        })

        return () => {
            mapView.destroy();
        };
    }, []);

    return (
        <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "100%",
            height: "100%",
            position: "relative"
        }}>
            <div
                ref={mapContainerRef}
                style={{
                    width: "70%",
                    height: "55%"
                }}
            />

            {<div style={{
                width: "70%",
                height: "45%"
            }}>
                <div className="TableTitleArea">
                    <div className="TableTitle">
                        Zilzilalar ro'yxati
                    </div>
                    <div className="TableButtons">
                        <div className="TableSortBtn">
                            <CustomSelect
                                value={sort}
                                onChange={(select: any) => {
                                    setSort(select)
                                    switch (select) {
                                        case "Eng yangi":
                                            filter.current.sort = "datetime_desc"
                                            break;
                                        case "Eng eski":
                                            filter.current.sort = "datetime_asc"
                                            break;
                                        case "Eng kuchli":
                                            filter.current.sort = "magnitude_desc"
                                            break;
                                        case "Eng kuchsiz":
                                            filter.current.sort = "magnitude_asc"
                                            break;

                                        default:
                                            filter.current.sort = "datetime_desc"
                                            break;
                                    }

                                    filterData()
                                    activIndex.current = 0
                                    Moving(0)
                                }}
                                options={[
                                    "Eng yangi",
                                    "Eng eski",
                                    "Eng kuchli",
                                    "Eng kuchsiz"
                                ]}
                            /></div>
                        <div className="TableFilterBtn">Filter</div>
                    </div>
                </div>
                <div style={{
                    width: "100%",
                    display: 'flex'
                }}>
                    <div className='items' style={{
                        width: `2%`,
                        justifyContent: 'center',
                        color: "#ffffffff",
                        backgroundColor: "#7382f8"
                    }}>
                        №
                    </div>
                    {getConfig.map((item: any) => (
                        <div style={{
                            width: `${item.size}%`,
                            height: "50px",
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: item.fieldPos,
                            color: item.fieldColor,
                            backgroundColor: item.fieldFill,
                        }}>
                            {item.title}
                        </div>
                    ))}
                </div>

                <div style={{
                    width: "100%",
                    display: 'flex',
                    flexDirection: 'column',
                }}>
                    {getData.map((row: any, index: number) => (
                        <div style={{
                            width: "100%",
                            display: 'flex',
                            alignItems: 'center',
                            height: "35px"
                        }} key={index}
                            onClick={() => {
                                activIndex.current = index
                                Moving(index)
                            }}>
                            <div className='items' style={{
                                width: `2%`,
                                justifyContent: 'center',
                                color: "#001cff",
                                backgroundColor: activIndex.current == index ? "#e3e4ff" : "#ffffff",
                                height: "100%"
                            }}>
                                {1 + index + (filter.current.page - 1) * filter.current.per_page}
                            </div>
                            {getConfig.map((item: any) => (
                                <div className='items' style={{
                                    width: `${item.size}%`,
                                    justifyContent: item.valuePos,
                                    color: index & 1 ? item.valueColorEven : item.valueColorOdd,
                                    backgroundColor: activIndex.current == index ? "#e3e4ff" : index & 1 ? item.valueFillEven : item.valueFillOdd,
                                    height: "100%"
                                }}>
                                    <strong>{row[item.name]}</strong>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
                <div className="TableTitleArea">
                    <div className="Informations">
                        Sahifa: {filter.current.page} Jami: {dataCount.current}
                    </div>
                    <div className="TableButtons">
                        <div className="TablePageBtn activ" onClick={() => {
                            filter.current.page = filter.current.page - 1 < 1 ? 1 : filter.current.page - 1
                            filterData()
                        }}>{"<"}</div>
                        {filter.current.page <= 4 &&
                            [1, 2, 3, 4, 5].map((item: number, index: number) => (
                                <div className={filter.current.page == item ? "TablePageBtn activ" : "TablePageBtn"} onClick={() => {
                                    filter.current.page = item
                                    filterData()
                                }} key={index}>{item}</div>
                            ))
                        }
                        <div className="TablePageBtn activ" onClick={() => {
                            filter.current.page = filter.current.page + 1 > dataCount.current / filter.current.per_page ? dataCount.current / filter.current.per_page : filter.current.page + 1
                            filterData()
                        }}>{">"}</div>
                    </div>
                </div>
            </div>}
        </div>
    );
}
