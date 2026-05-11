import "../styles/Login.css";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

function Login() {

    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const handleLogin = async (e) => {
        e.preventDefault();

        try {

            const response = await fetch("http://localhost:10000/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    username,
                    password
                }),
            });

            const data = await response.json();

            if (response.ok) {

                // SAVE TOKEN
                localStorage.setItem("token", data.token);

                navigate("/profile");

            } else {
                alert("Invalid credentials");
            }

        } catch (error) {
            console.error(error);
            alert("Login failed");
        }
    };

    return (
        <div className="login-container">

            <h2>Welcome back User</h2>

            <div className="profile-icon">
                👤
            </div>

            <form
                className="login-form"
                onSubmit={handleLogin}
            >

                <input
                    type="text"
                    placeholder="Enter username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />

                <input
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                <button type="submit">
                    Login
                </button>

            </form>

            <p className="forgot-password">
                <Link to="/forgot-password">
                    Forgot password?
                </Link>
            </p>

            <p className="auth-switch">
                Don’t have an account?{" "}
                <Link to="/signup">
                    Sign up
                </Link>
            </p>

        </div>
    );
}

export default Login;