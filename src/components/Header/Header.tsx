import React from "react";
import styles from "./Header.module.scss";

import FIA from "./img/FIA.svg";

import F1 from "./img/F1.svg";

import Sign from "./img/Sign.svg";
import { Link } from "react-router";
const Header = () => {
  return (
    <div className={styles.header}>
      <div className={styles.topbar}>
        <div className={styles.logo}>
          <nav className={styles.nav}>
            <img className={styles.logo} src={FIA} alt="FIA Logo"></img>
            <a href="#">F1</a>
            <a href="#">F2</a>
            <a href="#">F3</a>
          </nav>
        </div>
      </div>
      <div className={styles.mainbar}>
        <img className={styles.logoMain} src={F1} alt="F1"></img>
        <nav className={styles.menu}>
          <Link to="/">Home</Link>
          <Link to="/Drivers">Drivers</Link>
          <Link to="/Schedule">Schedule</Link>
          <Link to="/standings">Standings</Link>
          <Link to="/teams">Teams</Link>
          <Link to="/live">Live Timing</Link>
        </nav>
        <div className={styles.buttons}>
          <button className={styles.signIn}>
            <img src={Sign} alt="Icon"></img>Sign in
          </button>
          <button className={styles.subscribe}>Subscribe</button>
        </div>
      </div>
    </div>
  );
};

export default Header;
