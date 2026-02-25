import { gql } from "@apollo/client";

// Query to fetch template
export const GET_TEMPLATES_RAW = `
query GetTemplates($eventId: String!) {
    getTemplates(eventId: $eventId) {
      code
      success
      message
      data {
        _id
        name
        type
        subject
        body
        images
        placeholders
        event {
          _id
          name
        }
      }
    }
  }
`
export const GET_TEMPLATES = gql`${GET_TEMPLATES_RAW}`;

// Mutation to save template
export const SAVE_TEMPLATE_RAW = `
  mutation CreateTemplate($input: CreateTemplateInput!){
  createTemplate(input: $input){
    code
    success
    message
    data{
      _id
      name
      type
      subject
      body
      images
      placeholders
      event{
        _id
        name
      }
    }
  }
}
`;

export const SAVE_TEMPLATE = gql`${SAVE_TEMPLATE_RAW}`;

// Mutation to save version
export const SAVE_VERSION = `
  mutation SaveVersion($input: VersionInput!) {
    saveVersion(input: $input) {
      versionId
      templateId
      subject
      body
      label
    }
  }
`;

// Query to get version history
export const GET_VERSION_HISTORY = `
  query GetVersionHistory($templateId: ID!) {
    versionHistory(templateId: $templateId) {
      versionId
      templateId
      subject
      body
      label
      metadata {
        name
        placeholders {
          key
          label
          sampleValue
        }
      }
    }
  }
`;