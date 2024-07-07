export const getStoredItem = key => {
	const getStorage = localStorage.getItem(key);
	if (getStorage === null) {
		return null;
	}

	return JSON.parse(getStorage);
};

export const getItemWithExpiry = key => {
	const itemStr = localStorage.getItem(key);
	if (!itemStr) {
		return null;
	}
	const item = JSON.parse(itemStr);
	if (!item || !item.expiry) {
		return null;
	}
	const now = new Date();
	if (now.getTime() > item.expiry) {
		localStorage.removeItem(key);
		return null;
	}
	return item.value;
}

export const setItemWithExpiry = (key, value, ttl) => {
	const now = new Date();
	const item = {
		value: value,
		expiry: now.getTime() + ttl
	};
	localStorage
		.setItem(key, JSON.stringify(item));
}

export const storeItem = (key, value) => localStorage.setItem(key, JSON.stringify(value));

export const clearItems = items => {
	if (Array.isArray(items)) {
		items.forEach(item => localStorage.removeItem(item));
	}
};
