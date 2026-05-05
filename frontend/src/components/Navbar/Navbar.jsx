import "./Navbar.css";
import logo from "../../assets/logo.png";
import { Link } from "react-router-dom";

function Navbar() {
    return (
        <nav className="navbar">
            <div className="navbar-left">
                <img src={logo} alt="logo" className="logo" />
                <span className="title">URBAN DIGITAL TWIN</span>
            </div>

            <div className="navbar-center">
                <Link to="/">Home</Link>
                <Link to="/prediction">Prediction</Link>
                <Link to="/simulation">Simulation</Link>
                <Link to="/analytics">Analytics</Link>
                <Link to="/">Profile</Link>
            </div>

            <div className="navbar-right">
                <button className="register-btn">Register Now →</button>
            </div>
        </nav>
    );
}

export default Navbar;