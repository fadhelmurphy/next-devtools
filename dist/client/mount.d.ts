/**
 * Renders the panel in its own React root inside a shadow DOM, so it neither
 * inherits the app's CSS nor shows up in (or re-renders with) the app's tree.
 */
export declare function mount(): () => void;
