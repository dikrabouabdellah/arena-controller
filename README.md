# Resolume Arena Controller React App

This project is a React-based application designed to control Resolume Arena clips remotely using its API. The app works on both desktop and mobile devices, altough it was originally made for tablet. Users can control Resolume Arena from their devivce while connected to the same local network as the computer running Resolume Arena.

## Features

- **Remote Control**: Manage Resolume Arena clips from a phone or other devices.
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
  - Both the device running the app and the PC running Resolume Arena must be on the same local network.
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

3. Start the development server:

   ```bash
   npm start
   ```

4. Open the app in your browser:
   - On your phone and pc visit the link with your IP address (e.g., `http://192.168.1.100:3000`).

## Usage

1. Open Resolume Arena
2. Open the app on your browser or phone.
3. Select clips by clicking on the buttons corresponding to each clip.
4. The app will automatically switch to the next layer after selecting a clip.

## Acknowledgments

- [Resolume Arena API Documentation](https://resolume.com/support/en/api)
- [Create React App](https://create-react-app.dev/docs/getting-started/)
- [Adding fonts with @font-face]{https://www.w3schools.com/cssref/atrule_font-face.php}
- [ChatGPT](https://chatgpt.com/share/67d7e270-54a4-800e-8757-e80cbb1220d1)
- [ChatGPT](https://chatgpt.com/share/67d7e29c-590c-800e-9b6b-a9ffc05f87d6)
- [ChatGPT](https://chatgpt.com/share/67d7e2d3-7d1c-800e-ba6e-72562f72da3b)
- [Deepseek](https://chat.deepseek.com/a/chat/s/ee1ef30c-ab67-40a6-bb8e-983168057044)
