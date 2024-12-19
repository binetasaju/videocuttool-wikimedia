import { createContext, useState, useMemo } from 'react';
import { getCookies } from '../utils/storage';
const UserContext = createContext(null);

const UserContextProvider = ({ children }) => {
	const user = JSON.parse(decodeURIComponent(getCookies('user'))) || null;
	const [currentUser, setCurrentUser] = useState(user);
	const contextValue = useMemo(
		() => ({
			currentUser,
			setCurrentUser
		}),
		[currentUser, setCurrentUser]
	);
	return <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>;
};
export { UserContextProvider, UserContext };
