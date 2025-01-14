import {Canvas} from "@react-three/fiber";
import {PerspectiveCamera} from "@react-three/drei";
import {Suspense} from "react";
import CanvasLoader from "../components/CanvasLoader.jsx";
import {useMediaQuery} from "react-responsive";
import {calculateSizes} from "../constants/index.js";

import RobotMain from "../components/RobotMain.jsx";
import Button from "../components/Button.jsx";
import Battery from "../components/Battery.jsx";
import RobotArm from "../components/RobotArm.jsx";
import Glados from "../components/Glados.jsx";
import Rubiks from "../components/Rubiks.jsx";
import HeroCamera from "../components/HeroCamera.jsx";


const Hero = () => {

    const isSmall = useMediaQuery({maxWidth: 440})
    const isMobile = useMediaQuery({maxWidth: 768})
    const isTablet = useMediaQuery({minWidth: 768, maxWidth: 1024})

    const sizes = calculateSizes(isSmall, isMobile, isTablet);

    console.log(
        isMobile
    )

    return (
        <section className="min-h-screen w-full flex flex-col relative" id="home">
            <div className="w-full mx-auto flex flex-col sm:mt-36 mt-20 c-space gap-3">
                <p className="sm:text-3xl text-2xl font-medium text-white text-center font-generalsans">Hello, my name is Christian <span className="waving-hand">🔋</span></p>
                <p className="hero_tag text-gray-300"> Let&apos;s Engineer Robots! </p>
            </div>

            <div className="w-full h-full absolute inset-0">
                <Canvas className="w-full h-full">
                    <Suspense fallback={<CanvasLoader />}>

                    <PerspectiveCamera makeDefault position={[0, 0, 30]} />
                    <HeroCamera isMobile={isMobile}>
                    <RobotMain
                        position={sizes.robotPosition}
                        scale={sizes.robotScale}
                        rotation={[0, 120, 0]}
                    />
                    </HeroCamera>
                        <group>
                            <Battery position={sizes.batteryPosition} scale={sizes.batteryScale} />
                            <Glados position={sizes.potatoPosition} scale={sizes.potatoScale}/>
                            <RobotArm position={sizes.armPosition} scale={sizes.armScale} />
                            <Rubiks position={sizes.rubikPosition} scale={sizes.rubikScale} />
                        </group>
                        <ambientLight intensity={1.2} />
                        <directionalLight
                            position={[10, 10, 10]}
                            intensity={2.4}
                            castShadow
                            shadow-mapSize-width={1024}
                            shadow-mapSize-height={1024}
                        />
                        <spotLight
                        position={[-0.65, 5.5, 1]}
                            angle={10}
                            prenumbra={1}
                            intensity={10}
                            castShadow
                            shadow-mapSize-width={1024}
                            shadow-mapSize-height={1024}
                        />
                    </Suspense>
                </Canvas>
            </div>

            <div className="absolute bottom-2 left-0 right-0 w-full z-10 c-space">
                <a href="#contact" className="w-fit">
                    <Button name="Let's work together" isBeam containerClass="sm:w-fit w-full sm:min-w-96"/>
                </a>
            </div>
        </section>
    )
}
export default Hero
