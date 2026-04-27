import app from "./src/app.js"

import { PORT } from "./config/index.js"

app.listen(PORT, () => {
    console.log("Server is listenning on PORT", PORT)
})

