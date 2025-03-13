import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from '../config/axios';
import { UserContext } from '../context/user.context';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { setUser } = useContext(UserContext);
    const navigate = useNavigate();

    const submitHandler = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('/users/login', { email, password });
            localStorage.setItem('token', res.data.token);
            setUser(res.data.user);
            navigate('/');
        } catch (err) {
            console.error(err.response?.data || 'Login failed');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 font-sans" 
             style={{
                backgroundColor: '#0a1a20',
                backgroundImage: `
                    radial-gradient(650px circle at 0% 0%,
                        #103d43 15%,
                        #082c35 35%,
                        #061a20 75%,
                        #051015 80%,
                        transparent 100%),
                    radial-gradient(1250px circle at 100% 100%,
                        #0b486b 15%,
                        #073045 35%,
                        #051a25 75%,
                        #03131d 80%,
                        transparent 100%)
                `
             }}>
            <div className="container mx-auto">
                <div className="flex flex-col md:flex-row">
                    {/* Left Column - Text */}
                    <div className="md:w-1/2 text-center md:text-left flex flex-col justify-center mb-8 md:mb-0">
                        <h1 className="my-5 text-4xl font-bold leading-tight px-3" style={{color: '#e0f5ff'}}>
                            Welcome Back <br />
                            <span style={{color: '#4cc9bd'}}>to our platform</span>
                        </h1>
                        <p className="px-3" style={{color: '#a3e0ff'}}>
                            Access your account to manage your projects, 
                            track your progress, and connect with our 
                            community. We're glad to see you again!
                        </p>
                    </div>
                    
                    {/* Right Column - Login Form */}
                    <div className="md:w-1/2 relative">
                        {/* Decorative Elements */}
                        <div className="absolute rounded-full shadow-lg h-56 w-56 -top-16 -left-32" 
                             style={{
                                background: 'radial-gradient(#083a2c, #05a67b)',
                                overflow: 'hidden'
                             }}>
                        </div>
                        <div className="absolute shadow-lg -bottom-16 -right-28 w-72 h-72" 
                             style={{
                                borderRadius: '38% 62% 63% 37% / 70% 33% 67% 30%',
                                background: 'radial-gradient(#065073, #0596a6)',
                                overflow: 'hidden'
                             }}>
                        </div>
                        
                        {/* Card - Slightly bigger and with green-blue-black glass effect */}
                        <div className="my-5 rounded-lg shadow-lg p-6 relative z-10 max-w-md mx-auto" 
                             style={{
                                backgroundColor: 'rgba(10, 30, 35, 0.8)',
                                backdropFilter: 'saturate(180%) blur(20px)',
                                border: '1px solid rgba(0, 240, 180, 0.1)'
                             }}>
                            <form onSubmit={submitHandler} className="space-y-6">
                                <h2 className="text-3xl font-bold text-center mb-6" style={{color: '#4cc9bd'}}>Login</h2>
                                
                                <div>
                                    <label className="block text-gray-300 mb-2 text-sm font-medium" htmlFor="email">Email</label>
                                    <input
                                        onChange={(e) => setEmail(e.target.value)}
                                        type="email"
                                        id="email"
                                        className="w-full p-3 rounded-lg bg-gray-900 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                                        placeholder="Enter your email"
                                        required
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-gray-300 mb-2 text-sm font-medium" htmlFor="password">Password</label>
                                    <input
                                        onChange={(e) => setPassword(e.target.value)}
                                        type="password"
                                        id="password"
                                        className="w-full p-3 rounded-lg bg-gray-900 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                                        placeholder="Enter your password"
                                        required
                                    />
                                </div>
                                
                                <button
                                    type="submit"
                                    className="w-full p-3 rounded-lg text-white font-medium transition-all duration-300"
                                    style={{
                                        background: 'linear-gradient(to right, #05a67b, #0596a6)',
                                        boxShadow: '0 4px 12px rgba(5, 166, 123, 0.3)'
                                    }}
                                >
                                    Login
                                </button>
                            </form>
                            
                            <p className="text-gray-400 mt-6 text-center text-sm">
                                Don't have an account?{' '}
                                <Link to="/register" className="text-teal-400 hover:text-teal-300 hover:underline transition-all">
                                    Sign up
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;