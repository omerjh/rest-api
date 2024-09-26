import cors from 'cors'

const ACCETED_ORIGINS = [
  'http://localhost:8080',
  'http://localhost:1234',
  'http://localhost:3000'
]
export const corsMiddleware = ({ acceptedOrigins = ACCETED_ORIGINS } = {}) => cors({
  origin: (origin, callback) => {
    if (ACCETED_ORIGINS.includes(origin)) {
      return callback(null, true)
    }

    if (!origin) {
      return callback(null, true)
    }

    return callback(new Error('Not allowed by CORS'))
  }
})
