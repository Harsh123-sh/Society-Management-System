import { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import Webcam from "react-webcam";

function CameraCapture({ onCapture, onClose }) {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [error, setError] = useState("");
  const [captureMessage, setCaptureMessage] = useState("");
  const [faceState, setFaceState] = useState({
    isDetected: false,
    isValid: false,
    confidence: 0,
  });

  const MIN_CONFIDENCE = 0.8;

  useEffect(() => {
    let isMounted = true;

    async function loadModels() {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(
            "https://justadudewhohacks.github.io/face-api.js/models"
          ),
          faceapi.nets.faceLandmark68TinyNet.loadFromUri(
            "https://justadudewhohacks.github.io/face-api.js/models"
          ),
        ]);

        if (isMounted) {
          setModelsLoaded(true);
        }
      } catch (modelError) {
        if (isMounted) {
          setError("Unable to load face detection models. Check internet connection.");
        }
      }
    }

    loadModels();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!cameraReady || !modelsLoaded || !webcamRef.current || !canvasRef.current) {
      return;
    }

    const intervalId = setInterval(async () => {
      const video = webcamRef.current?.video;
      const canvas = canvasRef.current;

      if (!video || !canvas || video.readyState !== 4) {
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const detections = await faceapi.detectSingleFace(
        video,
        new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 })
      );

      const context = canvas.getContext("2d");
      context.clearRect(0, 0, canvas.width, canvas.height);

      if (!detections) {
        setFaceState({ isDetected: false, isValid: false, confidence: 0 });
        return;
      }

      const box = detections.box;
      const confidence = Number(detections.score || 0);
      const frameCenterX = canvas.width / 2;
      const frameCenterY = canvas.height / 2;
      const boxCenterX = box.x + box.width / 2;
      const boxCenterY = box.y + box.height / 2;

      const xCenterRatio = Math.abs(boxCenterX - frameCenterX) / frameCenterX;
      const yCenterRatio = Math.abs(boxCenterY - frameCenterY) / frameCenterY;
      const isCentered = xCenterRatio < 0.25 && yCenterRatio < 0.25;
      const isValid = confidence >= MIN_CONFIDENCE && isCentered;

      context.lineWidth = 3;
      context.strokeStyle = isValid ? "#16a34a" : "#dc2626";
      context.strokeRect(box.x, box.y, box.width, box.height);

      setFaceState({
        isDetected: true,
        isValid,
        confidence,
      });
    }, 250);

    return () => clearInterval(intervalId);
  }, [cameraReady, modelsLoaded]);

  const handleCapture = () => {
    try {
      if (!faceState.isDetected || !faceState.isValid) {
        setError("Face is not clear and centered. Please adjust and try again.");
        return;
      }

      if (webcamRef.current) {
        const imageSrc = webcamRef.current.getScreenshot();
        if (imageSrc) {
          onCapture({
            imageSrc,
            confidence: faceState.confidence,
            isFaceValid: faceState.isValid,
          });

          if ("speechSynthesis" in window) {
            const utterance = new SpeechSynthesisUtterance("Face captured successfully");
            window.speechSynthesis.cancel();
            window.speechSynthesis.speak(utterance);
          }

          setCaptureMessage("Face captured successfully");
        }
      }
    } catch (err) {
      setError("Failed to capture photo. Please try again.");
      console.error("Camera capture error:", err);
    }
  };

  const handleUserMediaError = (error) => {
    console.error("Camera error:", error);
    setError("Unable to access camera. Please check permissions.");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">Capture Visitor Photo</h3>

        {error ? (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="mb-4 overflow-hidden rounded-lg bg-slate-100">
          <div className="relative">
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              onUserMedia={() => setCameraReady(true)}
              onUserMediaError={handleUserMediaError}
              videoConstraints={{
                width: { ideal: 1280 },
                height: { ideal: 720 },
                facingMode: "user",
              }}
              className="w-full"
            />
            <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" />
          </div>
        </div>

        <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
          <p>
            Detection: {faceState.isDetected ? "Face detected" : "No face detected"}
          </p>
          <p>
            Confidence: {faceState.confidence.toFixed(2)} (minimum {MIN_CONFIDENCE.toFixed(2)})
          </p>
          <p>
            Box status: {faceState.isValid ? "Green (clear and centered)" : "Red (unclear or off-center)"}
          </p>
          {captureMessage ? <p className="mt-1 font-semibold text-emerald-700">{captureMessage}</p> : null}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleCapture}
            disabled={!cameraReady || !modelsLoaded || !faceState.isDetected || !faceState.isValid}
            className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            Capture Photo
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>

        <p className="mt-3 text-xs text-slate-500">
          Keep face centered with good lighting. Capture is enabled only for high-confidence face detection.
        </p>
      </div>
    </div>
  );
}

export default CameraCapture;
