/*
Auto-generated by: https://github.com/pmndrs/gltfjsx
Author: Heinrich (https://sketchfab.com/Gevalt)
License: CC-BY-4.0 (http://creativecommons.org/licenses/by/4.0/)
Source: https://sketchfab.com/3d-models/kuma-heavy-robot-r-9000s-8b77bdbe705f4e9697790fd404da49a9
Title: KUMA Heavy Robot R-9000S
*/

import { useMemo, useEffect } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'

const RobotArm = (props) => {
    // 1) Load the .glb model + its animations
    const { scene, animations } = useGLTF('models/robot-arm.glb')

    // 2) Create an AnimationMixer for the loaded scene
    const mixer = useMemo(() => new THREE.AnimationMixer(scene), [scene])

    // 3) When animations change, play the first clip (named "Track" in your logs)
    useEffect(() => {
        console.log('Available animations:', animations)
        if (!animations.length) return
        // `animations[0]` should be the "Track" clip
        const action = mixer.clipAction(animations[0])
        action.play()
    }, [animations, mixer])

    // 4) On each frame, update the mixer so the animation runs
    useFrame((_, delta) => {
        mixer.update(delta)
    })

    // 5) Render the scene, wrapped in a <group> so we can position/scale it
    return (
        <group
            // Adjust position, rotation, or scale as needed
            rotation={[Math.PI, 1, Math.PI]}
            scale={0.0025}
            dispose={null}
            {...props}
        >
            {/* The entire model is a single scene object */}
            <primitive object={scene} />
        </group>
    )
}

// Preload the .glb so it’s cached
useGLTF.preload('models/robot-arm.glb')

export default RobotArm
