const request = require("supertest");
const jwt = require("jsonwebtoken");

const app = require("../app");
const db = require("../db");
const User = require("../models/user");
const Message = require("../models/message")

const { SECRET_KEY } = require("../config");

describe("User Routes Test", function () {

  let testUserToken;

  beforeEach(async function () {
    await db.query("DELETE FROM messages");
    await db.query("DELETE FROM users");

    let user1 = await User.register({
      username:"test1",
      password:"password",
      first_name:"Test1",
      last_name:"Test1",
      phone:"2676547867"
    });

    let user2 = await User.register({
      username:"test2",
      password:"password2",
      first_name:"Test2",
      last_name:"Test2",
      phone:"2676544867"
    });

    let message1 = Message.create({
      from_username: "test1",
      to_username: "test2",
      body: "user1 messaging users2"
    });

    let message2 = Message.create({
      from_username: "test2",
      to_username: "test1",
      body: "user2 messaging users1"
    });

      let response = await request(app)
        .post("/auth/login")
        .send({ username: user1.username, password: "password" });
      
      testUserToken = response.body._token

      // testUserToken = jwt.sign({ username: "test1"}, SECRET_KEY);
  });
  //get all users
  test("get list of users", async function () {
    let response = await request(app)
      .get("/users")
      .send({_token: testUserToken})
  
    expect(response.body).toEqual({
      users: [
        {
          username:"test1",
          first_name:"Test1",
          last_name:"Test1",
        },
        {
          username:"test2",
          first_name:"Test2",
          last_name:"Test2",
        }
      ]
    });

    expect(response.statusCode).toEqual(200);
  });
  //get a specific user
  test("can get a user", async function () {
    let response = await request(app) 
      .get("/users/test1")
      .send({_token: testUserToken});
    
      expect(response.body).toEqual({
        user: {
          username:"test1",
          first_name:"Test1",
          last_name:"Test1",
          phone:"2676547867",
          join_at: expect.any(String),
          last_login_at: expect.any(String),
      }
    });
    expect(response.statusCode).toEqual(200);
  });
  //test for false user
  test("test for missing user", async function () {
    let response = await request(app)
        .get("/users/missing")
        .send({ _token: testUserToken });
      
    expect(response.statusCode).toEqual(401);
  });
  describe("GET /users:username/from", function () {
    test("can get list of all messages from current user", async function () {
      let response = await request(app)
          .get("/users/test1/from")
          .send({ _token: testUserToken });
      expect(response.body).toEqual({
        messages: [{
          id: expect.any(Number),
          body: "user1 messaging users2",
          sent_at: expect.any(String),
          read_at: null,
          to_user: {
            username:"test2",
            first_name:"Test2",
            last_name:"Test2",
            phone:"2676544867"
          }
        }]
      });
    });
  });
});