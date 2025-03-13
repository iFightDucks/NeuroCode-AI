import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserContext } from '../context/user.context';
import axios from '../config/axios';

const Register = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { setUser } = useContext(UserContext);
    const navigate = useNavigate();

    const submitHandler = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('/users/register', { email, password });
            localStorage.setItem('token', res.data.token);
            setUser(res.data.user);
            navigate('/');
        } catch (err) {
            console.error(err.response?.data || 'Registration failed');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black p-4 font-sans">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-gray-700 backdrop-blur-lg">
                <h2 className="text-3xl font-bold text-white text-center mb-6">Create an Account</h2>
                <form onSubmit={submitHandler} className="space-y-6">
                    <div>
                        <label className="block text-gray-400 mb-2 text-sm font-medium" htmlFor="email">Email</label>
                        <input
                            onChange={(e) => setEmail(e.target.value)}
                            type="email"
                            id="email"
                            className="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            placeholder="Enter your email"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-gray-400 mb-2 text-sm font-medium" htmlFor="password">Password</label>
                        <input
                            onChange={(e) => setPassword(e.target.value)}
                            type="password"
                            id="password"
                            className="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            placeholder="Enter your password"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full p-3 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
                    >
                        Register
                    </button>
                </form>
                <p className="text-gray-400 mt-6 text-center text-sm">
                    Already have an account?{' '}
                    <Link to="/login" className="text-blue-400 hover:text-blue-300 hover:underline transition-all">
                        Login
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Register;