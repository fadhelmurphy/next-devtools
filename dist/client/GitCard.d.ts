export declare function timeAgo(iso: string, now?: number): string;
/** Last commit for a component's file and line. */
export declare function GitCard({ file, line }: {
    file: string;
    line?: number;
}): import("react").JSX.Element;
