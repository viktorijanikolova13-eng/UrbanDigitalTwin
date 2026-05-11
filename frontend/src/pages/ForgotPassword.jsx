import "../styles/ForgotPassword.css";

function ForgotPassword() {
    return (
        <div className="forgot-container">

            <h2>Forgot Password</h2>

            <form className="forgot-form">

                <input
                    type="email"
                    placeholder="Enter your email"
                />

                <button type="submit">
                    Reset Password
                </button>

            </form>

        </div>
    );
}

export default ForgotPassword;