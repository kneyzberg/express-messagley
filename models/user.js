"use strict";

/** User of the site. */

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const {BCRYPT_WORK_FACTOR, SECRET_KEY} = require("../config");
const db = require("../db");
const {NotFoundError} = require("../expressError");

class User {

  /** Register new user. Returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({ username, password, first_name, last_name, phone }) {
    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
    const result = await db.query(`INSERT into users(username, password, first_name, last_name, phone, join_at, last_login_at)
                                      VALUES($1, $2, $3, $4, $5, current_timestamp, current_timestamp)
                                      RETURNING username, password, first_name, last_name, phone`,
                                      [username, hashedPassword, first_name, last_name, phone]);
    return result.rows[0];
  }

  /** Authenticate: is username/password valid? Returns boolean. */

  static async authenticate(username, password) {
    const result = await db.query(`SELECT password
                                      FROM users
                                      WHERE username = $1`,
                                  [username]);
    let results = result.rows[0];
    if(results){
      let authenticatePassword = await bcrypt.compare(password, results.password);
      if(authenticatePassword){
        await User.updateLoginTimestamp(username);
        return true;
      }
      return false;
    }
    throw new NotFoundError("That username does not exist");
  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {

    const result = await db.query(`UPDATE users
                                    SET last_login_at = current_timestamp
                                    WHERE username = $1
                                    RETURNING username`,
                                  [username]);
    let updatedUsername = result.rows[0];
    if(!updatedUsername){
      throw new NotFoundError("That username does not exist");
    }
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name}, ...] */

  static async all() {
    const results = await db.query(`SELECT username, first_name, last_name
                               FROM users
                               ORDER by username`);

    return results.rows;
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) {
    const result = await db.query(`SELECT username, first_name, last_name, phone,
                                    join_at, last_login_at
                                      FROM users
                                      WHERE username = $1`,
                                    [username]);
    let resultToCheck = result.rows[0];
    if(!resultToCheck){
      throw new NotFoundError("That username does not exist");
    }
    return resultToCheck;
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {

    const results = await db.query(`SELECT m.id, 
                            m.to_username, 
                            m.sent_at, 
                            m.body,
                            m.read_at,
                            users.username,
                            users.first_name,
                            users.last_name,
                            users.phone
                    FROM messages as m 
                    JOIN users ON m.to_username = users.username
                    WHERE from_username = $1`,
                    [username]);

    return results.rows.map(message => ({
        id: message.id,
        to_user: {
          username: message.username,
          first_name: message.first_name,
          last_name: message.last_name,
          phone: message.phone
        },
        body: message.body,
        sent_at: message.sent_at,
        read_at: message.read_at
      }));
  }

                    

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {id, first_name, last_name, phone}
   */

  static async messagesTo(username) {
    
      const results = await db.query(`SELECT m.id, 
                                      m.from_username, 
                                      m.sent_at, 
                                      m.body,
                                      m.read_at,
                                      users.username,
                                      users.first_name,
                                      users.last_name,
                                      users.phone
                                      FROM messages as m 
                                      JOIN users ON m.from_username = users.username
                                      WHERE to_username = $1`,
                                      [username]);

      return results.rows.map( message =>({
        id: message.id,
        from_user: {
          username: message.username,
          first_name: message.first_name,
          last_name: message.last_name,
          phone: message.phone
        },
        body: message.body,
        sent_at: message.sent_at,
        read_at: message.read_at
      }));
  }
}

module.exports = User;
