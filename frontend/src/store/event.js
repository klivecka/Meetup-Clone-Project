import { csrfFetch } from "./csrf";

const LOAD_EVENTS = "events/loadEvents";
const ONE_EVENT = "events/oneEvent";
const ADD_EVENT = "events/addEvent";

const loadEvents = (events) => {
    return {
        type: LOAD_EVENTS,
        payload: events,
    };
};

const oneEvent = (event) => {
    return {
        type: ONE_EVENT,
        payload: event,
    };
};

const addEvent = (event) => {
    return {
        type: ADD_EVENT,
        payload: event,
    };
};

//FETCH ALL EVENTS THUNK
export const fetchEvents = () => async (dispatch) => {
    const response = await fetch("/api/events");
    const eventsObj = await response.json();

    // console.log('THIS IS THE EVENTS OBJ', eventsObj)
    const eventsArray = eventsObj.Events;
    dispatch(loadEvents(eventsArray));
};

//FETCH ONE EVENT THUNK
export const fetchOneEvent = (eventId) => async (dispatch) => {
    const response = await fetch(`/api/events/${eventId}`);
    const oneEventObj = await response.json();
    dispatch(oneEvent(oneEventObj));
};

//ADD EVENT THUNK
export const addOneEvent = (data) => async (dispatch) => {
    const {groupId, name, type, capacity, price, description, startDate, endDate } = data
    const venueId = 1;
    const req = {venueId, name, type, capacity, price, description, startDate, endDate }
    console.log('THIS IS THE THUKN EVENT REQ', req)
    const response = await csrfFetch(`/api/groups/${groupId}/events`,{
        method: "post",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(req),
    })
    const newEvent = await response.json()
    dispatch(addEvent(newEvent))
    return newEvent;
}

const initialState = {
    list: [],
};

const eventReducer = (state = initialState, action) => {
    let newState;
    switch (action.type) {
        case LOAD_EVENTS:
            const events = {};
            const eventList = action.payload;
            eventList.forEach((event) => {
                events[event.id] = event;
            });
            return {
                ...events,
                ...state,
                list: eventList,
            };
        case ONE_EVENT:
            newState = {
                ...state,
                [action.payload.id]: action.payload,
            };
            return newState;
        case ADD_EVENT:
            newState = {
                ...state,
            };
            newState.list.push(action.payload);
            return newState;
        default:
            return state;
    }
};

export default eventReducer;
