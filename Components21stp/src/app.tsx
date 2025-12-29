// This is a infrastructure component that renders demos
// Please do not modify this file

import React, { useEffect, useState } from "react";
const modules: Record<string, any> = import.meta.glob("./demos/*", {
    eager: true,
});

const AllExportsFromDemo = Object.entries(modules).reduce(
    (acc, [modulePath, module]) => {
        const { default: defaultExport } = module;
        const moduleKey = modulePath.split("/").pop() || "";

        if (defaultExport !== undefined) {
            acc[moduleKey] = defaultExport;
        }

        return acc;
    },
    {} as Record<string, any>
);

type DemoComponentType = React.ComponentType<any>;

interface DemoEntry {
    key: string;
    label: string;
    Component: DemoComponentType;
}

const isReactComponentCandidate = (
    candidate: any
): candidate is DemoComponentType => typeof candidate === "function";

const getComponentNameAndValidate = (
    component: any,
    suggestedName: string
): { name: string; isValid: boolean } => {
    const name =
        (component as any).displayName || (component as any).name || suggestedName;
    const isValidName =
        /^[A-Z]/.test(name) || name.toLowerCase().includes("demo");
    return { name, isValid: isValidName && isReactComponentCandidate(component) };
};

function App() {
    const demos: DemoEntry[] = [];
    const addedComponentFunctions = new Set<DemoComponentType>();
    const [selectedDemo, setSelectedDemo] = useState<DemoEntry | undefined>(
        undefined
    );

    const addDemo = (component: any, baseName: string) => {
        if (!component || addedComponentFunctions.has(component)) {
            return;
        }

        const { name: componentName, isValid } = getComponentNameAndValidate(
            component,
            baseName
        );
        if (isValid && isReactComponentCandidate(component)) {
            demos.push({
                key: `${baseName}_${componentName.replace(/\s+/g, "_")}`,
                label: baseName,
                Component: component,
            });
            addedComponentFunctions.add(component);
        }
    };

    // Initialize selectedDemo with the first demo if available
    useEffect(() => {
        if (demos.length > 0 && !selectedDemo) {
            setSelectedDemo(demos[0]);
        }
    }, [demos, selectedDemo]);

    const handleDemoChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedKey = event.target.value;
        const demo = demos.find((d) => d.key === selectedKey);
        setSelectedDemo(demo);
    };

    const { default: defaultExport, ...namedExports } = AllExportsFromDemo as {
        default?: any;
        [key: string]: any;
    };

    if (defaultExport !== undefined) {
        if (isReactComponentCandidate(defaultExport)) {
            addDemo(defaultExport, "default");
        } else if (Array.isArray(defaultExport)) {
            defaultExport.forEach((comp: any, index: number) => {
                addDemo(comp, `default_array_${index}`);
            });
        } else if (typeof defaultExport === "object" && defaultExport !== null) {
            Object.entries(defaultExport).forEach(([key, comp]: [string, any]) => {
                addDemo(comp, `default_object_${key}`);
            });
        }
    }

    Object.entries(namedExports).forEach(([key, comp]: [string, any]) => {
        addDemo(comp, key);
    });

    return (
        <>
            {demos.length > 0 && (
                <div className="fixed top-4 left-4 z-10">
                    <select
                        value={selectedDemo?.key}
                        onChange={handleDemoChange}
                        className="appearance-none h-8 max-w-[200px] text-sm leading-tight rounded-lg pl-3 pr-7 py-0 border bg-background focus:outline-none focus:ring-0"
                    >
                        {demos.map(({ key, label }) => (
                            <option key={key} value={key}>
                                {label}
                            </option>
                        ))}
                    </select>
                    <div className="absolute top-1/2 transform -translate-y-1/2 right-2 pointer-events-none">
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                            <path d="M5.516 7.548c.436-.446 1.043-.48 1.576 0L10 10.405l2.908-2.857c.533-.48 1.14-.446 1.576 0 .436.445.408 1.197 0 1.615l-3.734 3.705c-.533.534-1.39.534-1.923 0l-3.734-3.705c-.408-.418-.436-1.17 0-1.615z" />
                        </svg>
                    </div>
                </div>
            )}
            <div className="w-screen min-h-screen flex justify-center items-center">
                {demos.length === 0 ? (
                    <div>Add exports in demo.tsx to preview</div>
                ) : (
                    selectedDemo && <selectedDemo.Component key={selectedDemo.key} />
                )}
            </div>
        </>
    );
}

export default App;
