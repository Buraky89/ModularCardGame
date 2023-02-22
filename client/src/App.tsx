import React from 'react';
import './App.css';
import CardsList from "./CardsList";
import { FunctionComponent } from "react";
import { Route, Router, useRoute } from "wouter";


const CardsListWrapper: FunctionComponent = () => {
  const [match, params] = useRoute("/:clientName");

  if (match) {
    const clientName = params.clientName || "client1";
    return <CardsList clientName={clientName} />;
  }

  return <div>Invalid client name</div>;
};


const App: FunctionComponent = () => {
  return (
    <Router>
      <Route path="/:clientName">
        <CardsListWrapper />
      </Route>
    </Router>
  );
};

export default App;
