export const mockContext = (overrides: Record<string, any> = {}) => ({
    req: { headers: { authorization: 'Bearer fake-token' } },
    ...overrides,
});

export const mockFileUpload = (filename = 'logo.png', mimetype = 'image/png') =>
    Promise.resolve({
        filename,
        mimetype,
        encoding: '7bit',
        createReadStream: () => {
            const { Readable } = require('stream');
            return Readable.from(['fake-content']);
        },
    });