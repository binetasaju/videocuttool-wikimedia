import { createContext, useState, useMemo } from 'react';
import { getItemWithExpiry } from '../utils/storage';
const UserContext = createContext(null);

const UserContextProvider = ({ children }) => {
	const user = getItemWithExpiry( 'user' ) || null;
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
