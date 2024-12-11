// Import dependencies
import React, { useRef, useState, useEffect, useCallback } from "react";
import * as tf from "@tensorflow/tfjs"; // Import TensorFlow.js
import * as cocossd from "@tensorflow-models/coco-ssd";
import Webcam from "react-webcam";
import "./ObjectDetection.scss";
import { drawRect } from "../utilities/detection"; // Ensure this utility is correctly implemented
import { useSpeechSynthesis } from "react-speech-kit";

const ObjectDetection = () => {
    const webcamRef = useRef(null);
    const canvasRef = useRef(null);
    const { speak, speaking, cancel } = useSpeechSynthesis();
    const [loading, setLoading] = useState(true);
    const [net, setNet] = useState(null);

    // Load the COCO-SSD model
    const runCoco = useCallback(async () => {
        try {
            await tf.setBackend('webgl'); // Set the backend to WebGL
            console.log("Backend set:", tf.getBackend()); // Log current backend
            const loadedNet = await cocossd.load();
            console.log("Model loaded.");
            setNet(loadedNet);
            detect(loadedNet); // Start detection immediately after loading
        } catch (error) {
            console.error("Error loading model:", error);
        }
    }, []);

    // Detect objects in the video stream
    const detect = useCallback(async (net) => {
        if (
            webcamRef.current &&
            webcamRef.current.video.readyState === 4
        ) {
            setLoading(false);
            const video = webcamRef.current.video;
            const videoWidth = video.videoWidth;
            const videoHeight = video.videoHeight;

            // Set video and canvas dimensions
            webcamRef.current.video.width = videoWidth;
            webcamRef.current.video.height = videoHeight;
            canvasRef.current.width = videoWidth;
            canvasRef.current.height = videoHeight;

            try {
                // Detect objects in the video frame
                const obj = await net.detect(video);
                console.log("Detected objects:", obj); // Log detected objects for debugging
                const ctx = canvasRef.current.getContext("2d");
                drawRect(obj, ctx, speak, speaking, cancel); // Make sure drawRect is implemented correctly
            } catch (detectError) {
                console.error("Error during detection:", detectError);
            }
        }
    }, [speak, speaking, cancel]);

    useEffect(() => {
        runCoco(); // Load the model when component mounts

        // Set an interval for detection
        const intervalId = setInterval(() => {
            if (net) {
                detect(net);
            }
        }, 20); // Adjusted interval for better performance

        return () => clearInterval(intervalId); // Cleanup on unmount
    }, [runCoco, detect, net]);

    return (
        <div className="ObjectDetection">
            <div className="webcam-div">
                <Webcam
                    ref={webcamRef}
                    muted={true}
                    style={{
                        position: "absolute",
                        marginLeft: "auto",
                        marginRight: "auto",
                        left: 0,
                        right: 0,
                        textAlign: "center",
                        zIndex: 9,
                        width: 640,
                        height: 480,
                    }}
                />
                <canvas
                    ref={canvasRef}
                    style={{
                        position: "absolute",
                        marginLeft: "auto",
                        marginRight: "auto",
                        left: 0,
                        right: 0,
                        textAlign: "center",
                        zIndex: 8,
                        width: 640,
                        height: 480,
                    }}
                />
            </div>
            {loading && <h3>Loading...</h3>}
        </div>
    );
}

export default ObjectDetection;