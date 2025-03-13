import React, { useContext, useState, useEffect } from 'react';
import { UserContext } from '../context/user.context';
import axios from "../config/axios";
import { useNavigate } from 'react-router-dom';
import { FaPlusCircle } from 'react-icons/fa';

const Home = () => {
    const { user } = useContext(UserContext);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [projectName, setProjectName] = useState('');
    const [projects, setProjects] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        axios.get('/projects/all')
            .then((res) => setProjects(res.data.projects))
            .catch(err => console.log(err));
    }, []);

    function createProject(e) {
        e.preventDefault();
        axios.post('/projects/create', { name: projectName })
            .then((res) => {
                setProjects([...projects, res.data.project]);
                setIsModalOpen(false);
                setProjectName('');
            })
            .catch((error) => console.log(error));
    }

    return (
        <main 
            className='min-h-screen font-inter' 
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
            }}
        >
            <div className='p-6 container mx-auto'>
                {/* Enhanced Header with Text Logo */}
                <div className='flex flex-col md:flex-row justify-between items-center mb-12'>
                <div className='text-2xl md:text-3xl font-extrabold tracking-tight mb-4 md:mb-0'>
    <span className='bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-blue-500'>
        NeuroCode AI
    </span>
</div>
                    <h1 className='text-xl font-medium text-white'>Welcome back, <span className='font-semibold'>{user?.name || 'User'}</span></h1>
                </div>

                {/* Relevant Information Section */}
                <div className='mb-10 p-6 rounded-xl bg-opacity-20 backdrop-filter backdrop-blur-md border border-opacity-20'
                    style={{
                        backgroundColor: 'rgba(10, 30, 35, 0.7)',
                        borderColor: 'rgba(76, 201, 189, 0.3)'
                    }}>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                        <div>
                            <h3 className='text-lg font-medium text-teal-400 mb-2'>Recent Activity</h3>
                            <p className='text-gray-300 leading-relaxed'>
                                Your team has been active in the last 7 days with 3 new commits and 2 resolved issues.
                                Continue your momentum by exploring your projects below.
                            </p>
                        </div>
                        <div>
                            <h3 className='text-lg font-medium text-blue-400 mb-2'>Platform Updates</h3>
                            <p className='text-gray-300 leading-relaxed'>
                                We've recently added new AI code generation templates and improved collaboration features.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Projects Section */}
                <h2 className='text-2xl font-bold mb-6 text-white'>Your Projects</h2>
                <div className='flex flex-wrap gap-4'>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className='p-6 border-2 border-dashed rounded-lg transition-all duration-300 flex items-center justify-center gap-2 w-64 h-40'
                        style={{
                            borderColor: 'rgba(76, 201, 189, 0.5)',
                            backgroundColor: 'rgba(10, 30, 35, 0.7)',
                            backdropFilter: 'blur(8px)'
                        }}
                    >
                        <FaPlusCircle className='text-2xl' style={{color: '#4cc9bd'}} />
                        <span className='text-lg font-semibold text-white'>New Project</span>
                    </button>
                    
                    {projects.map((project) => (
                        <div
                            key={project._id}
                            onClick={() => navigate(`/project`, { state: { project } })}
                            className='cursor-pointer p-6 rounded-lg transition-all duration-300 w-64 h-40 flex flex-col justify-between hover:shadow-lg'
                            style={{
                                backgroundColor: 'rgba(10, 30, 35, 0.8)',
                                backdropFilter: 'saturate(180%) blur(20px)',
                                border: '1px solid rgba(0, 240, 180, 0.1)'
                            }}
                        >
                            <h2 className='font-semibold text-lg text-white'>{project.name}</h2>
                            <p className='text-gray-400'><small>Collaborators: {project.users.length}</small></p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className='fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50'>
                    <div className='p-6 rounded-lg shadow-2xl w-11/12 md:w-1/3'
                        style={{
                            backgroundColor: 'rgba(10, 30, 35, 0.9)',
                            backdropFilter: 'saturate(200%) blur(25px)',
                            border: '1px solid rgba(0, 240, 180, 0.1)'
                        }}
                    >
                        <h2 className='text-xl font-semibold mb-4 text-white'>Create New Project</h2>
                        <form onSubmit={createProject}>
                            <div className='mb-4'>
                                <label className='block text-sm font-medium text-gray-300 mb-1'>Project Name</label>
                                <input
                                    onChange={(e) => setProjectName(e.target.value)}
                                    value={projectName}
                                    type='text'
                                    className='mt-1 block w-full p-3 rounded-lg bg-gray-900 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all'
                                    placeholder='Enter project name'
                                    required
                                />
                            </div>
                            <div className='flex justify-end gap-2'>
                                <button
                                    type='button'
                                    className='px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-all duration-300'
                                    onClick={() => setIsModalOpen(false)}>
                                    Cancel
                                </button>
                                <button
                                    type='submit'
                                    className='px-4 py-2 text-white rounded-lg transition-all duration-300'
                                    style={{
                                        background: 'linear-gradient(to right, #05a67b, #0596a6)',
                                        boxShadow: '0 4px 12px rgba(5, 166, 123, 0.3)'
                                    }}>
                                    Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
};

export default Home;