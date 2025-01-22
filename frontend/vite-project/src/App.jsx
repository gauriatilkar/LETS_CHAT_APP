import React from 'react';
import "./App.css";
import Homepage from "./Pages/Homepage";
import Chatpage from "./Pages/Chatpage";
import { Route, Routes } from "react-router-dom"; 

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Homepage />} /> 
        <Route path="/chats" element={<Chatpage />} /> 
      </Routes>
    </div>
  );
}

export default App;
