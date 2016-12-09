import { ProjectCredentialsConfig } from 'sphere-node-utils'

const getApiCredentials = (projectKey, accessToken) => {
  if (!projectKey)
    return Promise.reject(new Error('Project Key is needed'))

  if (accessToken)
    return Promise.resolve({ project_key: projectKey })

  return ProjectCredentialsConfig.create()
    .then(credentials =>
      credentials.enrichCredentials({
        project_key: projectKey,
      })
    )
}

export default getApiCredentials
