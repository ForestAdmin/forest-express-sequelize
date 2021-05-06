import ResourcesRemover from './resources-remover';

/**
 * Kept for retro-compatibility with forest-express.
 */
class ResourceRemover extends ResourcesRemover {
  constructor(model, params, user) {
    super(model, params, [params.recordId], user);
  }
}

module.exports = ResourceRemover;
