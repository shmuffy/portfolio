import { useState } from "react";
import { myProjects } from "../constants/index.js";

const Projects = () => {
    const [activeTab, setActiveTab] = useState("software");
    const [showModal, setShowModal] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);
    const [currentProjectIndex, setCurrentProjectIndex] = useState(null);

    const filteredProjects = myProjects;

    const handleCardClick = (project, index) => {
        setSelectedProject(project);
        setCurrentProjectIndex(index);
        setShowModal(true);
    };

    const closeModal = () => {
        setSelectedProject(null);
        setCurrentProjectIndex(null);
        setShowModal(false);
    };

    const handleNextProject = () => {
        if (currentProjectIndex === null) return;
        const newIndex =
            currentProjectIndex === filteredProjects.length - 1
                ? 0
                : currentProjectIndex + 1;

        setCurrentProjectIndex(newIndex);
        setSelectedProject(filteredProjects[newIndex]);
    };

    const handlePrevProject = () => {
        if (currentProjectIndex === null) return;
        const newIndex =
            currentProjectIndex === 0
                ? filteredProjects.length - 1
                : currentProjectIndex - 1;

        setCurrentProjectIndex(newIndex);
        setSelectedProject(filteredProjects[newIndex]);
    };

    return (
        <section className="c-space my-20" id="projects">
            <p className="head-text">My Projects</p>

            {/* Tab Buttons */}
            <div className="mt-6 flex gap-4">
                <button
                    onClick={() => setActiveTab("software")}
                    className={`px-4 py-2 rounded-md 
            ${
                        activeTab === "software"
                            ? "bg-black-200 text-white"
                            : "bg-gray-600 text-white"
                    }
            transition-colors duration-300
          `}
                >
                    Software
                </button>
                <button
                    onClick={() => setActiveTab("hardware")}
                    className={`px-4 py-2 rounded-md 
            ${
                        activeTab === "hardware"
                            ? "bg-black-200 text-white"
                            : "bg-gray-600 text-white"
                    }
            transition-colors duration-300
          `}
                >
                    Hardware
                </button>
            </div>

            {/* Projects Grid */}
            <div className="grid lg:grid-cols-2 grid-cols-2 mt-12 gap-5 w-full">
                {filteredProjects.map((project, index) => (
                    <div
                        key={index}
                        onClick={() => handleCardClick(project, index)}
                        className="flex flex-col gap-5 relative sm:p-2 py-5 px-5
                       shadow-2xl shadow-black-200 rounded-xl bg-black-200
                       transform transition-transform duration-300
                       hover:-translate-y-2 cursor-pointer"
                    >
                        {/* Image section */}
                        <div className="absolute top-0 right-0 w-full h-96">
                            <img
                                src={project.spotlight}
                                alt={project.title}
                                className="w-full h-full object-cover rounded-xl"
                            />
                        </div>

                        {/* Text content */}
                        <div className="relative z-10 mt-48">
                            <h3 className="text-xl font-bold text-white">
                                {project.title}
                            </h3>
                            <p className="mt-2 text-sm text-gray-200">
                                {project.desc}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {showModal && selectedProject && (
                <div
                    className="
            fixed
            inset-0
            z-50
            flex
            items-center
            justify-center
            bg-black
            bg-opacity-20
            px-4
            py-8
          "
                >
                    <div className="bg-gray-800 rounded-lg p-6 relative w-full max-w-2xl">
                        {/* Close button */}
                        <button
                            onClick={closeModal}
                            className="absolute top-3 right-3 text-gray-300 hover:text-gray-400 text-2xl"
                        >
                            &#10005;
                        </button>

                        {/* Prev Arrow */}
                        <button
                            onClick={handlePrevProject}
                            className="absolute left-2 top-1/2 transform -translate-y-1/2 text-3xl text-gray-300 hover:text-gray-400"
                        >
                            &#8249;
                        </button>

                        {/* Next Arrow */}
                        <button
                            onClick={handleNextProject}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-3xl text-gray-300 hover:text-gray-400"
                        >
                            &#8250;
                        </button>

                        {/* Additional detail image (optional) */}
                        {selectedProject.detailImage && (
                            <img
                                src={selectedProject.detailImage}
                                alt={`${selectedProject.title} Additional`}
                                className="max-h-80 w-full object-contain rounded mb-4"
                            />
                        )}

                        {/* Textual details */}
                        <h2 className="text-2xl font-bold mb-2 text-white">
                            {selectedProject.title}
                        </h2>
                        <p className="mb-2 text-gray-200">{selectedProject.desc}</p>
                        {selectedProject.subdesc && (
                            <p className="mb-4 text-gray-400">
                                {selectedProject.subdesc}
                            </p>
                        )}

                        {/* External link */}
                        {selectedProject.href && (
                            <a
                                href={selectedProject.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block text-blue-400 underline mb-4"
                            >
                                Watch Project Demo
                            </a>
                        )}

                        {/* Tags */}
                        {selectedProject.tags && (
                            <div className="flex flex-wrap gap-3 mt-2">
                                {selectedProject.tags.map((tag) => (
                                    <div
                                        key={tag.id}
                                        className="flex items-center gap-1 bg-gray-700 px-2 py-1 rounded"
                                    >
                                        <img
                                            src={tag.path}
                                            alt={tag.name}
                                            className="h-5 w-5"
                                        />
                                        <span className="text-sm text-white">
                      {tag.name}
                    </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </section>
    );
};

export default Projects;
