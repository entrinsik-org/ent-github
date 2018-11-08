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
        console.log(`${message}: ${config[name]}`);
        return config[name];
    }
    const result = await prompts({
        type: type,
        name: name,
        message: message,
        validate: value => !!value
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
    const old = await ask('old', 'Old base branch');
    const branch = await ask('branch', 'New base branch');
    if(old === branch) {
        console.log('New branch cannot be the same as the old branch');
        return;
    }

    let response;
    let updated = 0;
    do {
        response = await repo.listPullRequests({ state: 'open', base: old });
        if (!response.data.length) {
            console.log(`${updated === 0 ? 'No' : 'No more'} open PRs were found for branch ${old}`);
            break;
        }
        console.log(`Updating ${response.data.length} PRs to base branch ${branch}...`);
        await Promise.all(response.data.map(pr => repo.updatePullRequest(pr.number, { base: branch })));
        console.log(response.data.length === 30 ? `Done. Checking for more PRs...` : 'Done.');
        updated += response.data.length;
    }
    while (response.data.length === 30);
    if (updated) console.log(`Finished updating ${updated} PRs to base branch ${branch}`);

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


