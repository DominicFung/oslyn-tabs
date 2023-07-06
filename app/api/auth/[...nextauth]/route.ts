import NextAuth from "next-auth"
import FacebookProvider from "next-auth/providers/facebook"
import GoogleProvider from "next-auth/providers/google"

import { Amplify, API, graphqlOperation } from 'aws-amplify'
import { GraphQLResult } from "@aws-amplify/api"
import awsConfig from '@/src/aws-exports'

import * as m from '@/src/graphql/mutations'
import { User } from '@/src/API'

import secret from '@/secret.json'

const handler = NextAuth({
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
      console.log("User signin ...")
      console.log(account)
      console.log(profile)

      if (account && profile) {
        Amplify.configure(awsConfig)

        // create user only creates if EMAIL does not exist ..
        if (profile.email && profile.name) {
          let u = { username: profile.name, email: profile.email, provider: account.provider } as any
          
          // Google
          if ((profile as any).picture) u.imageUrl = (profile as any).picture
          if ((profile as any).given_name) u.firstName = (profile as any).given_name
          if ((profile as any).family_name) u.lastName = (profile as any).family_name

          const d = await API.graphql(graphqlOperation(m.createUser, u)) as GraphQLResult<{ createUser: User }>
          console.log(d)

          console.log("User updated.")
        } else { console.log("User did NOT get update.") }
      }

      return token
    } 
  }
})

export { handler as GET, handler as POST }

/**

{
  provider: 'google',
  type: 'oauth',
  providerAccountId: '116162035704812410432',
  access_token: 'ya29.a0AbVbY6OfBJWaWl2XDiolx2Cjw6NlirdS-ZnBfXxWQYyK4xpZnMiyfMmIxx8xBFjc3D2SOV6NHn_kLuTtopvgPBYyUA_-RWDAfe1vZSFKTi5Y3eDubtDjeXm5WjAqGbbNJr81YTb5XKp2w1mJev_SleQ-rQrjaCgYKAcgSARESFQFWKvPlGgx_Kq1t1oJd6TWKFz4N7A0163',
  expires_at: 1688595012,
  scope: 'openid https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
  token_type: 'Bearer',
  id_token: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjkzNDFkZWRlZWUyZDE4NjliNjU3ZmE5MzAzMDAwODJmZTI2YjNkOTIiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiI5MDAwMTI1MDg3OTUtcDc0NWdsbzQ4MHNqdG5jbzFzdHF2N2FtNHJqMjJkbnMuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiI5MDAwMTI1MDg3OTUtcDc0NWdsbzQ4MHNqdG5jbzFzdHF2N2FtNHJqMjJkbnMuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMTYxNjIwMzU3MDQ4MTI0MTA0MzIiLCJlbWFpbCI6Im1pc3Npb24ucG9zc2libGVmb3JzdXJlQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJhdF9oYXNoIjoiOXVLZ2FMOHRsNno4VWJWNlpCVXNpQSIsIm5hbWUiOiJEb21pbmljIEZ1bmciLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUFjSFR0ZGl0clBISGNyZ254SVRZdms0ZHRFVXJHR2VDWWNFMDRKU1ZOc05NR1dUOEJFPXM5Ni1jIiwiZ2l2ZW5fbmFtZSI6IkRvbWluaWMiLCJmYW1pbHlfbmFtZSI6IkZ1bmciLCJsb2NhbGUiOiJlbiIsImlhdCI6MTY4ODU5MTQxMywiZXhwIjoxNjg4NTk1MDEzfQ.mVGU4ss8_2Tq7LtvsEfgHK0t9R9ZOAu7nsm-i-JERsC9JDd0yRCHnfAPJVNbAlP6jcuQ6GJGVkHssS_OOwZ1vTjtIN0dMoGhcfCbjXkWLZeBoBSAx3_qxsEd7_XTE29Sik2CZWjTtoQdxsdtX10KHPD0l0aj240_6GFF5bdfUtmMKJcsg1VxZptt1cKHo_lc5y-zhVTP2kHXUf_JMLsDMHasWuBA4gnuyk0nM-AW4zEq35ow6nRRWr1OFDsxfUBQ460ruHhvvJS_-KfdFI2KaIt4N3rckH_YDc7maDd4Nd5CMx9PvSR_HXZ0rc-tylCcRpm0rpaphI_mOMdcQOk-TQ'
}
{
  iss: 'https://accounts.google.com',
  azp: '900012508795-p745glo480sjtnco1stqv7am4rj22dns.apps.googleusercontent.com',
  aud: '900012508795-p745glo480sjtnco1stqv7am4rj22dns.apps.googleusercontent.com',
  sub: '116162035704812410432',
  email: 'mission.possibleforsure@gmail.com',
  email_verified: true,
  at_hash: '9uKgaL8tl6z8UbV6ZBUsiA',
  name: 'Dominic Fung',
  picture: 'https://lh3.googleusercontent.com/a/AAcHTtditrPHHcrgnxITYvk4dtEUrGGeCYcE04JSVNsNMGWT8BE=s96-c',
  given_name: 'Dominic',
  family_name: 'Fung',
  locale: 'en',
  iat: 1688591413,
  exp: 1688595013
}

 */