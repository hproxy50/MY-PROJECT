import { useState } from 'react';
import API from '../api/api';
import { Link, useNavigate } from 'react-router-dom';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await API.post('/auth/register', form);
      alert('Đăng ký thành công. Mời bạn đăng nhập!');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi đăng ký');
    }
  };

  return (
    <div className="container mt-5">
      <h2 className="text-center mb-4">Đăng ký</h2>
      <form onSubmit={handleRegister} className="mx-auto" style={{ maxWidth: '500px' }}>
        {error && <div className="alert alert-danger">{error}</div>}

        <div className="mb-3">
          <label className="form-label">Họ tên:</label>
          <input type="text" className="form-control" name="name" required value={form.name} onChange={handleChange} />
        </div>

        <div className="mb-3">
          <label className="form-label">Email:</label>
          <input type="email" className="form-control" name="email" required value={form.email} onChange={handleChange} />
        </div>

        <div className="mb-3">
          <label className="form-label">Số điện thoại:</label>
          <input type="text" className="form-control" name="phone" required value={form.phone} onChange={handleChange} />
        </div>

        <div className="mb-3">
          <label className="form-label">Mật khẩu:</label>
          <input type="password" className="form-control" name="password" required value={form.password} onChange={handleChange} />
        </div>

        <button type="submit" className="btn btn-success w-100">Đăng ký</button>

        <p className="mt-3 text-center">
          Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
        </p>
      </form>
    </div>
  );
}
