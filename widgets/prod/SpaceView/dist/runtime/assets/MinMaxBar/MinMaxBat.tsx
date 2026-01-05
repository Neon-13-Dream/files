import { React } from "jimu-core";
import "./MinMaxBar.css";

interface barValues {
    minVal: number;
    maxVal: number;
}

interface minMaxBarProps {
    minValue: number;
    maxValue: number;
    step: number;
    minGap?: number;
    inclusive?: boolean;
    onChange: (min: number, max: number) => void;
    initialMin?: number | "";
    initialMax?: number | "";
    title?: string;
}

export default function MinMaxBar(props: minMaxBarProps) {
    const barRef = React.useRef<HTMLDivElement>(null);
    const minRef = React.useRef<HTMLDivElement>(null);
    const maxRef = React.useRef<HTMLDivElement>(null);

    const [controlType, setControlType] = React.useState<"none" | "min" | "max">("none");
    const [mode] = React.useState<"interval" | "single">("interval"); // Пока оставляем только interval, но можно расширить

    const range = props.maxValue - props.minValue;

    const clampAndStep = (val: number) => {
        const v = Math.max(props.minValue, Math.min(val, props.maxValue));
        const steps = Math.round((v - props.minValue) / props.step);
        return Number((props.minValue + steps * props.step).toFixed(6));
    };

    const [currValues, setCurrValues] = React.useState<barValues>({
        minVal:
            props.initialMin === "" || props.initialMin === undefined
                ? props.minValue
                : clampAndStep(props.initialMin as number),
        maxVal:
            props.initialMax === "" || props.initialMax === undefined
                ? props.maxValue
                : clampAndStep(props.initialMax as number),
    });

    // Обновление при изменении initial значений или границ
    React.useEffect(() => {
        const newMin =
            props.initialMin === "" || props.initialMin === undefined
                ? props.minValue
                : clampAndStep(props.initialMin as number);
        const newMax =
            props.initialMax === "" || props.initialMax === undefined
                ? props.maxValue
                : clampAndStep(props.initialMax as number);

        setCurrValues({ minVal: newMin, maxVal: newMax });
    }, [props.initialMin, props.initialMax, props.minValue, props.maxValue, props.step]);

    // Функция для обновления позиций ползунков
    const updateThumbPositions = () => {
        const bar = barRef.current;
        if (!bar) return;

        const rect = bar.getBoundingClientRect();
        const width = rect.width;

        if (width === 0) return; // Ещё не отрендерилось

        const minPercent = (currValues.minVal - props.minValue) / range;
        const maxPercent = (currValues.maxVal - props.minValue) / range;

        if (minRef.current) {
            minRef.current.style.left = `${minPercent * width}px`;
        }

        if (maxRef.current) {
            maxRef.current.style.left = `${maxPercent * width}px`;
        }
    };

    // Обновление позиций после рендера и при изменении значений/размеров
    React.useLayoutEffect(() => {
        updateThumbPositions();
    }, [currValues, range]);

    // Обновление при ресайзе окна
    React.useEffect(() => {
        const handleResize = () => updateThumbPositions();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [currValues, range]);

    // Обработка перетаскивания
    React.useEffect(() => {
        const bar = barRef.current;
        if (!bar) return;

        const barRect = bar.getBoundingClientRect();
        const barWidth = barRect.width;
        const minGap = props.minGap ?? 0;

        const move = (e: MouseEvent) => {
            if (controlType === "none") return;

            let mouseX = e.clientX - barRect.left;
            mouseX = Math.max(0, Math.min(mouseX, barWidth));
            const percent = mouseX / barWidth;
            let rawValue = props.minValue + percent * range;
            let realValue = clampAndStep(rawValue);

            if (controlType === "min") {
                realValue = Math.min(realValue, currValues.maxVal - minGap);
                setCurrValues((prev) => {
                    const updated = { ...prev, minVal: realValue };
                    emitChange(updated);
                    return updated;
                });
            } else if (controlType === "max") {
                realValue = Math.max(realValue, currValues.minVal + minGap);
                setCurrValues((prev) => {
                    const updated = { ...prev, maxVal: realValue };
                    emitChange(updated);
                    return updated;
                });
            }

            // Обновляем позицию сразу
            updateThumbPositions();
        };

        const emitChange = (values: barValues) => {
            let retMin = values.minVal;
            let retMax = values.maxVal;

            if (!props.inclusive) {
                retMin = Number((retMin + props.step).toFixed(6));
                retMax = Number((retMax - props.step).toFixed(6));
            }

            props.onChange(retMin, retMax);
        };

        const stop = () => setControlType("none");

        if (controlType !== "none") {
            document.addEventListener("mousemove", move);
            document.addEventListener("mouseup", stop);
        }

        return () => {
            document.removeEventListener("mousemove", move);
            document.removeEventListener("mouseup", stop);
        };
    }, [controlType, currValues, range, props, controlType]);

    return (
        <div className="MinMaxBarArea">
            {props.title && <div className="barTitle">{props.title}</div>}
            <div className="barArea">
                <div className="bar" ref={barRef}>
                    <div
                        ref={minRef}
                        data-value={currValues.minVal}
                        className={`control min ${controlType === "min" ? "activ" : ""}`}
                        onMouseDown={() => setControlType("min")}
                    />

                    <div
                        ref={maxRef}
                        data-value={currValues.maxVal}
                        className={`control max ${controlType === "max" ? "activ" : ""}`}
                        onMouseDown={() => setControlType("max")}
                    />
                </div>
            </div>
        </div>
    );
}