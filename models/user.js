"use strict";

/** User of the site. */

const bcrpyt = require("bcrypt");
const jwt = require("jsonwebtoken");
const {BCRYPT_WORK_FACTOR, SECRET_KEY} = require("../config");
const db = require("../db");
const {NotFoundError} = require("../expressError");

class User {

  /** Register new user. Returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({ username, password, first_name, last_name, phone }) {
    const hashedPassword = await bcrpyt.hash(password, BCRYPT_WORK_FACTOR);
    const result = await db.query(`INSERT into users(username, password, first_name, last_name, phone, join_at)
                                      VALUES($1, $2, $3, $4, $5, current_timestamp)
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
      return await bcrpyt.compare(password, results.password);
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
    return result.rows[0];
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {
    const messageResults = await db.query(`SELECT id, to_username as to_user, body, sent_at, read_at
                                            FROM messages
                                            WHERE to_username = $1`,
                                          [username]);
    const userResults = await db.query(`SELECT username, first_name, last_name, phone
                                          FROM users
                                          WHERE username = $1`,
                                          [username]);

    messageResults.rows.map(msg => to_user => msg.to_user = userResults.rows[0]);
    return messages;
  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {id, first_name, last_name, phone}
   */

  static async messagesTo(username) {
    const messageResults = await db.query(`SELECT id, from_username as from_user, body, sent_at, read_at
                                            FROM messages
                                            WHERE from_username = $1`,
                                          [username]);
    const userResults = await db.query(`SELECT username, first_name, last_name, phone
                                          FROM users
                                          WHERE username = $1`,
                                          [username]);
    let messages = messageResults.rows.map(msg => msg.from_user = userResults.rows[0]);
    return messages;
  }
}


module.exports = User;
