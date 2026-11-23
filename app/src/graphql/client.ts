import { Amplify } from 'aws-amplify'
import { generateClient } from 'aws-amplify/api'

import amplifyconfig from '../amplifyconfiguration.json'
import { graphqlData, graphqlMessage } from './result'

Amplify.configure(amplifyconfig)

const client = generateClient()

export async function gql<T>(query: string, variables?: object): Promise<{ data: T | null, error: string }> {
  try {
    const result = await client.graphql({ query, variables })
    return { data: graphqlData<T>(result), error: '' }
  } catch (error) {
    const data = graphqlData<T>(error)
    if (data) return { data, error: graphqlMessage(error) }
    console.log(JSON.stringify(error, null, 2))
    return { data: null, error: graphqlMessage(error) }
  }
}
