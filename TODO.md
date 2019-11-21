# TODO

- [ ] Development Environment

  - [x] Typescript
    - [x] tsconfig.json
  - [x] ESLint
    - [x] airbnb style guide
  - [x] Prettier
    - [x] should play nice with ESLint
  - [x] Testing
    - [x] Jest
    - [x] Supertest
  - [x] Husky && lint-staging
    - [x] should pass testing and linting

- [ ] Setup

  - [ ] Express
  - [ ] TypeORM

- [ ] Models

  - [ ] Workspace
    - belongs to User (as owner)
    - has many Members (User)
  - [ ] User
    - has many Workspaces
  - [ ] Channel
    - belongs to a Workspace
    - has many Messages
  - [ ] Message
    - belongs to a Channel
    - belongs to a User

- [ ] Controllers

  - [ ] Authentication

    - [ ] /auth/register POST
      - endpoint to create a user and store in the db.
    - [ ] /auth/login POST
      - endpoint to search the db and return the user that matches username/password4

  - [ ] Workspaces

    - [ ] /workspaces POST
      - create a new Workspace
    - [ ] /workspaces/:id PUT
      - update a Workspace

  - [ ] Channels

    - [ ] /channels POST

      - create a channel

    - [ ] /channels PUT
      - edit a channel

  - [ ] Messages

    - [ ] /messages POST

      - create a new message

    - [ ] /messages/:id PUT

      - update a message

    - [ ] /messages/:id DELETE
      - delete a message
