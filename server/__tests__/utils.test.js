const fs = require('fs');
const path = require('path');
const { convertTimeToMs, deleteFiles, moveVideosToPublic } = require('../utils.js');

describe('convertTimeToMs', () => {
	it('should convert time to milliseconds', () => {
		const time = '1:30:20.56';
		const expected = 5420560;
		const actual = convertTimeToMs(time);
		expect(actual).toBe(expected);
	});
});

describe('deleteFiles', () => {
	it('should delete a single file', () => {
		const unlinkMock = jest.spyOn(fs, 'unlink');
		const filePath = 'public/video.webm';

		deleteFiles(filePath);

		expect(unlinkMock).toHaveBeenCalledWith(filePath, expect.any(Function));
	});

	it('should delete multiple files', () => {
		const unlinkMock = jest.spyOn(fs, 'unlink');
		const filePaths = ['public/video.webm', 'public/hello.webm'];

		deleteFiles(filePaths);

		filePaths.forEach(filePath => {
			expect(unlinkMock).toHaveBeenCalledWith(filePath, expect.any(Function));
		});
	});
});

jest.mock('fs', () => ({
	copyFile: jest.fn(),
	unlink: jest.fn()
}));

describe('moveVideosToPublic', () => {
	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should move videos to the public directory', async () => {
		const videoPaths = ['video1.mp4', 'video2.mp4'];
		const currentDate = 1234567890; // Some example current date
		const mockedNewPath = 'mocked-new-path';

		// Mocking Date.now() to provide a consistent value for the current date
		Date.now = jest.fn(() => currentDate);

		// Mocking the path.join function to provide the expected new path
		jest.spyOn(path, 'join').mockReturnValue(mockedNewPath);

		// Mocking fs.copyFile to simulate success
		fs.copyFile.mockImplementation((src, dest, callback) => {
			callback(null);
		});

		// Calling the function
		const result = await moveVideosToPublic(videoPaths);

		// Assertions
		expect(fs.copyFile).toHaveBeenCalledTimes(videoPaths.length);
		expect(result).toEqual([
			`public/publicVideo-${currentDate}-0.mp4`,
			`public/publicVideo-${currentDate}-1.mp4`
		]);
	});

	it('should handle copyFile errors', async () => {
		const videoPaths = ['video1.mp4'];
		const mockedError = new Error('Copy file error');

		// Mocking Date.now() to provide a consistent value for the current date
		Date.now = jest.fn();

		// Mocking fs.copyFile to simulate an error
		fs.copyFile.mockImplementation((src, dest, callback) => {
			callback(mockedError);
		});

		// Calling the function
		await expect(moveVideosToPublic(videoPaths)).rejects.toThrow(mockedError);

		// Assertions
		expect(fs.copyFile).toHaveBeenCalledTimes(1);
	});
});
