import React, { useEffect, useContext, useRef } from 'react';
import { Image, Button, OverlayTrigger, Dropdown } from 'react-bootstrap';
import { Globe2, MenuDown, X } from 'react-bootstrap-icons';
import { Link } from 'react-router-dom'; // <--- 1. IMPORT LINK
import logo from '../logo.svg';
import { localesList } from '../utils/languages';
import { GlobalContext } from '../context/GlobalContext';
import Authentication from './Authentication';
import DarkModeToggle from './DarkModeToggle';
import GeneralPopover from './GeneralPopover';
import { Message } from '@wikimedia/react.i18n';
import languageIcon from "../language-dark.svg";
import languageIcon2 from "../language-light.svg"

function Header(props) {
    const { appState, updateAppState } = useContext(GlobalContext);
    const { current_locale: currentLocale, themeMode } = appState || {};

    const localeName = useRef(false);
    const { apiUrl } = props;

    useEffect(() => {
        if (currentLocale) {
            localeName.current = currentLocale.native_name;
        }
        document.body.setAttribute('theme', themeMode);
    }, [currentLocale]);

    const onThemeSwitch = () => {
        const currentTheme = document.body.getAttribute('theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';

        document.body.setAttribute('theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateAppState({ themeMode: newTheme });
    };

    const updateLocaleState = localeObj => {
        localStorage.setItem('localeObj', JSON.stringify(localeObj));
        localeName.current = localeObj.native_name;
        updateAppState({ current_locale: localeObj });
    };

    const closeHeader = () => {
        document.body.setAttribute('data-sidebar', 'hide');
    };

    const localesListProps = {
        id: 'locales-popover',
        title: 'Choose your language',
        body: Object.keys(localesList).map((code, index) => (
            <div
                className={`locale-item ${currentLocale && localesList[code].locale === currentLocale.locale && 'active'
                    }`}
                title={localesList[code].name}
                value={localesList[code].locale}
                onClick={() => updateLocaleState(localesList[code])}
                key={`locale-${index}`}
            >
                {localesList[code].native_name}
            </div>
        ))
    };

    return (
        <div id="sidebar">
            <div className="close-sidebar" onClick={closeHeader}>
                <X />
            </div>
            
            {/* --- 2. WRAP THE LOGO AND TITLE --- */}
            <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="logo-wrapper">
                    <Image alt="logo" src={logo} width="100" height="40" />
                    <h1 >
                        <Message id="title" />
                    </h1>
                </div>
            </Link>

            <div className="site">
                <div className="darkmode-button-phone">
                    <span className="darkmode-switch option-wrapper">
                        <DarkModeToggle switchTheme={onThemeSwitch} theme={themeMode} />
                    </span>
                </div>
                <div className="site-options-phone">
                    <OverlayTrigger
                        trigger="click"
                        rootClose
                        overlay={GeneralPopover(localesListProps)}
                        placement="bottom"
                    >
                        <span
                            className="language-switch option-wrapper"
                            title={currentLocale && currentLocale.native_name}
                        >
                            <span className="option-icon">
                                {themeMode === "dark" ? <img className='lang-icon' src={languageIcon} alt="" /> : <img className='lang-icon' src={languageIcon2} alt="" />}
                            </span>
                            <span className="option-title">{localeName.current}</span>
                        </span>
                    </OverlayTrigger>
                </div>
            </div>
            <div className='header-style'>
                <div className="site-options display-none-mobile">
                    <OverlayTrigger
                        trigger="click"
                        rootClose
                        placement="bottom"
                        overlay={GeneralPopover(localesListProps)}
                    >
                        <span
                            className="language-switch option-wrapper"
                            title={currentLocale && currentLocale.native_name}
                        >
                            <span className="option-icon">
                                {themeMode === "dark" ? <img className='lang-icon' src={languageIcon} alt="" /> : <img className='lang-icon' src={languageIcon2} alt="" />}
                            </span>
                            <span className="option-title">{localeName.current}</span>
                        </span>
                    </OverlayTrigger>
                </div>
                <span className='display-none-mobile'>
                    <DarkModeToggle switchTheme={onThemeSwitch} theme={themeMode} />
                </span>
                <div className="user-wrapper">
                    <Authentication apiUrl={apiUrl} />
                </div>
            </div>
        </div>
    );
}

export default Header;