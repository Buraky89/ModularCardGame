import React from 'react';
import logo from './logo.svg';
import './App.css';
import CardsList from "./CardsList";

function App() {
  return (
    <div className="App">
      <div>
        <h1>Cards List</h1>
        <CardsList />
      </div>
    </div>
  );
}

export default App;
