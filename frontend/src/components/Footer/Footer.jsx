import React from "react";
import "./Footer.css";
import { FaInstagram, FaTwitter, FaYoutube } from "react-icons/fa";
import {Link} from "react-router-dom";

const Footer = () => {
    return (
        <footer className="footer">
            <div className="footer-container">


                <div className="footer-left">
                    <p>Copyright © 2026 Urban Digital Twin</p>
                    <p>All rights reserved</p>

                    <div className="social-icons">
                        <a href="#"><FaInstagram /></a>
                        <a href="#"><FaTwitter /></a>
                        <a href="#"><FaYoutube /></a>
                    </div>
                </div>


                <div className="footer-middle">
                    <Link to="/">Home</Link>
                    <Link to="/prediction">Prediction</Link>
                    <Link to="/simulation">Simulation</Link>
                    <Link to="/analytics">Analytics</Link>
                </div>


                <div className="footer-right">
                    <h3>Stay up to date</h3>
                    <div className="email-box">
                        <input type="email" placeholder="Your email address" />
                        <button>➤</button>
                    </div>
                </div>

            </div>
        </footer>
    );
};

export default Footer;