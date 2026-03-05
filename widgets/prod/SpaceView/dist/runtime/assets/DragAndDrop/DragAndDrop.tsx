import { React } from "jimu-core";
import "./DragAndDrop.css";
import shp from "shpjs";
import JSZip from "jszip"; // npm install jszip

import {
    allThemes,
    ImportIcon,
    translate
} from "../../config";

interface dragAndDropProps {
    activ: string;
    onChange: (geometries: any[]) => void;
    clear: (text: string) => void;
    getTheme: string;
    getLang: string;
};

export default function DragAndDrop(props: dragAndDropProps) {
    const [isImportVisible, setImportVisible] = React.useState(false);
    const fileInputRef = React.useRef<HTMLInputElement | null>(null);

    // Универсальный парсер координат из строки KML
    const parseCoordinatesString = (str: string | null | undefined): number[][] => {
        if (!str) return [];
        return str.trim()
            .split(/\s+/)
            .filter(Boolean)
            .map(coord => {
                const parts = coord.split(",").map(parseFloat);
                if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
                    return [parts[0], parts[1]] as number[]; // lon, lat
                }
                return null;
            })
            .filter(Boolean) as number[][];
    };

    // Основной парсер KML → GeoJSON geometries
    const parseKML = (kmlText: string): any[] => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(kmlText, "text/xml");

        if (doc.getElementsByTagName("parsererror").length > 0) {
            throw new Error("Ошибка парсинга KML");
        }

        const geometries: any[] = [];

        const placemarks = doc.querySelectorAll("Placemark");
        placemarks.forEach(placemark => {
            // Поддержка MultiGeometry
            const multiGeometries = placemark.querySelectorAll("MultiGeometry");
            if (multiGeometries.length > 0) {
                multiGeometries.forEach(mg => geometries.push(...extractGeometries(mg)));
            } else {
                geometries.push(...extractGeometries(placemark));
            }
        });

        return geometries;
    };

    const extractGeometries = (container: Element): any[] => {
        const geoms: any[] = [];

        // === Polygon (с поддержкой дыр) ===
        container.querySelectorAll("Polygon").forEach(poly => {
            const outer = poly.querySelector("outerBoundaryIs LinearRing coordinates");
            const outerCoords = parseCoordinatesString(outer?.textContent);

            if (outerCoords.length < 3) return;

            const rings: number[][][] = [outerCoords];

            // Дырки (может быть несколько)
            poly.querySelectorAll("innerBoundaryIs LinearRing coordinates").forEach(inner => {
                const innerCoords = parseCoordinatesString(inner.textContent);
                if (innerCoords.length >= 3) {
                    rings.push(innerCoords);
                }
            });

            geoms.push({
                type: "Polygon",
                coordinates: rings
            });
        });

        // === MultiPolygon через несколько Polygon в MultiGeometry ===
        // (уже обработается выше рекурсивно)

        // === LineString ===
        container.querySelectorAll("LineString coordinates").forEach(line => {
            const coords = parseCoordinatesString(line.textContent);
            if (coords.length >= 2) {
                geoms.push({
                    type: "LineString",
                    coordinates: coords
                });
            }
        });

        // === Point ===
        container.querySelectorAll("Point coordinates").forEach(point => {
            const coordsStr = point.textContent?.trim();
            if (coordsStr) {
                const parts = coordsStr.split(",").map(parseFloat);
                if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
                    geoms.push({
                        type: "Point",
                        coordinates: [parts[0], parts[1]]
                    });
                }
            }
        });

        return geoms;
    };

    const handleFiles = async (files: FileList | null) => {
        if (!files || files.length === 0) return;

        const file = files[0];
        if (file.size > 15 * 1024 * 1024) {
            alert("Файл слишком большой (макс. 15 МБ)");
            return;
        }

        const ext = file.name.split(".").pop()?.toLowerCase();
        if (!ext || !["kml", "kmz", "zip", "geojson"].includes(ext)) {
            alert("Разрешены только: KML, KMZ, ZIP (shp), GeoJSON");
            return;
        }

        let geometries: any[] = [];

        try {
            if (ext === "geojson") {
                const json = JSON.parse(await file.text());
                if (json.type === "FeatureCollection") {
                    geometries = json.features.map((f: any) => f.geometry).filter((g: any) => g);
                } else if (json.type && json.coordinates) {
                    geometries = [json];
                }
            }
            else if (ext === "kml") {
                geometries = parseKML(await file.text());
            }
            else if (ext === "kmz") {
                const zip = await JSZip.loadAsync(file);
                const kmlFile = Object.keys(zip.files).find(name => name.toLowerCase().endsWith(".kml"));
                if (!kmlFile) throw new Error("KML не найден в KMZ");
                const kmlText = await zip.file(kmlFile)!.async("text");
                geometries = parseKML(kmlText);
            }
            else if (ext === "zip") {
                // Сначала пробуем как shapefile
                try {
                    const geojson = await shp(await file.arrayBuffer());
                    if (geojson.type === "FeatureCollection") {
                        geometries = geojson.features.map((f: any) => f.geometry).filter(Boolean);
                    } else if (geojson.type && geojson.coordinates) {
                        geometries = [geojson];
                    }
                } catch {
                    // Если не shp, то пробуем как KMZ (Google Earth иногда сохраняет как zip)
                    const zip = await JSZip.loadAsync(file);
                    const kmlFile = Object.keys(zip.files).find(name => name.toLowerCase().endsWith(".kml"));
                    if (kmlFile) {
                        const kmlText = await zip.file(kmlFile)!.async("text");
                        geometries = parseKML(kmlText);
                    }
                }
            }

            if (geometries.length === 0) {
                alert("В файле не найдено ни одной геометрии (Point/LineString/Polygon)");
                return;
            }

            props.onChange(geometries);
        } catch (err) {
            console.error(err);
            alert("Ошибка чтения файла. Проверьте формат или попробуйте экспортировать заново из ArcGIS Pro/QGIS.");
        }
    };

    // UI без изменений
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        handleFiles(e.dataTransfer.files);
    };

    const handleClick = () => fileInputRef.current?.click();
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => handleFiles(e.target.files);

    React.useEffect(() => {
        setImportVisible(props.activ === "Import");
    }, [props.activ]);

    return isImportVisible ? (
        <div className="DragAndDropArea" onDragOver={e => e.preventDefault()} onDrop={handleDrop}
            onClick={() => { props.clear("none"); setImportVisible(false); }}>
            <div className="DragAndDropBlock" onClick={e => e.stopPropagation()}>
                <div className="DragAndDropHeader">
                    <div className="DragAndDropTitle">
                        {translate["Hudud faylini yuklang"][props.getLang]}
                    </div>
                </div>
                <div className="DragAndDropDesc" onClick={handleClick}>
                    <input type="file" ref={fileInputRef} style={{ display: "none" }} accept=".kml,.kmz,.zip,.geojson" onChange={handleChange} />
                    <div className="DragAndDropIcon">
                        <ImportIcon size="100%" color={`rgb(${allThemes[props.getTheme]["--main-second-color-rgb"]})`} />
                    </div>
                    <div className="DragAndDropInfo">
                        {translate["Yuklash uchun bosing yoki faylni shu yerga tashlang."][props.getLang]}
                    </div>
                    <div className="DragAndDropInfo">
                        {translate["15 MB gacha bo‘lgan KML yoki SHP fayl"][props.getLang]}
                    </div>
                </div>
            </div>
        </div>
    ) : null;
}