export const getStoredItem = key => {
	const getStorage = localStorage.getItem(key);
	if (getStorage === null) {
		return null;
	}

	return JSON.parse(getStorage);
};

export const storeItem = (key, value) => localStorage.setItem(key, JSON.stringify(value));

export const clearItems = items => {
	if (Array.isArray(items)) {
		items.forEach(item => localStorage.removeItem(item));
	}
};

export const getCookieObject = () => {
	const cookies = document.cookie.split(';');
	const cookieObject = {};
	cookies.forEach(cookie => {
		const [key, value] = cookie.split('=');
		cookieObject[key.trim()] = value;
	});
	return cookieObject;
};

export const getCookies = key => {
	const cookieObject = getCookieObject();
	if (key && cookieObject.hasOwnProperty(key)) {
		return cookieObject[key];
	}
	return null;
};
