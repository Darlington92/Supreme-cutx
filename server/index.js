import 'dotenv/config'
import { createApp } from './app.js'
import { connectDatabase } from './config/db.js'

const port = Number(process.env.PORT || 3000)
const app = createApp()

try {
  await connectDatabase()
  app.listen(port, () => {
    console.log(`API listening on port ${port}`)
  })
} catch (error) {
  console.error('Unable to start server:', error.message)
  process.exit(1)
}
