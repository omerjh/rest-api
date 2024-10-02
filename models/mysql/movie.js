import mysql from 'mysql2/promise'
import { randomUUID } from 'node:crypto'

const DEFAULT_CONFIG = {
  host: 'localhost',
  user: 'root',
  port: 3306,
  password: '',
  database: 'moviesdb'
}

const connectionString = process.env.DATABASE_URL ?? DEFAULT_CONFIG
const connection = await mysql.createConnection(connectionString)

export class MovieModel {
  static async getAll ({ genre }) {
    if (genre) {
      const lowerCaseGenre = genre.toLowerCase()

      const [genres] = await connection.query(
        'SELECT id, name FROM genre WHERE LOWER(name) = ?;',
        [lowerCaseGenre]
      )

      if (genres.length === 0) return []

      const [{ id }] = genres

      const [movies] = await connection.query(
        `SELECT CONCAT(
                SUBSTRING(CONVERT(id USING utf8), 1, 8), '-',
                SUBSTRING(CONVERT(id USING utf8), 9, 4), '-',
                SUBSTRING(CONVERT(id USING utf8), 13, 4), '-',
                SUBSTRING(CONVERT(id USING utf8), 17, 4), '-',
                SUBSTRING(CONVERT(id USING utf8), 21)
                )  AS id, title, year, director, duration, poster, rate 
        FROM movies AS m JOIN movie_genres AS mg ON mg.movie_id = m.id WHERE genre_id = ? ;
        `,
        [id]
      )
      return movies
      // console.log(genres)
    }

    const [movies] = await connection.query(
      `SELECT CONCAT(
                SUBSTRING(CONVERT(id USING utf8), 1, 8), '-',
                SUBSTRING(CONVERT(id USING utf8), 9, 4), '-',
                SUBSTRING(CONVERT(id USING utf8), 13, 4), '-',
                SUBSTRING(CONVERT(id USING utf8), 17, 4), '-',
                SUBSTRING(CONVERT(id USING utf8), 21)
              ) AS id, title, year, director, duration, poster, rate 
      FROM movies;`
    )

    return movies
  }

  static async getById ({ id }) {
    const [movies] = await connection.query(
      `SELECT CONCAT(
                SUBSTRING(CONVERT(id USING utf8), 1, 8), '-',
                SUBSTRING(CONVERT(id USING utf8), 9, 4), '-',
                SUBSTRING(CONVERT(id USING utf8), 13, 4), '-',
                SUBSTRING(CONVERT(id USING utf8), 17, 4), '-',
                SUBSTRING(CONVERT(id USING utf8), 21)
              ) AS id, title, year, director, duration, poster, rate 
      FROM movies WHERE id = ?;`,
      [id.replace(/-/g, '')]
    )

    return movies
  }

  static async create ({ input }) {
    const {
      // genre: genreInput, // genre is an array
      title,
      year,
      director,
      duration,
      rate,
      poster
    } = input

    const id = randomUUID()

    try {
      await connection.query(
        `INSERT INTO movies (id, title, year, duration, director, poster, rate) VALUES 
        (?, ?, ?, ?, ?, ?, ?)`,
        [id.replace(/-/g, ''), title, year, duration, director, poster, rate]
      )
    } catch (e) {
      // puede enviarle información sensible
      throw new Error('Error creating movie ' + e)
      // enviar la traza a un servicio interno
      // sendLog(e)
    }

    const movie = await MovieModel.getById({ id })
    return movie
  }

  static async delete ({ id }) {
    try {
      const [result] = await connection.query(
        'DELETE FROM movies WHERE id = ?;',
        [id.replace(/-/g, '')]
      )
      return result.affectedRows > 0
    } catch (e) {
      // puede enviarle información sensible
      throw new Error('Error creating movie ' + e)
      // enviar la traza a un servicio interno
      // sendLog(e)
    }
  }

  static async update ({ id, input }) {
    try {
      const updates = []
      const values = []

      for (const [key, value] of Object.entries(input)) {
        updates.push(`${key} = ?`)
        values.push(value)
      }

      if (updates.length === 0) throw new Error('No ha pasado los datos')

      values.push(id.replace(/-/g, ''))

      const [result] = await connection.query(
        `UPDATE movies SET ${updates.join(',')} WHERE id = ?;`,
        values
      )

      // console.log(`UPDATE movies SET ${updates.join(',')} WHERE id = ?;`, values)

      if (result.affectedRows > 0) {
        const movie = await MovieModel.getById({ id })
        return movie
      } else {
        return false
      }

      // return result.affectedRows > 0
    } catch (e) {
      // puede enviarle información sensible
      throw new Error('Error creating movie ' + e)
      // enviar la traza a un servicio interno
      // sendLog(e)
    }
  }
}
