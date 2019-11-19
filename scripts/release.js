require('dotenv').config();
const { ReleaseManager, ReleaseNoteManager } = require('@forestadmin/devops');

const { DEVOPS_SLACK_TOKEN, DEVOPS_SLACK_CHANNEL } = process.env;
const OPTIONS = { releaseIcon: '🌱', withVersion: true };

new ReleaseManager(OPTIONS).create()
  .then(() => new ReleaseNoteManager(DEVOPS_SLACK_TOKEN, DEVOPS_SLACK_CHANNEL, OPTIONS).create());
