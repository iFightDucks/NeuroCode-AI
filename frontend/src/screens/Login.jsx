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
                backgroundColor: 'hsl(218, 41%, 15%)',
                backgroundImage: `
                    radial-gradient(650px circle at 0% 0%,
                        hsl(218, 41%, 35%) 15%,
                        hsl(218, 41%, 30%) 35%,
                        hsl(218, 41%, 20%) 75%,
                        hsl(218, 41%, 19%) 80%,
                        transparent 100%),
                    radial-gradient(1250px circle at 100% 100%,
                        hsl(218, 41%, 45%) 15%,
                        hsl(218, 41%, 30%) 35%,
                        hsl(218, 41%, 20%) 75%,
                        hsl(218, 41%, 19%) 80%,
                        transparent 100%)
                `
             }}>
            <div className="container mx-auto">
                <div className="flex flex-col md:flex-row">
                    {/* Left Column - Text */}
                    <div className="md:w-1/2 text-center md:text-left flex flex-col justify-center mb-8 md:mb-0">
                        <h1 className="my-5 text-4xl font-bold leading-tight px-3" style={{color: 'hsl(218, 81%, 95%)'}}>
                            Welcome Back <br />
                            <span style={{color: 'hsl(218, 81%, 75%)'}}>to our platform</span>
                        </h1>
                        <p className="px-3" style={{color: 'hsl(218, 81%, 85%)'}}>
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
                                background: 'radial-gradient(#44006b, #ad1fff)',
                                overflow: 'hidden'
                             }}>
                        </div>
                        <div className="absolute shadow-lg -bottom-16 -right-28 w-72 h-72" 
                             style={{
                                borderRadius: '38% 62% 63% 37% / 70% 33% 67% 30%',
                                background: 'radial-gradient(#44006b, #ad1fff)',
                                overflow: 'hidden'
                             }}>
                        </div>
                        
                        {/* Card */}
                        <div className="my-5 rounded-lg shadow-lg p-5 relative z-10" 
                             style={{
                                backgroundColor: 'hsla(0, 0%, 100%, 0.9)',
                                backdropFilter: 'saturate(200%) blur(25px)'
                             }}>
                            <form onSubmit={submitHandler} className="space-y-6">
                                <h2 className="text-3xl font-bold text-gray-800 text-center mb-6">Login</h2>
                                
                                <div>
                                    <label className="block text-gray-700 mb-2 text-sm font-medium" htmlFor="email">Email</label>
                                    <input
                                        onChange={(e) => setEmail(e.target.value)}
                                        type="email"
                                        id="email"
                                        className="w-full p-3 rounded-lg bg-white text-gray-800 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                        placeholder="Enter your email"
                                        required
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-gray-700 mb-2 text-sm font-medium" htmlFor="password">Password</label>
                                    <input
                                        onChange={(e) => setPassword(e.target.value)}
                                        type="password"
                                        id="password"
                                        className="w-full p-3 rounded-lg bg-white text-gray-800 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                        placeholder="Enter your password"
                                        required
                                    />
                                </div>
                                
                                <div className="flex justify-center">
                                    <div className="form-check">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            id="flexCheckDefault"
                                        />
                                        <label className="form-check-label ml-2 text-gray-700 text-sm" htmlFor="flexCheckDefault">
                                            Remember me
                                        </label>
                                    </div>
                                </div>
                                
                                <button
                                    type="submit"
                                    className="w-full p-3 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
                                >
                                    Login
                                </button>
                                
                                <div className="text-center">
                                    <p className="text-gray-700 mb-3">or sign in with:</p>
                                    <div className="flex justify-center space-x-4">
                                        <a href="#!" className="mx-2 text-blue-600 hover:text-blue-800 transition-all">
                                            <i className="fab fa-facebook-f"></i>
                                        </a>
                                        <a href="#!" className="mx-2 text-blue-600 hover:text-blue-800 transition-all">
                                            <i className="fab fa-twitter"></i>
                                        </a>
                                        <a href="#!" className="mx-2 text-blue-600 hover:text-blue-800 transition-all">
                                            <i className="fab fa-google"></i>
                                        </a>
                                        <a href="#!" className="mx-2 text-blue-600 hover:text-blue-800 transition-all">
                                            <i className="fab fa-github"></i>
                                        </a>
                                    </div>
                                </div>
                            </form>
                            
                            <p className="text-gray-700 mt-6 text-center text-sm">
                                Don't have an account?{' '}
                                <Link to="/register" className="text-blue-600 hover:text-blue-500 hover:underline transition-all">
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