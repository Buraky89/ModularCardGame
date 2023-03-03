import React from 'react';
import './App.css';
import CardsList from "./CardsList";
import { FunctionComponent } from "react";
import { Route, Router, useRoute } from "wouter";


const CardsListWrapper: FunctionComponent = () => {
  const [match, params] = useRoute("/:uuid");

  if (match) {
    const uuid = params.uuid || "client1";
    return <CardsList uuid={uuid} />;
  }

  return <div>Invalid player uuid</div>;
};


const App: FunctionComponent = () => {
  return (
    <Router>
      <Route path="/:uuid">
        <CardsListWrapper />
      </Route>
    </Router>
  );
};

export default App;
