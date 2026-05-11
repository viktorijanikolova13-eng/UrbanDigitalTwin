import "../styles/Signup.css";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

function Signup() {

    const navigate = useNavigate();

    const [fullName, setFullName] = useState("");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const handleSignup = async (e) => {

        e.preventDefault();

        try {

            const response = await fetch(
                "http://localhost:10000/api/auth/register",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        fullName,
                        username,
                        email,
                        password,
                    }),
                }
            );

            const text = await response.text();

            console.log("STATUS:", response.status);
            console.log("RESPONSE:", text);

            if (response.ok) {

                const data = JSON.parse(text);

                localStorage.setItem("token", data.token);

                navigate("/profile");

            } else {

                alert(text);
            }

        } catch (error) {

            console.error("FULL ERROR:", error);

            alert(error.message);
        }
    };

    return (
        <div className="signup-container">

            <h2>Create an account!</h2>

            <div className="profile-icon">
                👤
            </div>

            <form
                className="signup-form"
                onSubmit={handleSignup}
            >

                <input
                    type="text"
                    placeholder="Full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                />

                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                />

                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />

                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />

                <input
                    type="password"
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                />

                <button type="submit">
                    Register
                </button>

            </form>

            <p className="auth-switch">
                Already have an account?{" "}
                <Link to="/login">
                    Sign in
                </Link>
            </p>

        </div>
    );
}

export default Signup;