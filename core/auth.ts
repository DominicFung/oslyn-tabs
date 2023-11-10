import { NextAuthOptions } from "next-auth"
import FacebookProvider from "next-auth/providers/facebook"
import GoogleProvider from "next-auth/providers/google"

import { Amplify, API, graphqlOperation } from 'aws-amplify'
import { GraphQLResult } from "@aws-amplify/api"
import awsConfig from '@/src/aws-exports'

import * as m from '@/src/graphql/mutations'
import { User } from '@/src/API'

import secret from '@/secret.json'

export const authOptions: NextAuthOptions = {
  secret: secret.nextauth.NEXTAUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: secret.nextauth.google.GOOGLE_CLIENT_ID,
      clientSecret: secret.nextauth.google.GOOGLE_CLIENT_SECRET
    }),
    FacebookProvider({
      clientId: secret.nextauth.facebook.FACEBOOK_CLIENT_ID,
      clientSecret: secret.nextauth.facebook.FACEBOOK_CLIENT_SECRET
    })
  ],
  callbacks: {
    async jwt({token, account, profile}) {
      // console.log("User signin ...")
      // console.log(account)
      // console.log(profile)

      if (account && profile) {
        Amplify.configure(awsConfig)

        // create user only creates if EMAIL does not exist ..
        if (profile.email && profile.name) {
          let u = { username: profile.name, email: profile.email, provider: account.provider } as any
          
          // Google
          if (account.provider === "google") {
            if ((profile as any).picture) u.imageUrl = (profile as any).picture
            if ((profile as any).given_name) u.firstName = (profile as any).given_name
            if ((profile as any).family_name) u.lastName = (profile as any).family_name
          }
          
          // Facebook
          if (account.provider === "facebook") {
            //console.log((profile as any).picture.data)
            if ((profile as any).picture && (profile as any).picture.data.url) u.imageUrl = (profile as any).picture.data.url
          }
          
          const d = await API.graphql(graphqlOperation(m.createUser, u)) as GraphQLResult<{ createUser: User }>
          //console.log(d)

          //console.log("User updated.")
          if (d.data?.createUser) {
            //console.log(`user found: ${d.data.createUser.userId}`)
            return { ...token, userId: d.data.createUser.userId }
          } console.warn("createUser was not reaturned.")
        } else { console.log("User did NOT get update.") }
      }

      return token
    }, 

    async session({ session, token, user }) {
      // console.log("User Session ...")
      // console.log(session)
      // console.log(token)
      // console.log(user)

      if (session && token) {
        if (session.user && token.userId) {
          //console.log("adding userId to session")
          if (!(session.user as any).userId) { (session.user as any).userId = token.userId }
        } else if (token.userId) {
          (session as any).user = { userId: token.userID }
        } else if (session.user) {
          console.log("TODO: token.userId does not exist, fetch from DB")
        } else {
          console.log("TODO: token.userId does not exist, fetch from DB")
        }

      } else console.warn("session or token is missing")
      // console.log(session)
      return session
    }
  }
}
