import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import dotenv from 'dotenv'
import { findOrCreateGoogleUser, findUserById } from '../lib/userRepository.js'

dotenv.config()

export function configurePassport () {
  passport.serializeUser((user, done) => {
    done(null, user.id)
  })

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await findUserById(id)
      done(null, user)
    } catch (err) {
      done(err)
    }
  })

  const {
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_CALLBACK_URL
  } = process.env

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_CALLBACK_URL) {
    console.warn('[passport] Google OAuth credentials are not fully configured.')
  }

  passport.use(new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID ?? '',
      clientSecret: GOOGLE_CLIENT_SECRET ?? '',
      callbackURL: GOOGLE_CALLBACK_URL ?? '',
      scope: ['profile', 'email']
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const primaryEmail = profile?.emails?.[0]?.value
        const fullName = profile?.displayName ?? ''
        const googleId = profile?.id ?? ''
        const user = await findOrCreateGoogleUser({
          email: primaryEmail,
          name: fullName,
          googleId
        })
        done(null, user)
      } catch (err) {
        done(err)
      }
    }
  ))

  return passport
}

export default passport
