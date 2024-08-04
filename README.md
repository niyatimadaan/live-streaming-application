# Live Streaming Application

This project demonstrates a live streaming application using React on the frontend and NestJS with Socket.IO on the backend. The application allows users to start and stop live streams, and view active streams.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Running the Application](#running-the-application)
4. [API Usage](#api-usage)
5. [Directory Structure](#directory-structure)

## Prerequisites

Before you begin, ensure you have the following installed on your machine:

- Node.js (v14.x or later) and npm (v6.x or later)
  - Download and install from [Node.js official site](https://nodejs.org/).
- NestJS CLI (for backend setup)
  - Install via npm: `npm install -g @nestjs/cli`
- React (v17.x or later)
- A modern web browser (Chrome, Firefox, Edge, etc.)

## Installation

### Backend Setup

1. Clone the repository:
    ```bash
    git clone <repository-url>
    cd <repository-folder>/backend
    ```

2. Install the dependencies:
    ```bash
    npm install
    ```

3. Start the NestJS server:
    ```bash
    npm run start
    ```

The server will start on `http://localhost:3000`.

### Frontend Setup

1. Navigate to the frontend directory:
    ```bash
    cd ../live-stream-client
    ```

2. Install the dependencies:
    ```bash
    npm install
    ```

3. Start the React application:
    ```bash
    npm run dev
    ```

The React app will start on `http://localhost:5173`.

## Running the Application

To run the application, follow these steps:

1. Ensure the backend server is running by executing `npm run start` in the backend directory.
2. Ensure the frontend application is running by executing `npm start` in the frontend directory.
3. Open your web browser and navigate to `http://localhost:5173`.

### Start Streaming

1. Enter a unique stream ID in the "Stream ID" input field.
2. Click the "Start Streaming" button to start broadcasting your stream.

### Stop Streaming

1. Click the "Stop Streaming" button to stop broadcasting.

### View Active Streams

1. On the left panel, you will see a list of active streams.
2. Click on any stream ID to start viewing that stream.

## API Usage

### Backend API (Socket.IO Events)

#### `startStream`

- **Description**: Starts a new stream with the given stream ID.
- **Payload**: `{ streamId: string }`
- **Example**:
  ```javascript
  socket.emit('startStream', { streamId: 'my-stream-id' });
  ```

#### `streamChunk`

- **Description**: Sends a chunk of stream data to the server.
- **Payload**: `{ streamId: string, chunk: Blob }`
- **Example**:
  ```javascript
  socket.emit('streamChunk', { streamId: 'my-stream-id', chunk: blobData });
  ```

#### `stopStream`

- **Description**: Stops the stream with the given stream ID.
- **Payload**: `{ streamId: string }`
- **Example**:
  ```javascript
  socket.emit('stopStream', { streamId: 'my-stream-id' });
  ```

#### `getStream`

- **Description**: Requests the server to send the stream data for a given stream ID.
- **Payload**: `{ streamId: string }`
- **Example**:
  ```javascript
  socket.emit('getStream', { streamId: 'my-stream-id' });
  ```

### Frontend Components

#### `startStreaming`

- **Description**: Starts streaming video and audio from the user's device.
- **Example**:
  ```javascript
  startStreaming();
  ```

#### `stopStreaming`

- **Description**: Stops streaming video and audio from the user's device.
- **Example**:
  ```javascript
  stopStreaming();
  ```

#### `viewStream`

- **Description**: Requests and views a stream by its ID.
- **Example**:
  ```javascript
  viewStream('my-stream-id');
  ```

## Directory Structure

```
├── backend
│   ├── src
│   │   ├── app.module.ts
│   │   ├── main.ts
│   │   └── live-stream
│   │       └──live-stream.gateway.ts
│   ├── package.json
│   └── tsconfig.json
└── live-stream-client
    ├── src
    │   ├── App.tsx
    │   ├── main.tsx
    │   └── ...
    ├── public
    ├── package.json
    └── tsconfig.json
```

## Troubleshooting

- If the video is not loading, check the browser's developer console for errors.
- Ensure that the backend server is running and accessible.
- Verify that the correct WebSocket events are being emitted and received.
- Check the Network tab in the browser's developer tools to ensure WebSocket frames are being sent and received correctly.

If you encounter any issues or have questions, feel free to open an issue on the repository or contact the maintainers.

---

Enjoy streaming!