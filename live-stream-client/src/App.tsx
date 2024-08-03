import React, { useRef, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  transports: ['websocket'],
  withCredentials: true,
});

const App: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaSourceRef = useRef<MediaSource | null>(null);
  const sourceBufferRef = useRef<SourceBuffer | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [streamId, setStreamId] = useState('');
  let mediaRecorder: MediaRecorder | null = null;

  useEffect(() => {
    socket.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    socket.on('streamData', (data) => {
      if (data.streamId === streamId && sourceBufferRef.current) {
        const chunk = new Uint8Array(data.chunk);

        if (sourceBufferRef.current.updating) {
          // Wait until the buffer is no longer updating
          sourceBufferRef.current.addEventListener('updateend', () => {
            appendBuffer(chunk);
          }, { once: true });
        } else {
          appendBuffer(chunk);
        }
        console.log(`Received stream data for: ${data.streamId}`);
      }
    });

    socket.on('streamStopped', (data) => {
      if (data.streamId === streamId) {
        if (sourceBufferRef.current) {
          sourceBufferRef.current.remove(0, sourceBufferRef.current.buffered.end(0));
        }
        console.log(`Stream stopped for: ${data.streamId}`);
      }
    });

    socket.on('streamError', (error) => {
      console.error(`Stream error: ${error.message}`);
    });

    return () => {
      socket.off('connect');
      socket.off('streamData');
      socket.off('streamStopped');
      socket.off('streamError');
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
      console.log('SourceBuffer is still updating');
    }
  };

  const startStreaming = () => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        socket.emit('startStream', { streamId });

        mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm; codecs="vp8, opus"' });

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            socket.emit('streamChunk', { streamId, chunk: event.data });
          }
        };

        mediaRecorder.start(1000); // Send data every second
        setStreaming(true);
        console.log(`Started streaming with ID: ${streamId}`);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch(error => console.error(`Error starting stream: ${error}`));
  };

  const stopStreaming = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
    }
    socket.emit('stopStream', { streamId });
    setStreaming(false);
    console.log(`Stopped streaming with ID: ${streamId}`);
  };

  const viewStream = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.src = '';
    }

    const mediaSource = new MediaSource();
    mediaSourceRef.current = mediaSource;

    mediaSource.addEventListener('sourceopen', () => {
      const sourceBuffer = mediaSource.addSourceBuffer('video/webm; codecs="vp8, opus"');
      sourceBufferRef.current = sourceBuffer;

      sourceBuffer.addEventListener('updateend', () => {
        if (mediaSource.readyState === 'open' && !sourceBuffer.updating) {
          mediaSource.endOfStream();
        }
      });

      socket.emit('getStream', { streamId });
      console.log(`Requested stream with ID: ${streamId}`);
    });

    if (videoRef.current) {
      videoRef.current.src = URL.createObjectURL(mediaSource);
      videoRef.current.play();
    }
  };

  return (
    <div>
      <input type="text" value={streamId} onChange={(e) => setStreamId(e.target.value)} placeholder="Stream ID" />
      <video ref={videoRef} autoPlay controls></video>
      <button onClick={startStreaming} disabled={streaming}>Start Streaming</button>
      <button onClick={stopStreaming} disabled={!streaming}>Stop Streaming</button>
      <button onClick={viewStream}>View Stream</button>
    </div>
  );
};

export default App;