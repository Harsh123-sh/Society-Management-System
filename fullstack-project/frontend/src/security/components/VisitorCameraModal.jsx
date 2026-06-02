import { useEffect, useRef, useState } from "react";

function VisitorCameraModal({ onCapture, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [capturedPhoto, setCapturedPhoto] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  function stopStream() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }

  useEffect(() => {
    let isActive = true;

    async function startCamera() {
      try {
        if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
          throw new Error("Camera is not supported in this browser.");
        }

        const isLocalhost =
          window.location.hostname === "localhost" ||
          window.location.hostname === "127.0.0.1" ||
          window.location.hostname === "::1";

        if (!window.isSecureContext && !isLocalhost) {
          throw new Error("Camera access requires HTTPS or localhost.");
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });

        if (!isActive) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
      } catch (cameraError) {
        if (isActive) {
          setError(cameraError?.message || "Unable to access camera. Please check permissions.");
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    startCamera();

    return () => {
      isActive = false;
      stopStream();
    };
  }, []);

  function handleCapturePhoto() {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || video.readyState < 2) {
      setError("Camera is not ready yet. Please wait a moment and try again.");
      return;
    }

    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const context = canvas.getContext("2d");
    if (!context) {
      setError("Unable to capture photo from camera.");
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageSrc = canvas.toDataURL("image/jpeg", 0.8);

    setCapturedPhoto(imageSrc);
    setError("");

    onCapture?.({
      imageSrc,
      confidence: 1,
      isFaceValid: true,
    });
  }

  function handleRetake() {
    setCapturedPhoto("");
    setError("");
    onCapture?.({ imageSrc: "", confidence: 0, isFaceValid: false });
  }

  async function handleSavePhoto() {
    if (!capturedPhoto) {
      setError("Please capture a photo first.");
      return;
    }

    setIsSaving(true);
    stopStream();
    try {
      onClose?.();
    } finally {
      setIsSaving(false);
    }
  }

  function handleClose() {
    stopStream();
    onClose?.();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Capture Visitor Face</h3>
            <p className="mt-1 text-sm text-slate-600">Use the live browser camera, then capture and save the photo.</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-full border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Close
          </button>
        </div>

        <div className="grid gap-4 px-5 py-5 lg:grid-cols-[1.3fr_0.9fr]">
          <div className="space-y-3">
            {error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                {error}
              </div>
            ) : null}

            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-950">
              <div className="relative aspect-[4/3] w-full bg-slate-900">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`h-full w-full object-cover ${capturedPhoto ? "opacity-0" : "opacity-100"}`}
                />
                {capturedPhoto ? (
                  <img
                    src={capturedPhoto}
                    alt="Captured visitor"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : null}
                {loading ? (
                  <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-200">
                    Initializing camera...
                  </div>
                ) : null}
                <canvas ref={canvasRef} className="hidden" />
              </div>
            </div>

            <p className="text-xs text-slate-500">
              Camera works on HTTPS or localhost. If permission was blocked, allow camera access in the browser and try again.
            </p>
          </div>

          <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Capture State</p>
              <p className="mt-2 text-sm text-slate-700">
                {capturedPhoto ? "Photo captured and ready to save." : "Live camera preview is active."}
              </p>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={handleCapturePhoto}
                disabled={loading || Boolean(error) || isSaving || !streamRef.current}
                className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                Capture Photo
              </button>

              <button
                type="button"
                onClick={handleRetake}
                disabled={!capturedPhoto || isSaving}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Retake
              </button>

              <button
                type="button"
                onClick={handleSavePhoto}
                disabled={!capturedPhoto || isSaving}
                className="w-full rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save Photo"}
              </button>

              <button
                type="button"
                onClick={handleClose}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Close
              </button>
            </div>

            {capturedPhoto ? (
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <img src={capturedPhoto} alt="Captured preview" className="h-44 w-full object-cover" />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export default VisitorCameraModal;