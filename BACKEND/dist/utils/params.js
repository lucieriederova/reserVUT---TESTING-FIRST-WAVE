export function toSingleParam(value) {
    if (!value)
        return undefined;
    return Array.isArray(value) ? value[0] : value;
}
