import "./Navbar.css";
import logo from "../../assets/logo.png";
import { Link, useNavigate } from "react-router-dom";

function Navbar() {

    const token = localStorage.getItem("token");

    const navigate = useNavigate();

    const handleLogout = () => {

        localStorage.removeItem("token");

        navigate("/login");
    };

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

                {token && (
                    <Link to="/profile">
                        Profile
                    </Link>
                )}
            </div>

            <div className="navbar-right">

                {!token ? (
                    <>
                        <Link to="/login" className="login-btn">
                            Login
                        </Link>

                        <Link to="/signup" className="register-btn">
                            Register Now →
                        </Link>
                    </>
                ) : (
                    <button
                        className="logout-btn-navbar"
                        onClick={handleLogout}
                    >
                        Logout
                    </button>
                )}

            </div>

        </nav>
    );
}

export default Navbar;