import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { Route, Switch } from "react-router-dom";
import LoginFormPage from "./components/LoginFormPage";
import SignupFormPage from "./components/SignupFormPage";
import * as sessionActions from "./store/session";
import Navigation from "./components/Navigation";
import { GroupList } from "./components/GroupList";
import { EventList } from "./components/EventList";
import MainPageNav from "./components/MainPageNav";
import { GroupDetails } from "./components/GroupDetails";
import EventDetails from "./components/EventDetails";

function App() {
  const dispatch = useDispatch();
  const [isLoaded, setIsLoaded] = useState(false);
  useEffect(() => {
    dispatch(sessionActions.restoreUser()).then(() => setIsLoaded(true));
  }, [dispatch]);

  return (
    <>
      <Navigation isLoaded={isLoaded} />
      <MainPageNav/>
      {isLoaded && (
        <Switch>
          <Route path="/login">
            <LoginFormPage />
          </Route>
          <Route path="/signup">
            <SignupFormPage />
          </Route>
          <Route path="/groups" exact>
            <GroupList />
          </Route>
          <Route path="/events" exact>
            <EventList />
          </Route>
          <Route path="/groups/:groupId">
            <GroupDetails />
          </Route>
          <Route path="/events/:eventId">
            <EventDetails />
          </Route>
        </Switch>
      )}
    </>
  );
}

export default App;

