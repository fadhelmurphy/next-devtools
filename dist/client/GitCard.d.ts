export declare function timeAgo(iso: string, now?: number): string;
/** Last commit that changed a component (any of its lines), plus the file's last commit. */
export declare function GitCard({ file, line, name }: {
    file: string;
    line?: number;
    name?: string;
}): import("react").JSX.Element;
