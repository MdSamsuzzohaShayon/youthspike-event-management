import { gql } from "@apollo/client";

// Mutations
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

const DELETE_A_GROUP = gql`
mutation DeleteGroup($groupId: String) {
  deleteGroup(groupId: $groupId) {
    code
    message
    success
  }
}
`;


// Queries
const GET_EVENT_WITH_GROUP_RAW = `
  query GetEvent($eventId: String!) {
    getEvent(eventId: $eventId) {
      code
      success
      message
      data {
        _id
        divisions
        name
        location
        startDate
        endDate
        teams {
            _id
            name
            division
            group{
              _id
              name
            }
        }
        groups{
            _id
            name
        }
      }
    }
  }
`;
const GET_EVENT_WITH_GROUP = gql`${GET_EVENT_WITH_GROUP_RAW}`;


const GET_GROUPS_RAW = `
query GetEvent($eventId: String!) {
  getEvent(eventId: $eventId) {
    code
    message
    success
    data {
      _id
      name
      logo
      startDate
      endDate
      active
      autoAssign
      autoAssignLogic
      coachPassword
      divisions
      groups {
        _id
        active
        division
        rule
        name
        teams {
          _id
          name
        }
      }
    }
  }
}
`;
const GET_GROUPS = gql`${GET_GROUPS_RAW}`;


const GET_A_GROUP = gql`
query GetGroup($groupId: String!) {
  getGroup(groupId: $groupId) {
    code
    message
    success
    data {
      _id
      active
      division
      name
      rule
      teams {
        _id
        name
        division
      }
      event {
        _id
        divisions
        startDate
        endDate
        location
        description
      }
    }
  }
}
`;

export { GET_EVENT_WITH_GROUP, ADD_GROUP, UPDATE_GROUP, GET_GROUPS, GET_A_GROUP, DELETE_A_GROUP, GET_EVENT_WITH_GROUP_RAW, GET_GROUPS_RAW };