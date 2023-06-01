# Spotify Public Likes
[![Website status](https://img.shields.io/website?down_color=red&down_message=offline&up_color=success&up_message=online&url=https%3A%2F%2Fspotify-public-likes.lab.tplant.com.au%2F&logo=microsoft-azure&logoColor=white)](https://spotify-public-likes.lab.tplant.com.au/)
[![Build status](https://img.shields.io/github/actions/workflow/status/pl4nty/spotify-public-likes/main.yml?logo=github&logoColor=white)](https://github.com/pl4nty/spotify-public-likes/actions/workflows/main.yml)
![Test coverage](https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/pl4nty/342ee9e95e5604afaa2ee223f30f4dbd/raw/coverage.json)

Source code for some Azure Functions that sync liked Spotify songs to a public playlist, using CosmosDB for state.

[![Sign up with Spotify](https://github.com/pl4nty/spotify-public-likes/blob/main/signup.png?raw=true)](https://spotify-public-likes.lab.tplant.com.au/)

Want to stop the sync? Just delete the public playlist.

## Self-hosting
Note that Functions are hosted on the cheaper Consumption plan by default, so can't be hosted in a VNet and require CosmosDB to be open to the internet.
### Prerequisites
* Azure account
* Spotify account
* [Spotify application](https://developer.spotify.com/documentation/general/guides/app-settings/)

### Setup
1. Fork this repo
2. [Click here to deploy to Azure](https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2Fpl4nty%2Fspotify-public-likes%2Fmain%2Fazuredeploy.json)
3. [Add a custom domain](https://docs.microsoft.com/en-us/azure/app-service/app-service-web-tutorial-custom-domain#map-your-domain) and [enable SSL](https://docs.microsoft.com/en-us/azure/app-service/configure-ssl-bindings#secure-a-custom-domain) (optional)
4. Configure the following [Function environment variables](https://docs.microsoft.com/en-us/azure/azure-functions/functions-how-to-use-azure-function-app-settings):

Variable | Description
-|-
`SPOTIFY_CLIENT_ID` |
`SPOTIFY_CLIENT_SECRET` |
`COSMOSDB_KEY` | Primary Key from the DB's Keys blade
`FUNCTION_URL` | URL from the Function's Overview blade
`FUNCTION_KEY` | Function key from the `SyncPlaylist` function's Function Keys blade 

5. [Add a redirect URI](https://developer.spotify.com/documentation/general/guides/app-settings/) to your Spotify application in the format `FUNCTION_URL/AddUser`
6. Use the "Get publish profile" button on the Function's Overview blade to download a publish profile file
7. Add the file's contents to your fork as a [GitHub secret](https://docs.github.com/en/free-pro-team@latest/actions/reference/encrypted-secrets#creating-encrypted-secrets-for-a-repository), called `AZURE_FUNCTIONAPP_PUBLISH_PROFILE`
8. Add the Function's name as a GitHub secret, called `AZURE_FUNCTIONAPP_NAME`
9. [Manually trigger the GitHub Action](https://github.blog/changelog/2020-07-06-github-actions-manual-triggers-with-workflow_dispatch/)
