# TODO

- ## [x] Development Environment

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

- ## [ ] Setup

  - [x] Express

    - [x] ts-node
    - [x] nodemon
      - server restarts automatically after file changes.
    - [x] morgan
      - express logger
    - [x] helmet
      - helps to secure Express apps by setting various http headers.
    - [x] bcrypt
      - hash the password before inserting into the db.
    - [ ] @hapi/joi
      - entity validation
    - [ ] express-session
      - authentication using session + cookie.
    - [ ] redis/connect-redis
      - session store for scalability(learning).

  - [x] TypeORM
    - [x] installation
    - [x] create User model
    - [x] create Workspace model
    - [x] create Channel model
    - [s] create Message model

- ## [x] Models

  ### Entity Relationship Diagram

  ![](erd.png)

* ## [ ] Controllers

  - [ ] Authentication

    - [ ] /auth/register POST
      - endpoint to create a user and store in the db.
      - [ ] verify the user has sent the required object
        - must have password
        - must have username
        - must have email
      - [ ] check there is no user in the db with email/username passed in.
      - [x] hash password before inserting it to the db
      - [ ] endpoint should return
        - true if the user was successfully added
        - false if there was a problem
    - [ ] /auth/login POST
      - endpoint to search the db and return the user that matches email/password
      - [ ] check whether user exists in the db
        - [ ] user exits in the db
          - add session id in a cookie to the client
        - [ ] user doesn't exitst
          - send error message

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
