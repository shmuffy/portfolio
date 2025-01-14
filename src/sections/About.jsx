import { PythonOriginal, COriginal, RustOriginal, JavaOriginal, RosOriginal, PytorchOriginal, VscodeOriginal, LinuxOriginal, GitOriginal, GazeboOriginal, DockerOriginal, UbuntuOriginal} from 'devicons-react';
import { useState } from 'react';
//import Button from '../components/Button.jsx';

const About = () => {
    const [hasCopied, setHasCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText('christiansactualbusiness@gmail.com');
        setHasCopied(true);

        setTimeout(() => {
            setHasCopied(false);
        }, 2000);
    };

    return (
        <section className="c-space my-20" id="about">
            <div className="grid xl:grid-cols-2 xl:grid-rows-6 md:grid-cols-2 grid-cols-1 gap-5 h-full">
                {/* LEFT SIDE BLOCK */}
                <div className="col-span-1 xl:row-span-3">
                    <div className="grid-container">
                        <img
                            src="assets/grid.jpg"
                            alt="grid-1"
                            className="w-full sm:h-[276px] h-fit object-contain"
                        />
                        <div>
                            <p className="grid-headtext">Hi, I&apos;m Christian</p>
                            <p className="grid-subtext">
                                I&apos;m an Electrical Engineer with a passion for robotics and AI. My goal is to add a little joy in this
                                world where everyone can have access to cooperative robots. Perchance, shall we reach the age of Mechas?
                            </p>
                        </div>
                    </div>
                </div>

                {/* DEVICONS SECTION */}
                <div className="col-span-1 xl:row-span-3">
                    <div className="grid-container">
                        <div className="flex flex-row gap-8">
                            <PythonOriginal size={60}/>
                            <COriginal size={60}/>
                            <LinuxOriginal size={60}/>
                            <VscodeOriginal size={60}/>
                            <RustOriginal size={60}/>
                            <JavaOriginal size={60}/>
                        </div>
                        <div className="flex flex-row gap-8">
                            <RosOriginal size={60}/>
                            <GitOriginal size={60}/>
                            <GazeboOriginal size={60}/>
                            <PytorchOriginal size={60}/>
                            <DockerOriginal size={60}/>
                            <UbuntuOriginal size={60}/>
                        </div>
                        <div>
                            <p className="grid-headtext"> Technologies </p>
                            <p className="grid-subtext"> <b>Programming:</b> Python, C/C++, Rust, Anaconda, PID control, RTOS,
                                ThreeJS, React, and Javascript. </p>
                            <p className="grid-subtext"> <b>Robotics Framework:</b> ROS, ROS2, Ubuntu, Gazebo, and PX4
                                Autopilot. </p>
                            <p className="grid-subtext"> <b>AI:</b> PyTorch, Tensorflow, Carla, OpenCV, YOLO, and SAM 2. </p>
                            <p className="grid-subtext"> <b>Hardware:</b> MCUs, USB, CAN, UART, SPI, I2C, Quad-SPI, and Flex
                                PCB. </p>
                            <p className="grid-subtext"> <b>Tools:</b> Altium Designer, LTSpice, Solidworks, Ansys, Visual
                                Studio, JetBrain, Microsoft Excel, Git, Github, Docker. </p>
                            <p className="grid-subtext"> <b>Other:</b> Oscilloscopes, Power supplies, Soldering, and CAD
                                Design. </p>
                        </div>
                    </div>
                </div>

                <div className="xl:col-span-1 xl:row-span-3">
                    <div className="grid-container">
                        <img src="assets/musicpcb.jpg" alt="grid-3" className="w-full sm:h-[266px] h-fit object-contain"/>

                        <div>
                            <p className="grid-headtext">Why?</p>
                            <p className="grid-subtext">
                                I&apos;ve always loved solving problems and building things.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="xl:col-span-1 xl:row-span-3">
                    <div className="grid-container">
                        <img
                            src="assets/deeplearning.svg"
                            alt="grid-4"
                            className="w-full md:h-[276px] sm:h-[276px] h-full object-fill sm:object-top"
                        />

                        <div className="space-y-1">
                            <p className="grid-subtext text-center">Contact me</p>
                            <div className="copy-container" onClick={handleCopy}>
                                <img src={hasCopied ? 'assets/tick.svg' : 'assets/copy.svg'} alt="copy"/>
                                <p className="lg:text-2xl md:text-xl font-medium text-gray_gradient text-white">christiansactualbusiness@gmail.com </p>
                        </div>
                        </div>
                    </div>
                </div>

            </div>
        </section>
    )
}

export default About;
