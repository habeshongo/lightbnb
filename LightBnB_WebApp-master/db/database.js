//const properties = require('./lightbnb');
const properties = require("./json/properties.json");
const users = require("./json/users.json");
const { Pool } = require('pg');

/* ************************************************* */
const db = new Pool({
  user: 'labber',
  password: 'labber',
  host: 'localhost',
  database: 'lightbnb',
  port: 5432,
});

db.connect((err) => {
  if (err) {
    console.error('Connection error', err.stack);
  } else {
    console.log('Connected to database');
  }
});

/* ************************************************* */


const pool = new Pool({
  user: 'labber',
  password: 'labber',
  host: 'localhost',
  database: 'lightbnb',
  port: 5432,
});


pool.connect((err) => {
  if (err) {
    console.error('Connection error', err.stack);
  } else {
    console.log('Connected to database');
  }
});

pool.query(`SELECT title FROM properties LIMIT 10;`).then(response => { console.log(response) })


/* ************************************************* */


const getUserWithEmail = function (email) {
  return pool
    .query(`SELECT * FROM users WHERE email = $1`, [email])
    .then((res) => {
      if (res.rows.length === 0) {
        return null;
      }
      return res.rows[0];
    })
    .catch((err) => console.log(err.message));
};


/* ******************************************************* */


const getUserWithId = function (id) {
  return pool
    .query(`SELECT * FROM users WHERE id = $1`, [id])
    .then((res) => {
      if (res.rows.length === 0) {
        return null;
      }
      return res.rows[0];
    })
    .catch((err) => console.log(err.message));
};


/* ******************************************************* */

const addUser = function (user) {
  const { name, email, password } = user;
  return pool
    .query(
      `INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *;`,
      [name, email, password]
    )
    .then((res) => res.rows[0])
    .catch((err) => console.log(err.message));
};


/* ******************************************************* */
/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function (guest_id, limit = 10) {
  return getAllProperties(null, 2);
};

/* ******************************************************* */

// The function executes a SQL query that selects all columns from the properties table and limits the number of results to the value of the limit parameter. 

const getAllProperties = (options, limit = 10) => {
  // 1 Setup an array to hold any parameters that may be available for the query
  const queryParams = [];
  // 2 A new query string is initialized to start selecting all properties and their average rating from the "properties" table, joined with the "property_reviews" table.
  let queryString = `
SELECT properties.*, avg(property_reviews.rating) as average_rating
FROM properties
JOIN property_reviews ON 
properties.id
= property_id
`;

  // 3 Check if a city, owner_id or price_per_night has been passed in as an option. Add them to the params array and and appends the corresponding WHERE clause to the query string.
  if (
    options.city
  ) {
    queryParams.push(`%${options.city
      }%`);
    queryString += `WHERE city LIKE $${queryParams.length} `;
  }

  if (options.owner_id) {
    queryParams.push(options.owner_id);
    if (queryParams.length === 1) {
      queryString += `WHERE owner_id = $${queryParams.length} `;
    } else {
      queryString += `AND owner_id = $${queryParams.length} `;
    }
  }

  if (options.minimum_price_per_night && options.maximum_price_per_night) {
    queryParams.push(options.minimum_price_per_night * 100, options.maximum_price_per_night * 100);
    if (queryParams.length === 2) {
      queryString += `WHERE cost_per_night >= $${queryParams.length - 1} AND cost_per_night <= $${queryParams.length} `;
    } else {
      queryString += `AND cost_per_night >= $${queryParams.length - 1} AND cost_per_night <= $${queryParams.length} `;
    }
  }

  // 4 Add any query that comes after the WHERE clause.
  queryString += `
GROUP BY 
properties.id

`;

  if (options.minimum_rating) {
    queryParams.push(options.minimum_rating);
    queryString += `HAVING avg(property_reviews.rating) >= $${queryParams.length} `;
  }

  queryParams.push(limit);
  queryString += `
ORDER BY cost_per_night
LIMIT $${queryParams.length};
`;

  // 5 Console log everything just to make sure we've done it right.
  console.log(queryString, queryParams);

  // 6 Run the query.
  return db.query(queryString, queryParams)
    .then(res => res.rows);
};


/* ******************************************************* */

/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function (property) {
  const propertyId = Object.keys(properties).length + 1;
  property.id = propertyId;
  properties[propertyId] = property;
  return Promise.resolve(property);
};

module.exports = {
  db,
  getUserWithEmail,
  getUserWithId,
  addUser,
  getAllReservations,
  getAllProperties,
  addProperty,
};
