import { Message } from '@wikimedia/react.i18n';
import ENV_SETTINGS from '../env';
const { phab_link, docs_link } = ENV_SETTINGS();
import '../style/main.scss';
function Footer() {
    return (
        <div className="footer-wrapper">
              <div className='footer-style'>
                <div className='footer-date'> © 2019-
                    {new Date().getFullYear()}{' '}</div>
            </div>
            <div className='footer-content-left'>
                <a className='footer-style' target="_blank" rel="noreferrer" href={`${docs_link}`}>
                    <span>
                        <Message id="documentation" />
                    </span>
                </a>
                {' '}{' '}<span className='display-none-mobile'>|</span>
                {' '}{' '}
                <a className='footer-style' target="_blank" rel="noreferrer" href={`${phab_link}`}>
                    <span>
                        <Message id="report-issues" />
                    </span>
                </a>
                {' '}{' '}<span className='display-none-mobile'>|</span>
                {' '}{' '}
                <a className='footer-style'
                    target="_blank"
                    rel="noreferrer"
                    href="https://gerrit.wikimedia.org/r/admin/repos/labs/tools/VideoCutTool"
                >
                    <span>
                        <Message id="repository" />
                    </span>
                </a>
            </div>
        </div>
    )
}
export default Footer;