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
        <main className='p-6 bg-gray-100 min-h-screen font-sans'>
            <div className='flex justify-between items-center mb-6'>
                <img src='/logo.png' alt='NeuroCode AI' className='h-10' />
                <h1 className='text-xl font-semibold'>Welcome back, {user?.name}</h1>
            </div>
            <div className='grid grid-cols-4 gap-4 mb-6'>
                <div className='p-4 bg-blue-100 rounded-lg shadow-md text-center'>
                    <h2 className='text-lg font-bold'>714k</h2>
                    <p className='text-gray-600'>Projects Created</p>
                </div>
                <div className='p-4 bg-green-100 rounded-lg shadow-md text-center'>
                    <h2 className='text-lg font-bold'>1.35m</h2>
                    <p className='text-gray-600'>Active Users</p>
                </div>
                <div className='p-4 bg-yellow-100 rounded-lg shadow-md text-center'>
                    <h2 className='text-lg font-bold'>1.72m</h2>
                    <p className='text-gray-600'>Code Generated</p>
                </div>
                <div className='p-4 bg-red-100 rounded-lg shadow-md text-center'>
                    <h2 className='text-lg font-bold'>234</h2>
                    <p className='text-gray-600'>Bug Reports</p>
                </div>
            </div>
            <div className='flex flex-wrap gap-4'>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className='p-6 border-2 border-dashed border-gray-500 rounded-lg bg-white hover:bg-gray-200 transition-all duration-300 flex items-center justify-center gap-2 w-64 h-40'>
                    <FaPlusCircle className='text-2xl text-blue-500' />
                    <span className='text-lg font-semibold'>New Project</span>
                </button>
                {projects.map((project) => (
                    <div
                        key={project._id}
                        onClick={() => navigate(`/project`, { state: { project } })}
                        className='cursor-pointer p-6 border border-gray-300 rounded-lg bg-white hover:bg-gray-200 transition-all duration-300 w-64 h-40 flex flex-col justify-between'>
                        <h2 className='font-semibold text-lg'>{project.name}</h2>
                        <p className='text-gray-600'><small>Collaborators: {project.users.length}</small></p>
                    </div>
                ))}
            </div>
            {isModalOpen && (
                <div className='fixed inset-0 flex items-center justify-center bg-black bg-opacity-50'>
                    <div className='bg-white p-6 rounded-lg shadow-2xl w-11/12 md:w-1/3'>
                        <h2 className='text-xl font-semibold mb-4'>Create New Project</h2>
                        <form onSubmit={createProject}>
                            <div className='mb-4'>
                                <label className='block text-sm font-medium text-gray-700 mb-1'>Project Name</label>
                                <input
                                    onChange={(e) => setProjectName(e.target.value)}
                                    value={projectName}
                                    type='text'
                                    className='mt-1 block w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none'
                                    placeholder='Enter project name'
                                    required
                                />
                            </div>
                            <div className='flex justify-end gap-2'>
                                <button
                                    type='button'
                                    className='px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400 transition-all duration-300'
                                    onClick={() => setIsModalOpen(false)}>
                                    Cancel
                                </button>
                                <button
                                    type='submit'
                                    className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300'>
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
