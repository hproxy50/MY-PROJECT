import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../../api/api';
import loginImage from "../../assets/image/login.png";
import "../../css/Register.scss";

export default function Register() {

  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'phone') {
      const isNumber = /^[0-9]*$/;
      
      if (isNumber.test(value) && value.length <= 10) {
        setForm({ ...form, [name]: value });
      }
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (form.phone.length < 10 && form.phone.length > 0) {
        setError("Phone number only have 10 digits");
        return;
    }

    try {
      await API.post('/auth/register', form);
      alert('Registration successful. Please log in!');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration error');
    }
  };

  return (
    <div className="register">
      <div className="register-body">
        <div className="register-body-left">
          <img src={loginImage} alt="IMAGE" />
        </div>
        <div className="register-body-right">
          <div className="register-body-right-form">
            <h1>Ready to eat ?</h1>
            {error && <div style={{ color: 'red', marginBottom: '10px', textAlign: 'center' }}>{error}</div>}
            <form onSubmit={handleRegister}>
              <div className="register-body-right-form-input">
                <input
                  className="register-body-right-form-input-email"
                  type="text"
                  name="name"
                  placeholder="Full Name"
                  required
                  value={form.name}
                  onChange={handleChange}
                />
                
                <input
                  className="register-body-right-form-input-email"
                  type="email"
                  name="email"
                  placeholder="Email"
                  required
                  value={form.email}
                  onChange={handleChange}
                />
                
                <input
                  className="register-body-right-form-input-password"
                  type="password"
                  name="password"
                  placeholder="Password"
                  required
                  value={form.password}
                  onChange={handleChange}
                />
                
                <input
                  className="register-body-right-form-input-email"
                  type="text" 
                  name="phone"
                  placeholder="Phone number"
                  required
                  value={form.phone}
                  onChange={handleChange}
                />
              </div>

              <button type="submit" className="register-body-right-form-submit">
                Submit
              </button>
            </form>

            <p className="Login-body-right-register">
              Already have account, login now &nbsp;
              <Link to="/login" style={{ textDecoration: 'none', color: 'inherit', fontWeight: 'bold' }}>
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}