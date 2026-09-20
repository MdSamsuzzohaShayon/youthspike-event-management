/** Generic factory helper for building typed mock objects */
export function createMock<T>(): jest.Mocked<T> {
    return new Proxy({} as any, {
        get: (_t, prop) => {
            if (typeof prop === 'string') {
                return jest.fn();
            }
            return undefined;
        },
    }) as jest.Mocked<T>;
}