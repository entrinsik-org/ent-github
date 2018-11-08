# GitHub API Utility

A node app to help with some GitHub bulk functionality.  Right now it's just to bulk update the base branch on all PRs, which has to be done manually in the UI.

## To Run
`node index.js`

The program will prompt for all values.  You can provide them as application parameters if you use the same ones each time.

`node index.js --token=ABCDEFG --username=my-github-name --repo=my-github-repo`

## To get your token
Visit https://github.com/settings/tokens/new to create a new personal access token.