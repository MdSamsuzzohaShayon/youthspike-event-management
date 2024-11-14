import { gql } from "@apollo/client";


const ADD_GROUP = gql`
mutation CreateGroup($input: CreateGroupInput!) {
  createGroup(input: $input) {
    code
    message
    success
    data {
      _id
      active
      name
      division
    }
  }
}
`;

const UPDATE_GROUP = gql`
mutation UpdateGroup($updateInput: UpdateGroupInput!, $eventId: String) {
  updateGroup(updateInput: $updateInput, eventId: $eventId) {
    code
    message
    success
    data {
      _id
      active
    }
  }
}
`;

const GET_EVENT_WITH_GROUP = gql`
  query GetEvent($eventId: String!) {
    getEvent(eventId: $eventId) {
      code
      success
      message
      data {
        _id
        divisions
        name
        teams {
            _id
            name
            division
        }
        groups{
            _id
            name
        }
      }
    }
  }
`;

export { GET_EVENT_WITH_GROUP, ADD_GROUP, UPDATE_GROUP };