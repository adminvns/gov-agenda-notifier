import React from 'react';
import './AdminNavigationLink.scss';

function AdminNavigationLink({ icon, linkText, setView, active }) {


  return (
    <li className="admin-nav-link">
      <button className={active ? "button-active" : ""}onClick={setView}>
        <div className="button-group">
          <div className="button-group-inner">
            <img className="button-icon" src={icon} />
            <span className="button-text">{linkText}</span>
          </div>
        </div>
      </button>
    </li>
  );
}

export default AdminNavigationLink;