/** Make arbitrary runtime values safe for <JsonTree>: functions, elements, promises, cycles. */
export declare function serializable(value: unknown, depth?: number, seen?: WeakSet<object>): unknown;
