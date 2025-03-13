import React, { useContext, useState, useEffect } from 'react';
import { UserContext } from '../context/user.context';
import axios from "../config/axios";
import { useNavigate } from 'react-router-dom';

const Home = () => {
    const { user } = useContext(UserContext);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [projectName, setProjectName] = useState('');
    const [projects, setProjects] = useState([]);
    const navigate = useNavigate();

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

    useEffect(() => {
        axios.get('/projects/all')
            .then((res) => setProjects(res.data.projects))
            .catch(err => console.log(err));
    }, []);

    return (
        <main className='p-6 bg-gradient-to-br from-gray-900 to-black min-h-screen text-white font-sans'>
            <div className="projects flex flex-wrap gap-4">
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="p-6 border-2 border-dashed border-gray-700 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 transition-all duration-300 flex items-center justify-center gap-2 w-64 h-40">
                    <i className="ri-add-circle-line text-2xl text-blue-500"></i>
                    <span className='text-lg font-semibold'>New Project</span>
                </button>
                {projects.map((project) => (
                    <div
                        key={project._id}
                        onClick={() => navigate(`/project`, { state: { project } })}
                        className="cursor-pointer p-6 border border-gray-700 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 transition-all duration-300 w-64 h-40 flex flex-col justify-between">
                        <h2 className='font-semibold text-lg'>{project.name}</h2>
                        <div className="flex gap-2 text-gray-400">
                            <p><small><i className="ri-user-line"></i> Collaborators:</small></p>
                            <span className='text-white'>{project.users.length}</span>
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-lg shadow-2xl w-11/12 md:w-1/3 border border-gray-700">
                        <h2 className="text-xl font-semibold mb-4">Create New Project</h2>
                        <form onSubmit={createProject}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-400 mb-1">Project Name</label>
                                <input
                                    onChange={(e) => setProjectName(e.target.value)}
                                    value={projectName}
                                    type="text"
                                    className="mt-1 block w-full p-3 border border-gray-700 bg-gray-800 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    placeholder="Enter project name"
                                    required
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    className="px-4 py-2 bg-gradient-to-br from-gray-700 to-gray-600 text-white rounded-lg hover:from-gray-600 hover:to-gray-500 transition-all duration-300"
                                    onClick={() => setIsModalOpen(false)}>
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300">
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