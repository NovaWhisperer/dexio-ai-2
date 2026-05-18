import { doubleCsrf } from "csrf-csrf"
import { JWT_SECRET } from "../../config/index.js"

const {generateCsrfToken,doubleCsrfProtection} = doubleCsrf({
    getSecret: () => JWT_SECRET,
    getSessionIdentifier: (req) => req.ip,
    ignoredMethods: ["GET", "HEAD", "OPTIONS"],
    getCsrfTokenFromRequest: (req) => req.headers["x-csrf-token"]
})


export  {generateCsrfToken,doubleCsrfProtection}
