import React, { useRef, useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io(import.meta.env.BACKEND_URL || "http://localhost:3000", {
  transports: ["websocket"],
  withCredentials: true,
});

const App: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaSourceRef = useRef<MediaSource | null>(null);
  const sourceBufferRef = useRef<SourceBuffer | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [streamId, setStreamId] = useState("");
  const [activeStreams, setActiveStreams] = useState<string[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    socket.on("connect", () => {
      console.log("Connected to WebSocket server");
    });

    socket.on("activeStreams", (streams: string[]) => {
      setActiveStreams(streams);
      console.log("Active streams:", streams);
    });

    socket.on("streamData", (data) => {
      if (data.streamId === streamId && sourceBufferRef.current) {
        const chunk = new Uint8Array(data.chunk);
        console.log(
          `Appending buffer for streamId: ${data.streamId}, chunk size: ${chunk.byteLength}`
        );

        if (sourceBufferRef.current.updating) {
          sourceBufferRef.current.addEventListener(
            "updateend",
            () => {
              appendBuffer(chunk);
            },
            { once: true }
          );
        } else {
          appendBuffer(chunk);
        }
      }
    });

    socket.on("streamStopped", (data) => {
      if (data.streamId === streamId) {
        if (sourceBufferRef.current) {
          sourceBufferRef.current.remove(
            0,
            sourceBufferRef.current.buffered.end(0)
          );
        }
        console.log(`Stream stopped for: ${data.streamId}`);
      }
    });

    socket.on("streamError", (error) => {
      console.error(`Stream error: ${error.message}`);
    });

    return () => {
      socket.off("connect");
      socket.off("activeStreams");
      socket.off("streamData");
      socket.off("streamStopped");
      socket.off("streamError");
    };
  }, [streamId]);

  const appendBuffer = (chunk: Uint8Array) => {
    if (sourceBufferRef.current && !sourceBufferRef.current.updating) {
      try {
        sourceBufferRef.current.appendBuffer(chunk);
      } catch (e) {
        console.error(`Error appending buffer: ${e}`);
      }
    } else {
      console.log("SourceBuffer is still updating");
    }
  };

  const startStreaming = () => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        socket.emit("startStream", { streamId });

        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'video/webm; codecs="vp8, opus"',
        });

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            socket.emit("streamChunk", { streamId, chunk: event.data });
          }
        };

        mediaRecorder.start(1000); // Send data every second
        mediaRecorderRef.current = mediaRecorder;
        streamRef.current = stream;
        setStreaming(true);
        console.log(`Started streaming with ID: ${streamId}`);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch((error) => console.error(`Error starting stream: ${error}`));
  };

  const stopStreaming = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    socket.emit("stopStream", { streamId });
    setStreaming(false);
    console.log(`Stopped streaming with ID: ${streamId}`);
  };

  const viewStream = (id: string) => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.src = "";
    }

    const mediaSource = new MediaSource();
    mediaSourceRef.current = mediaSource;

    mediaSource.addEventListener("sourceopen", () => {
      const mime = 'video/webm; codecs="vp8, opus"';
      if (MediaSource.isTypeSupported(mime)) {
        const sourceBuffer = mediaSource.addSourceBuffer(mime);
        sourceBufferRef.current = sourceBuffer;

        sourceBuffer.addEventListener("updateend", () => {
          if (mediaSource.readyState === "open" && !sourceBuffer.updating) {
            mediaSource.endOfStream();
          }
        });

        socket.emit("getStream", { streamId: id });
        console.log(`Requested stream with ID: ${id}`);
      } else {
        console.error(`MIME type or codec not supported: ${mime}`);
      }
    });

    if (videoRef.current) {
      videoRef.current.src = URL.createObjectURL(mediaSource);
      videoRef.current.play();
    }
  };

  return (
    <div style={{ display: "flex" }}>
      <div
        style={{ width: "20%", padding: "10px", borderRight: "1px solid #ccc" }}
      >
        <h3 className="font-bold">Active Streams</h3>
        <ul>
          {activeStreams.map((id) => (
            <li
              key={id}
              onClick={() => {
                setStreamId(id);
                viewStream(id);
              }}
              style={{ cursor: "pointer" }}
            >
              {id}
            </li>
          ))}
        </ul>
      </div>
      <div style={{ width: "80%", padding: "10px" }} className="p-10">
        <video ref={videoRef} autoPlay controls className="m-4"></video>
        <div>
          <input
            type="text"
            value={streamId}
            onChange={(e) => setStreamId(e.target.value)}
            placeholder="Stream ID"
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-[80%] p-2 m-2"
          />
          <button onClick={startStreaming} disabled={streaming}>
            Start Streaming
          </button>
          <button onClick={stopStreaming} disabled={!streaming}>
            Stop Streaming
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;
