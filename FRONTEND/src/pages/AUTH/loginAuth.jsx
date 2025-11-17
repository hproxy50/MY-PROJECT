import "../../css/Login.scss"
import loginImage from "../../assets/image/login.png"
export default function Login() {

    return(
        <div className="Login">
            <div className="Login-body">
                <div className="Login-body-left">
                    <img src={loginImage} alt="IMAGE" />
                </div>
                <div className="Login-body-right">
                    <div className="Login-body-right-form">
                        <h1>Login to eat!!!</h1>
                        <div className="Login-body-right-form-input">
                        <input className="Login-body-right-form-input-email" type="Email" placeholder="Email" />
                        <input className="Login-body-right-form-input-password" type="Password" placeholder="Password" />
                        </div>
                        <p className="Login-body-right-form-forgot" to="/forgot-password">Forget password?</p>
                        <button className="Login-body-right-form-login">Login</button>
                        <p className="Login-body-right-register"> No account yet? Register</p>
                    </div>
                </div>
            </div>
        </div>
    )

}