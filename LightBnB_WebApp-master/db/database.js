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

const getAllReservations = function (guest_id, limit = 10) {
  const queryString = `
    SELECT reservations.*, properties.*, AVG(property_reviews.rating) AS average_rating
    FROM reservations
    JOIN properties ON reservations.property_id = properties.id
    JOIN property_reviews ON properties.id = property_reviews.property_id
    WHERE reservations.guest_id = $1 AND end_date < NOW()::date
    GROUP BY reservations.id, properties.id
    ORDER BY start_date
    LIMIT $2;
  `;
  const values = [guest_id, limit];
  return pool
    .query(queryString, values)
    .then((res) => res.rows)
    .catch((err) => console.error(err.message));
};
/* ******************************************************* */

const getAllProperties = function (options, limit = 10) {
  const queryParams = [];
  let queryString = `
    SELECT properties.*, AVG(property_reviews.rating) AS average_rating
    FROM properties
    JOIN property_reviews ON properties.id = property_id
  `;

  // clauses that need to be added based on the options provided
  const whereClauses = [];
  // check if owner_id is provided and add it to the WHERE clause
  if (options.owner_id) {
    queryParams.push(options.owner_id);
    whereClauses.push(`properties.owner_id = $${queryParams.length}`);
  }

  // check if minimum_price_per_night and maximum_price_per_night are provided and add them to the WHERE clause
  if (options.minimum_price_per_night && options.maximum_price_per_night) {
    queryParams.push(options.minimum_price_per_night);
    queryParams.push(options.maximum_price_per_night);
    whereClauses.push(`properties.cost_per_night >= $${queryParams.length - 1} AND properties.cost_per_night <= $${queryParams.length}`);
  } else if (options.minimum_price_per_night) {
    queryParams.push(options.minimum_price_per_night);
    whereClauses.push(`properties.cost_per_night >= $${queryParams.length}`);
  } else if (options.maximum_price_per_night) {
    queryParams.push(options.maximum_price_per_night);
    whereClauses.push(`properties.cost_per_night <= $${queryParams.length}`);
  }

  // check if minimum_rating is provided and add it to the WHERE clause
  if (options.minimum_rating) {
    queryParams.push(options.minimum_rating);
    whereClauses.push(`property_reviews.rating >= $${queryParams.length}`);
  }

  // add the WHERE clause to the query if there are any filters
  if (whereClauses.length > 0) {
    queryString += `WHERE ${whereClauses.join(' AND ')} `;
  }

  queryParams.push(limit);
  queryString += `
    GROUP BY properties.id
    ORDER BY cost_per_night
    LIMIT $${queryParams.length};
  `;

  console.log(queryString, queryParams);

  return pool.query(queryString, queryParams).then((res) => res.rows);
};



/* ******************************************************* */


const addProperty = function (property) {
  console.log("property value is:", property);
  const { owner_id,
    title,
    description,
    thumbnail_photo_url,
    cover_photo_url,
    cost_per_night,
    street,
    city,
    province,
    post_code,
    country,
    parking_spaces,
    number_of_bathrooms,
    number_of_bedrooms
  } = property;
  //return;

  const query = `
    INSERT INTO properties (
      owner_id,
      title,
      description,
      thumbnail_photo_url,
      cover_photo_url,
      cost_per_night,
      street,
      city,
      province,
      post_code,
      country,
      parking_spaces,
      number_of_bathrooms,
      number_of_bedrooms
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    RETURNING *;
  `;
  const values = [owner_id, title, description, thumbnail_photo_url, cover_photo_url, cost_per_night, street, city, province, post_code, country, parking_spaces, number_of_bathrooms, number_of_bedrooms
  ];

  return pool
    .query(query, values)
    .then((res) => {
      console.log("res value is:", res);
      return res.rows[0];
    })
    .catch((err) => console.error(err));
};


/* ******************************************************* */

module.exports = {
  db,
  getUserWithEmail,
  getUserWithId,
  addUser,
  getAllReservations,
  getAllProperties,
  addProperty,
};
