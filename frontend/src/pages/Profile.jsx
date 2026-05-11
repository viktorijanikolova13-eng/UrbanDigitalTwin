import React, { useEffect, useState } from "react";
import "../styles/Profile.css";
import { useNavigate } from "react-router-dom";

function Profile() {

    const [user, setUser] = useState(null);

    const navigate = useNavigate();

    useEffect(() => {

        const token = localStorage.getItem("token");

        if (!token) {
            navigate("/login");
            return;
        }

        fetch("http://localhost:10000/api/auth/me", {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
            .then((res) => {

                if (!res.ok) {
                    throw new Error("Unauthorized");
                }

                return res.json();
            })
            .then((data) => {
                setUser(data);
            })
            .catch(() => {
                localStorage.removeItem("token");
                navigate("/login");
            });

    }, [navigate]);

    const handleSave = async () => {

        const token = localStorage.getItem("token");

        try {

            const response = await fetch(
                "http://localhost:10000/api/auth/update",
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        username: user.username,
                        email: user.email,
                    }),
                }
            );

            if (response.ok) {

                alert("Profile updated successfully");

            } else {

                alert("Failed to update profile");
            }

        } catch (error) {

            console.error(error);

            alert("Error updating profile");
        }
    };

    const handleLogout = () => {

        localStorage.removeItem("token");

        navigate("/login");
    };

    if (!user) {
        return <h2 className="loading-text">Loading...</h2>;
    }

    return (
        <div className="profile-page">

            <div className="profile-card">

                <h1 className="profile-title">
                    Welcome back {user.fullName}
                </h1>

                <div className="profile-avatar">
                    👤
                </div>

                <div className="profile-info">

                    <input
                        type="text"
                        value={user.username}
                        className="profile-field"
                        onChange={(e) =>
                            setUser({
                                ...user,
                                username: e.target.value,
                            })
                        }
                    />

                    <input
                        type="email"
                        value={user.email}
                        className="profile-field"
                        onChange={(e) =>
                            setUser({
                                ...user,
                                email: e.target.value,
                            })
                        }
                    />

                    <input
                        type="text"
                        value={user.role}
                        className="profile-field"
                        readOnly
                    />

                </div>
                <button
                    className="save-btn"
                    onClick={handleSave}
                >
                    Save Changes
                </button>

                <button
                    className="logout-btn"
                    onClick={handleLogout}
                >
                    Logout
                </button>

            </div>

        </div>
    );
}

export default Profile;