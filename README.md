# Spotify Public Likes
![Build and deploy to Azure](https://github.com/pl4nty/spotify-public-likes/workflows/Build%20and%20deploy%20to%20Azure/badge.svg)

Source code for some Azure Functions that sync liked Spotify songs to a public playlist, using CosmosDB for state.

[![Sign up with Spotify](https://github.com/pl4nty/spotify-public-likes/blob/main/signup.png?raw=true)](https://spotify.tplant.com.au/)

Want to stop the sync? Just delete the public playlist.

# Self-hosting
## Prerequisites
* Azure account
* Spotify account
* [Spotify application](https://developer.spotify.com/documentation/general/guides/app-settings/)

## Setup
1. Fork this repo
2. [Click here to deploy to Azure](https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2Fpl4nty%2Fspotify-public-likes%2Fmain%2Fazuredeploy.json)
3. [Add a custom domain](https://docs.microsoft.com/en-us/azure/app-service/app-service-web-tutorial-custom-domain#map-your-domain) and [enable SSL](https://docs.microsoft.com/en-us/azure/app-service/configure-ssl-bindings#secure-a-custom-domain) (optional)
4. Configure the following [Function environment variables](https://docs.microsoft.com/en-us/azure/azure-functions/functions-how-to-use-azure-function-app-settings):

Variable | Description
-|-
`SPOTIFY_CLIENT_ID` |
`SPOTIFY_CLIENT_SECRET` |
`COSMOSDB_KEY` | Primary Key from the DB's Keys blade

5. Navigate to the Function's Overview blade
6. Copy the Function URL and [add a redirect URI](https://developer.spotify.com/documentation/general/guides/app-settings/) to your Spotify application in the format `URL/AddUser`
7. Use the "Get publish profile" button to download a publish profile file
7. Add the file's contents to your fork as a [GitHub secret](https://docs.github.com/en/free-pro-team@latest/actions/reference/encrypted-secrets#creating-encrypted-secrets-for-a-repository), called `AZURE_FUNCTIONAPP_PUBLISH_PROFILE`
8. Add the Function's name as a GitHub secret, called `AZURE_FUNCTIONAPP_NAME`
8. [Manually trigger the GitHub Action](https://github.blog/changelog/2020-07-06-github-actions-manual-triggers-with-workflow_dispatch/)