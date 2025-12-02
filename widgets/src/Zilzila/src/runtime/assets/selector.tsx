import React, { useState } from "react";
import "./style.css";

export default function CustomSelect({ options, value, onChange }) {
    const [open, setOpen] = useState(false);

    const toggle = () => setOpen(!open);
    const choose = (option) => {
        onChange(option);
        setOpen(false);
    };

    return (
        <div className="custom-select">
            <button className="select-trigger" onClick={toggle}>
                <span>{value}</span>
                {open ?
                    <span className="arrow">▲</span> :
                    <span className="arrow">▼</span>
                }
            </button>

            {open && (
                <div className="select-options">
                    {options.map((opt: any) => (
                        <div
                            key={opt}
                            className={`select-option ${opt === value ? "active" : ""}`}
                            onClick={() => choose(opt)}
                        >
                            {opt}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
