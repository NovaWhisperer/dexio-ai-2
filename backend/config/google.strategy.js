import GoogleStrategy from "passport-google-oauth20";
import passport from "passport";
import {
  BASE_URL,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
} from "../config/index.js";
import userModel from "../src/models/user.model.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: `${BASE_URL}/v1/auth/google/callback`,
    },
    async function (accessToken, refreshToken, profile, cb) {
      try {
        const user = await userModel.findOne({ googleID: profile.id });

        if (!user) {
          const newUser = await userModel.create({
            googleID: profile.id,
            fullName: {
              firstName: profile.name.givenName,
              lastName: profile.name.familyName,
            },
            email: profile.emails[0].value,
            verified: true,
          });
          return cb(null, newUser);
        }
        return cb(null, user);
      } catch (err) {
        cb(err);
      }
    },
  ),
);

export default passport;
