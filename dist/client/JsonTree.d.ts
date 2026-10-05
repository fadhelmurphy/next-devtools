/** Collapsible JSON viewer for config, payloads and response bodies. */
export declare function JsonTree({ value, name, depth, open }: {
    value: unknown;
    name?: string;
    depth?: number;
    open?: number;
}): import("react").JSX.Element;
