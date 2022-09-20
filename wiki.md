<h1>Link to API Documentation</h1>

https://github.com/klivecka/Meetup-Clone-Project/blob/5e7246dbe8a8cf5406824b445df9cc67ee2894b5/backend/backend-README.md


<h1>Redux State Shape</h1>

```
store = {
  session: {},
  groups: {
    allGroups: {
      [groupId]: {
        groupData,
      },
      optionalOrderedList: [],
    },
    singleGroup: {
      groupData,
      GroupImages: [imagesData],
      Organizer: {
        organizerData,
      },
      Venues: [venuesData],
    },
  },
  events: {
    allEvents: {
      [eventId]: {
        eventData,
        Group: {
          groupData,
        },
        Venue: {
          venueData,
        },
      },
    },
    ```
    
    // In this slice we have much more info about the event than in the allEvents slice.
    
    ```
    singleEvent: {
      eventData,
      Group: {
        groupData,
      },
      // Note that venue here will have more information than venue did in the all events slice. (Refer to your API Docs for more info)
      Venue: {
        venueData,
      },
      EventImages: [imagesData],
      // These would be extra features, not required for your first 2 CRUD features
      Members: [membersData],
      Attendees: [attendeeData],
    },
  },
};
```