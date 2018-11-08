const GitHub = require('github-api');
const nconf = require('nconf');
const prompts = require('prompts');

nconf.argv().env('__');

const config = nconf.get();

/**
 * Get the property from config, or by input prompt
 * @param name
 * @param message
 * @param type
 * @returns {Promise<*>}
 */
async function ask (name, message, type = 'text') {
    if (config[name]) {
        console.log(`${message}: ${name}`);
        return config[name];
    }
    const result = await prompts({
        type: type,
        name: name,
        message: message
    });
    return result[name];
}

/**
 * Update all the PRs from old branch to new base branch
 * All values will be prompted for if not in config
 * @returns {Promise<void>}
 */
async function updatePRs () {
    const gh = new GitHub({ token: await ask('token', 'GitHub OAUTH token') });
    const repo = await gh.getRepo(await ask('username', 'GitHub username'), await ask('repo', 'GitHub repository'));
    const response = await repo.listPullRequests({ state: 'open', base: await ask('old', 'Old base branch') });
    if(response.data.length < 1) {
        console.log('No PRs were found matching the old base branch');
        return;
    }
    const branch = await ask('branch', 'New base branch');
    console.log(`Updating ${response.data.length} PRs...`);
    const prs = await Promise.all(response.data.map(pr => repo.updatePullRequest(pr.number, { base: branch })));
    console.log(`Finished updating ${prs ? prs.length : 0 } PRs to the new base branch`);
}

/**
 * The menu showing all options
 * @returns {Promise<*>}
 */
async function chooseOption () {
    const choice = await prompts({
        type: 'select',
        name: 'value',
        message: 'What would you like to do?',
        choices: [
            { title: 'Update the base branch for pull requests', value: 'updatePRs' }
        ],
        initial: 0
    });
    switch (choice.value) {
        case 'updatePRs':
            return await updatePRs();
        default:
            return choice.value;
    }
}

chooseOption()
    .then(() => console.log(`Goodbye`))
    .catch(err => console.error(err));


