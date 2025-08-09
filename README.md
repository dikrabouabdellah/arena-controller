# Resolume Arena Controller React App

This project is a React-based application designed to control Resolume Arena clips remotely using its API and a voting system allowing multiple devices input. The app works on both desktop and mobile devices, altough it was originally made for main screen on pc and voting on phone. Users can control Resolume Arena from their devivce while connected to the same local network as the computer running Resolume Arena.

## Features

- **Remote Control**: Manage Resolume Arena clips from a phone or other devices.
- **Voting system**: multiple devices can vote for the next choice, the most voted choice is then picked.
- **Layer-Specific Clip Selection**: Dynamically fetch clips for specific layers in a composition.
- **Dynamic Layer Switching**: Automatically switch between layers after selecting a clip.
- **Time based selection**: Enter the length of the clip before giving the next choices.

## Prerequisites

Before using this application, ensure the following requirements are met:

- **Resolume Arena**:

  - Ensure the Resolume Arena API is enabled:
    1. Open Resolume Arena.
    2. Navigate to `Preferences > Webserver`.
    3. Enable webserver & REST API.
  - Note the Resolume API address (e.g., `http://192.168.1.100:8080`).

- **React Development Environment**:

  - Node.js installed on your system.
  - Basic understanding of React and JavaScript.

- **Network Configuration**:
  - Both the device running the app, the PC running Resolume Arena and the voting devices must be on the same local network.
  - Configure your PC's firewall to allow traffic on Resolume's API port (default: 8080).

## Installation

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` file in the root directory and set the `REACT_APP_API_BASE_URL` to your Resolume Arena API base URL:

   ```env
   REACT_APP_API_BASE_URL=http://192.168.1.100:8080
   ```

3. Add two other links in the `.env` file with the same base and just the ports changing:

   ```env
   REACT_APP_LOCAL_IP=http://192.168.1.100:3000
   REACT_APP_BACKEND_URL=http://192.168.1.100:4000
   ```

4. Start the backend server:

   ```bash
   cd backend
   node server.js
   ```

5. Start the development server in another terminal:

   ```bash
   npm start
   ```

6. Open the app in your browser:

   - On your pc visit the link (e.g., `http://192.168.1.100:3000` or `http://localhost:3000/arena-controller`).

7. Enter the session:

   - To enter with your phone scan the QR-code on the pc.
   - To enter with your pc copy the link and add `/vote/(session ID on the pc)`

8. Start the session:

   - Click on the button Start Voting on the pc and switch the screen to Resolume Arena to see the animation.

## Acknowledgments

- [Resolume Arena API Documentation](https://resolume.com/support/en/api)
- [Create React App](https://create-react-app.dev/docs/getting-started/)
- [Adding fonts with @font-face]{https://www.w3schools.com/cssref/atrule_font-face.php}
- [ChatGPT](https://chatgpt.com/share/67d7e270-54a4-800e-8757-e80cbb1220d1)
- [ChatGPT](https://chatgpt.com/share/67d7e29c-590c-800e-9b6b-a9ffc05f87d6)
- [ChatGPT](https://chatgpt.com/share/689751b3-32c0-800e-9597-5f57a13ef4a8)
- [ChatGPT](https://chatgpt.com/share/67d7e2d3-7d1c-800e-ba6e-72562f72da3b)
- [Deepseek](https://chat.deepseek.com/a/chat/s/ee1ef30c-ab67-40a6-bb8e-983168057044)
